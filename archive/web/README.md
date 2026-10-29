# Genesis Forms Web Client (Supabase Edition)

This is the static frontend for Genesis Forms connected to Supabase Auth and Supabase Edge Functions.

## Authentication (Normal Sign-In)

The web portal uses a **standard Email & Password authentication system**:
- **Sign In Tab**: Enter registered email and password to log in.
- **Create Account Tab**: Register a new account with email and password (minimum 6 characters).
- **Session Persistence**: Sessions are saved securely in the browser. Users stay logged in until clicking **Sign Out**.

## Configuration

[`index.html`](index.html) is pre-configured with the Genesis Forms Supabase project:

```javascript
const SUPABASE_URL = 'https://egppwttrulhhuyqgouuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...';
```

## Local Development

You can run this frontend with any local HTTP server:

```powershell
# Using Python
python -m http.server 3000 --directory web

# Or using Node.js npx serve
npx serve web
```

Then open `http://localhost:3000` in your browser.

## Deployment

Deploy the `web` folder to any static hosting service:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- Supabase Storage (Static Website Hosting)
- AWS S3 / CloudFront

Make sure to add your deployed URL to:
1. **Supabase Auth → URL Configuration → Redirect URLs**
2. Google Cloud Console OAuth 2.0 Web Client **Authorized JavaScript origins** and **Authorized redirect URIs**
3. Supabase Edge Function Secret `APP_URL`
