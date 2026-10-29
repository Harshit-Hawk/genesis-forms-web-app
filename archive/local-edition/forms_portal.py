"""Local single-user Google Forms response portal."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json, os, secrets, threading, time, re, hashlib, hmac, socket

ROOT = os.path.dirname(os.path.abspath(__file__))
env_file = os.path.join(ROOT, ".env")
if os.path.isfile(env_file):
    try:
        with open(env_file, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    except Exception:
        pass

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
BASE_URL = os.getenv("PORTAL_URL", "http://localhost:8000")
REDIRECT_URI = BASE_URL.rstrip("/") + "/oauth/callback"
SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly"
DATA_FILE = os.path.join(ROOT, "portal_data.json")
LOCK = threading.Lock()

def hash_pass(pwd, salt):
    return hashlib.pbkdf2_hmac("sha256", pwd.encode("utf-8"), salt.encode("utf-8"), 100000).hex()

def verify_pass(pwd, salt, expected_hash):
    computed = hash_pass(pwd, salt)
    return hmac.compare_digest(computed, expected_hash)

class GoogleQuotaExceeded(Exception):
    pass

GLOBAL_CACHE = {
    "responses": [],
    "last_sync": 0,
    "rate_limited_until": 0
}

def load_data():
    data = {"forms": [], "token": {}, "attendance": {}, "users": {}, "sessions": {}, "cached_responses": {}}
    if os.path.isfile(DATA_FILE):
        try:
            with open(DATA_FILE, encoding="utf-8") as f:
                d = json.load(f)
                if isinstance(d, dict):
                    forms = d.get("forms")
                    data["forms"] = forms if isinstance(forms, list) else []
                    token = d.get("token")
                    data["token"] = token if isinstance(token, dict) else {}
                    att = d.get("attendance")
                    data["attendance"] = att if isinstance(att, dict) else {}
                    users = d.get("users")
                    data["users"] = users if isinstance(users, dict) else {}
                    sessions = d.get("sessions")
                    data["sessions"] = sessions if isinstance(sessions, dict) else {}
                    cached = d.get("cached_responses")
                    data["cached_responses"] = cached if isinstance(cached, dict) else {}
        except Exception:
            pass
    # Seed default user if no users exist
    if not data["users"]:
        salt = secrets.token_hex(16)
        email = "harshitgujjar73@gmail.com"
        data["users"][email] = {
            "email": email,
            "salt": salt,
            "hash": hash_pass("admin123", salt),
            "created_at": time.time()
        }
        save_data(data)
    return data

def save_data(data):
    if not isinstance(data, dict):
        data = {"forms": [], "token": {}, "attendance": {}, "users": {}, "sessions": {}, "cached_responses": {}}
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, DATA_FILE)

def get_auth_user(headers, data):
    auth = headers.get("Authorization", "")
    token = ""
    if auth.startswith("Bearer "): token = auth[7:].strip()
    if not token: token = headers.get("x-auth-token", "").strip()
    if not token:
        cookies = dict((x.strip().split("=", 1) for x in headers.get("Cookie", "").split(";") if "=" in x))
        token = cookies.get("gf_session", "")
    if not token: return None
    sess = (data.get("sessions") or {}).get(token)
    if sess and sess.get("expires_at", 0) > time.time():
        return sess.get("email")
    return None

def api_json(url, data=None, headers=None):
    body = json.dumps(data).encode() if data is not None else None
    req = Request(url, data=body, headers={"Content-Type": "application/json", **(headers or {})}, method="POST" if body else "GET")
    try:
        with urlopen(req, timeout=25) as res: return json.loads(res.read().decode())
    except HTTPError as e:
        try: detail = e.read().decode()
        except Exception: detail = str(e)
        if e.code == 429 or "RESOURCE_EXHAUSTED" in detail or "quota" in detail.lower():
            raise GoogleQuotaExceeded(detail[:500])
        raise RuntimeError(detail[:500])

def refresh_token(data):
    token = data.get("token") or {}
    if token.get("access_token") and token.get("expires_at", 0) > time.time() + 60: return token["access_token"]
    if not token.get("refresh_token"): raise RuntimeError("Reconnect Google to authorize access to response sheets.")
    form = urlencode({"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "refresh_token": token["refresh_token"], "grant_type": "refresh_token"}).encode()
    req = Request("https://oauth2.googleapis.com/token", data=form, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urlopen(req, timeout=20) as res: fresh = json.loads(res.read().decode())
    token.update(fresh); token["expires_at"] = time.time() + int(fresh.get("expires_in", 3600)); data["token"] = token; save_data(data)
    return token["access_token"]

def sheet_id(value):
    m = re.search(r"/spreadsheets/d/([\w-]+)", value)
    return m.group(1) if m else value.strip()

class DualStackServer(ThreadingHTTPServer):
    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def send_json(self, status, payload, extra_headers=None):
        b = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "*")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
    def body(self):
        return json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0")) or 0) or b"{}")
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            try: b = open(os.path.join(ROOT, "portal.html"), "rb").read()
            except OSError: return self.send_error(404, "portal.html not found")
            self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b); return
        if path == "/manifest.json":
            manifest = {
                "name": "Genesis Forms · Event Registration Desk",
                "short_name": "Genesis Desk",
                "description": "Event Check-In, Verification & Attendance Desk for 30 & 31 Oct",
                "start_url": "/",
                "display": "standalone",
                "background_color": "#f6f8f5",
                "theme_color": "#22593b",
                "icons": [
                    {
                        "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%2322593b'/%3E%3Ctext x='50' y='68' font-size='56' font-family='sans-serif' font-weight='800' fill='white' text-anchor='middle'%3EG%3C/text%3E%3C/svg%3E",
                        "sizes": "192x192 512x512",
                        "type": "image/svg+xml",
                        "purpose": "any maskable"
                    }
                ]
            }
            return self.send_json(200, manifest)
        if path == "/sw.js":
            sw_code = b"""// Genesis Desk Service Worker - PWA Offline Caching
const CACHE_NAME = 'genesis-desk-v1';
const PRECACHE = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/'))
        );
        return;
    }
    if (event.request.url.includes('/api/')) {
        return;
    }
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetched = fetch(event.request).then((res) => {
                if (res.status === 200) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return res;
            }).catch(() => cached);
            return cached || fetched;
        })
    );
});
"""
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(sw_code)))
            self.end_headers()
            self.wfile.write(sw_code)
            return
        if path == "/api/auth/me":
            d = load_data()
            email = get_auth_user(self.headers, d)
            if email:
                return self.send_json(200, {"user": {"email": email}})
            return self.send_json(401, {"error": "Unauthorized"})
        if path == "/api/config":
            d = load_data()
            tok = d.get("token") or {}
            return self.send_json(200, {"configured": bool(CLIENT_ID and CLIENT_SECRET), "connected": bool(tok.get("refresh_token") or tok.get("access_token"))})
        if path == "/oauth/start":
            if not CLIENT_ID or not CLIENT_SECRET: return self.send_json(400, {"error": "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first."})
            state = secrets.token_urlsafe(24)
            params = {"client_id": CLIENT_ID, "redirect_uri": REDIRECT_URI, "response_type": "code", "scope": SCOPES, "access_type": "offline", "prompt": "consent", "state": state}
            self.send_response(302); self.send_header("Location", "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)); self.send_header("Set-Cookie", f"oauth_state={state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600"); self.end_headers(); return
        if path == "/oauth/callback":
            q = parse_qs(urlparse(self.path).query); code = q.get("code", [""])[0]; state = q.get("state", [""])[0]
            cookies = dict((x.strip().split("=", 1) for x in self.headers.get("Cookie", "").split(";") if "=" in x))
            if not code or not state or state != cookies.get("oauth_state"): return self.send_error(400, "Google authorization state check failed. Please reconnect.")
            form = urlencode({"code": code, "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "redirect_uri": REDIRECT_URI, "grant_type": "authorization_code"}).encode()
            try:
                req = Request("https://oauth2.googleapis.com/token", data=form, headers={"Content-Type": "application/x-www-form-urlencoded"})
                with urlopen(req, timeout=20) as res: token = json.loads(res.read().decode())
                token["expires_at"] = time.time() + int(token.get("expires_in", 3600))
                with LOCK:
                    d = load_data()
                    old_token = d.get("token") or {}
                    if not token.get("refresh_token"):
                        token["refresh_token"] = old_token.get("refresh_token")
                    d["token"] = token
                    save_data(d)
                self.send_response(302); self.send_header("Location", "/?connected=1"); self.send_header("Set-Cookie", "oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"); self.end_headers()
            except HTTPError as e:
                try: err_body = e.read().decode()
                except Exception: err_body = str(e)
                return self.send_error(502, f"Google token exchange failed: {e} - {err_body}")
            except Exception as e:
                return self.send_error(502, "Google token exchange failed: " + str(e))
            return
        if path == "/api/forms": return self.send_json(200, {"forms": load_data()["forms"]})
        if path == "/api/responses":
            data = load_data()
            att_dict = data.get("attendance") or {}
            now = time.time()
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            force = "1" in query.get("force", [])
            cache_ttl = 45  # seconds

            is_rate_limited = now < GLOBAL_CACHE.get("rate_limited_until", 0)
            can_use_cache = (not force and (now - GLOBAL_CACHE.get("last_sync", 0) < cache_ttl)) or is_rate_limited

            # Populate in-memory cache from portal_data.json if empty
            cached_rows = GLOBAL_CACHE.get("responses", [])
            cached_forms = data.get("cached_responses") or {}
            if not cached_rows and cached_forms:
                for f_id, form_rows in cached_forms.items():
                    cached_rows.extend(form_rows)
                GLOBAL_CACHE["responses"] = cached_rows

            if can_use_cache and cached_rows:
                updated_rows = []
                for r in cached_rows:
                    row_copy = dict(r)
                    row_copy["attendance"] = att_dict.get(r["id"], {})
                    updated_rows.append(row_copy)
                warning = None
                if is_rate_limited:
                    wait_secs = max(1, int(GLOBAL_CACHE["rate_limited_until"] - now))
                    warning = f"Google Sheets quota recovering. Showing cached registrations. Live sync in {wait_secs}s."
                return self.send_json(200, {
                    "responses": updated_rows,
                    "attendance": att_dict,
                    "synced_at": GLOBAL_CACHE.get("last_sync") or now,
                    "cached": True,
                    "warning": warning
                })

            try:
                access = refresh_token(data)
                result = []
                cached_forms = data.setdefault("cached_responses", {})
                rate_limited_hit = False

                for form in data["forms"]:
                    f_id = form["id"]
                    if rate_limited_hit:
                        result.extend(cached_forms.get(f_id, []))
                        continue
                    try:
                        url = "https://sheets.googleapis.com/v4/spreadsheets/" + form["sheet_id"] + "/values/" + __import__("urllib.parse", fromlist=["quote"]).quote("A:ZZ", safe=":")
                        values = api_json(url, headers={"Authorization": "Bearer " + access}).get("values", [])
                        headers = values[0] if values else []
                        form_rows = []
                        for idx, row in enumerate(values[1:], start=2):
                            row_id = f"{f_id}:{idx}"
                            record = {headers[i] if i < len(headers) and headers[i] else f"Column {i+1}": cell for i, cell in enumerate(row)}
                            form_rows.append({"id": row_id, "form": form["name"], "form_id": f_id, "submitted": row[0] if row else "", "answers": record})
                        cached_forms[f_id] = form_rows
                        result.extend(form_rows)
                    except GoogleQuotaExceeded:
                        rate_limited_hit = True
                        GLOBAL_CACHE["rate_limited_until"] = now + 65
                        result.extend(cached_forms.get(f_id, []))
                    except Exception as sheet_err:
                        result.extend(cached_forms.get(f_id, []))

                data["cached_responses"] = cached_forms
                data["last_synced_at"] = now
                save_data(data)

                GLOBAL_CACHE["responses"] = result
                GLOBAL_CACHE["last_sync"] = now

                response_payload = []
                for r in result:
                    item = dict(r)
                    item["attendance"] = att_dict.get(r["id"], {})
                    response_payload.append(item)

                warning = None
                if rate_limited_hit:
                    warning = "Google Sheets rate limit reached (17 sheets connected). Showing cached responses. Auto-sync will resume in ~60s."

                return self.send_json(200, {
                    "responses": response_payload,
                    "attendance": att_dict,
                    "synced_at": now,
                    "cached": rate_limited_hit,
                    "warning": warning
                })
            except Exception as e:
                if cached_rows:
                    updated_rows = []
                    for r in cached_rows:
                        row_copy = dict(r)
                        row_copy["attendance"] = att_dict.get(r["id"], {})
                        updated_rows.append(row_copy)
                    return self.send_json(200, {
                        "responses": updated_rows,
                        "attendance": att_dict,
                        "synced_at": GLOBAL_CACHE.get("last_sync") or now,
                        "cached": True,
                        "warning": f"Notice: {str(e)[:120]}. Showing cached registrations."
                    })
                return self.send_json(401 if "Reconnect" in str(e) else 502, {"error": str(e)})
        return self.send_error(404)
    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/auth/login":
            try:
                b = self.body()
                email = str(b.get("email", "")).strip().lower()
                password = str(b.get("password", "")).strip()
                if not email or not password:
                    return self.send_json(400, {"error": "Please enter both email and password."})
                with LOCK:
                    d = load_data()
                    user = d.get("users", {}).get(email)
                    if not user or not verify_pass(password, user.get("salt", ""), user.get("hash", "")):
                        return self.send_json(401, {"error": "Invalid email or password."})
                    token = secrets.token_hex(32)
                    d.setdefault("sessions", {})[token] = {
                        "email": email,
                        "expires_at": time.time() + (86400 * 30)
                    }
                    save_data(d)
                cookie_hdr = f"gf_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000"
                return self.send_json(200, {"ok": True, "token": token, "email": email}, {"Set-Cookie": cookie_hdr})
            except Exception as e:
                return self.send_json(400, {"error": str(e)})

        if path == "/api/auth/signup":
            try:
                b = self.body()
                email = str(b.get("email", "")).strip().lower()
                password = str(b.get("password", "")).strip()
                if not email or "@" not in email:
                    return self.send_json(400, {"error": "Please enter a valid email address."})
                if len(password) < 6:
                    return self.send_json(400, {"error": "Password must be at least 6 characters long."})
                with LOCK:
                    d = load_data()
                    if email in d.get("users", {}):
                        return self.send_json(409, {"error": "An account with this email already exists. Please sign in."})
                    salt = secrets.token_hex(16)
                    d.setdefault("users", {})[email] = {
                        "email": email,
                        "salt": salt,
                        "hash": hash_pass(password, salt),
                        "created_at": time.time()
                    }
                    token = secrets.token_hex(32)
                    d.setdefault("sessions", {})[token] = {
                        "email": email,
                        "expires_at": time.time() + (86400 * 30)
                    }
                    save_data(d)
                cookie_hdr = f"gf_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000"
                return self.send_json(201, {"ok": True, "token": token, "email": email}, {"Set-Cookie": cookie_hdr})
            except Exception as e:
                return self.send_json(400, {"error": str(e)})

        if path == "/api/auth/logout":
            token = ""
            auth = self.headers.get("Authorization", "")
            if auth.startswith("Bearer "): token = auth[7:].strip()
            if not token: token = self.headers.get("x-auth-token", "").strip()
            cookies = dict((x.strip().split("=", 1) for x in self.headers.get("Cookie", "").split(";") if "=" in x))
            if not token: token = cookies.get("gf_session", "")
            with LOCK:
                d = load_data()
                if token and token in d.get("sessions", {}):
                    del d["sessions"][token]
                    save_data(d)
            return self.send_json(200, {"ok": True}, {"Set-Cookie": "gf_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"})

        if path == "/api/attendance":
            try:
                v = self.body()
                resp_id = str(v.get("id", "")).strip()
                if not resp_id: return self.send_json(400, {"error": "Missing response ID."})
                day = str(v.get("day", "Day 1")).strip()
                status = bool(v.get("checked_in", True))
                with LOCK:
                    d = load_data()
                    att = d.get("attendance") or {}
                    if resp_id not in att or not isinstance(att[resp_id], dict):
                        att[resp_id] = {}
                    if status:
                        att[resp_id][day] = {"checked_in": True, "time": time.strftime("%I:%M %p, %d %b"), "timestamp": time.time()}
                    else:
                        att[resp_id].pop(day, None)
                        if not att[resp_id]:
                            att.pop(resp_id, None)
                    d["attendance"] = att
                    save_data(d)
                return self.send_json(200, {"ok": True, "attendance": att.get(resp_id, {})})
            except Exception as e: return self.send_json(400, {"error": str(e)})
        if path == "/api/forms":
            try:
                v = self.body(); name = str(v.get("name", "")).strip(); raw = str(v.get("url", "")).strip(); sid = sheet_id(raw)
                if not name or not sid: return self.send_json(400, {"error": "Enter a form name and Google Sheets link."})
                if not re.fullmatch(r"[\w-]{10,}", sid): return self.send_json(400, {"error": "That link does not look like a Google response spreadsheet link."})
                with LOCK:
                    d = load_data()
                    if any(x["sheet_id"] == sid for x in d["forms"]): return self.send_json(409, {"error": "That response sheet is already connected."})
                    f = {"id": secrets.token_hex(5), "name": name, "sheet_id": sid, "url": raw}; d["forms"].append(f); save_data(d)
                return self.send_json(201, {"form": f})
            except Exception as e: return self.send_json(400, {"error": str(e)})
        if (path.startswith("/api/forms/") and path.endswith("/delete")) or path == "/api/forms/delete":
            ident = path.split("/")[3] if path.endswith("/delete") and len(path.split("/")) > 4 else str(self.body().get("id", "")).strip()
            with LOCK:
                d = load_data(); d["forms"] = [x for x in d["forms"] if x["id"] != ident]; save_data(d)
            return self.send_json(200, {"ok": True, "deleted": ident})
        return self.send_error(404)
    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith("/api/forms/"):
            ident = path.split("/")[3]
            with LOCK:
                d = load_data(); d["forms"] = [x for x in d["forms"] if x["id"] != ident]; save_data(d)
            return self.send_json(200, {"ok": True, "deleted": ident})
        return self.send_error(404)

if __name__ == "__main__":
    HOST = os.getenv("HOST", "")
    PORT = int(os.getenv("PORT", "8000"))
    print(f"Genesis Forms running at http://localhost:{PORT} (network: http://127.0.0.1:{PORT}).")
    print("Registration Desk & Attendance mode ACTIVE. Keep this window open; Ctrl+C stops it.")
    try:
        DualStackServer.address_family = socket.AF_INET6
        DualStackServer((HOST or "::", PORT), Handler).serve_forever()
    except Exception:
        ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
