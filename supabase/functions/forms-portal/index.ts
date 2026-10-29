import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const TOKEN_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!;
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/forms-portal/callback`;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);
const APP_ORIGIN = new URL(APP_URL).origin;
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin === APP_ORIGIN ? origin : APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Vary": "Origin",
});

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function b64bytes(s: string) {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function b64(data: Uint8Array) {
  return btoa(String.fromCharCode(...data));
}
async function encryptToken(token: string) {
  const key = await crypto.subtle.importKey("raw", b64bytes(TOKEN_KEY), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token)));
  return `${b64(iv)}.${b64(cipher)}`;
}
async function decryptToken(value: string) {
  const [iv, cipher] = value.split(".");
  const key = await crypto.subtle.importKey("raw", b64bytes(TOKEN_KEY), "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64bytes(iv) }, key, b64bytes(cipher));
  return new TextDecoder().decode(plain);
}
async function userFor(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}
async function googleToken(refreshToken: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || data.error || "Google token refresh failed");
  return data.access_token as string;
}
async function readResponses(userId: string) {
  const { data: connection, error } = await admin.from("google_connections").select("refresh_token_ciphertext").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!connection) throw new Error("Connect Google Sheets before adding response sheets.");
  const accessToken = await googleToken(await decryptToken(connection.refresh_token_ciphertext));
  const { data: forms, error: formsError } = await admin.from("forms").select("id,name,spreadsheet_id").eq("user_id", userId).order("created_at");
  if (formsError) throw formsError;
  const output = [];
  for (const form of forms || []) {
    const range = encodeURIComponent("A:ZZ");
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${form.spreadsheet_id}/values/${range}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const sheet = await r.json();
    if (!r.ok) throw new Error(sheet.error?.message || `Could not read sheet: ${form.name}`);
    const values: string[][] = sheet.values || [];
    const headers: string[] = values[0] || [];
    for (let index = 1; index < values.length; index++) {
      const row = values[index];
      const answers: Record<string, string> = {};
      row.forEach((value, i) => { answers[headers[i] || `Column ${i + 1}`] = value; });
      output.push({ id: `${form.id}:${index + 1}`, form: form.name, submitted: row[0] || "", answers });
    }
  }
  return output;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });

  const url = new URL(req.url);
  if (req.method === "GET" && url.pathname.endsWith("/callback")) {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return Response.redirect(`${APP_URL}?google_error=authorization_cancelled`, 303);
    const { data: pending, error: stateError } = await admin.from("oauth_states").select("user_id").eq("state", state).gt("expires_at", new Date().toISOString()).maybeSingle();
    await admin.from("oauth_states").delete().eq("state", state);
    if (stateError || !pending) return Response.redirect(`${APP_URL}?google_error=state_expired`, 303);
    try {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: REDIRECT_URI, grant_type: "authorization_code" }),
      });
      const tokens = await r.json();
      if (!r.ok) throw new Error(tokens.error_description || tokens.error || "Google authorization failed");
      if (!tokens.refresh_token) throw new Error("Google did not return a refresh token. Reconnect and approve offline access.");
      const encrypted = await encryptToken(tokens.refresh_token);
      const { error } = await admin.from("google_connections").upsert({ user_id: pending.user_id, refresh_token_ciphertext: encrypted, updated_at: new Date().toISOString() });
      if (error) throw error;
      return Response.redirect(`${APP_URL}?google_connected=1`, 303);
    } catch (e) {
      return Response.redirect(`${APP_URL}?google_error=${encodeURIComponent(e instanceof Error ? e.message : "connection_failed")}`, 303);
    }
  }

  const user = await userFor(req);
  if (!user) return json({ error: "Sign in to continue." }, 401, origin);
  try {
    const body = req.method === "POST" ? await req.json() : {};
    switch (body.action) {
      case "start-google": {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !TOKEN_KEY) throw new Error("Supabase is missing Google OAuth or token encryption secrets.");
        const state = crypto.randomUUID() + crypto.randomUUID();
        const { error } = await admin.from("oauth_states").insert({ state, user_id: user.id, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
        if (error) throw error;
        const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        auth.search = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: "code", scope: "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly", access_type: "offline", prompt: "consent", state }).toString();
        return json({ url: auth.toString() }, 200, origin);
      }
      case "list": {
        const [{ data: forms, error }, { data: connection }] = await Promise.all([
          admin.from("forms").select("id,name,spreadsheet_id,created_at").eq("user_id", user.id).order("created_at"),
          admin.from("google_connections").select("user_id").eq("user_id", user.id).maybeSingle(),
        ]);
        if (error) throw error;
        return json({ forms: forms || [], googleConnected: !!connection }, 200, origin);
      }
      case "add": {
        const name = String(body.name || "").trim();
        const link = String(body.url || "").trim();
        const id = link.match(/\/spreadsheets\/d\/([\w-]+)/)?.[1] || link;
        if (!name || !/^[\w-]{10,}$/.test(id)) throw new Error("Enter a form name and a valid Google response spreadsheet link.");
        const { data, error } = await admin.from("forms").insert({ user_id: user.id, name, spreadsheet_id: id }).select("id,name,spreadsheet_id,created_at").single();
        if (error?.code === "23505") throw new Error("That response sheet is already connected.");
        if (error) throw error;
        return json({ form: data }, 201, origin);
      }
      case "delete": {
        const { error } = await admin.from("forms").delete().eq("id", body.id).eq("user_id", user.id);
        if (error) throw error;
        return json({ ok: true }, 200, origin);
      }
      case "responses":
        return json({ responses: await readResponses(user.id), synced_at: Date.now() / 1000 }, 200, origin);
      default: return json({ error: "Unknown portal action." }, 400, origin);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected portal error." }, 400, origin);
  }
});

