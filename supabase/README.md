# Genesis Forms — Supabase edition

This version uses Supabase Auth and Postgres for user accounts and connected form records. A Supabase Edge Function handles Google Sheets authorization and reads responses using a read-only Google scope. The browser refreshes every 60 seconds while open.

## Set up the Supabase project

1. Create a Supabase project and copy its project URL and publishable key from **Project Settings → API Keys**.
2. In **SQL Editor**, run migrations/202610250001_forms_portal.sql.
3. In **Authentication → Providers → Google**, enable Google sign-in and enter the Google OAuth client ID and secret. Add your hosted portal URL to the Supabase Auth redirect URL allow-list.
4. Create a Google OAuth web client in Google Cloud Console. Enable **Google Sheets API**. Add both redirect URIs to that OAuth client:
   - https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback (Supabase sign-in)
   - https://YOUR_PROJECT_REF.supabase.co/functions/v1/forms-portal/callback (Google Sheets access)
5. Configure the OAuth consent screen and add your account as a test user while developing. Google may require consent screen verification before broad public use.

You may use one Google OAuth client for both redirect URIs. Supabase Auth signs users in; Genesis Forms separately requests the Sheets read-only permission so the sheet access can be refreshed securely by the Edge Function.

## Configure and deploy the Edge Function

Install the Supabase CLI, then from the project root run:

~~~powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy forms-portal
~~~

Set these Edge Function secrets in **Project Settings → Edge Functions → Secrets**:

- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET: credentials for the Google OAuth web client above.
- TOKEN_ENCRYPTION_KEY: a private, base64-encoded 32-byte key. Generate one with Node.js: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))".
- APP_URL: exact public portal URL, such as https://example.netlify.app.

The function stores Google refresh tokens encrypted with AES-GCM. Keep the encryption key private and back it up securely; changing it requires users to reconnect Google Sheets.

## Host the portal

The static web application is located in `web/index.html`. Deploy the `web` folder to any static hosting provider (Vercel, Netlify, Cloudflare Pages, Supabase Storage, GitHub Pages, or S3).

In `web/index.html`, replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_PUBLISHABLE_KEY` with the values from your Supabase dashboard (**Project Settings → API Keys**). A publishable key is designed to be used in a browser; never put a Supabase secret/service-role key in the page.

Add the portal’s full URL to Supabase Auth’s allowed redirect URLs. For production, use HTTPS.

## Connect a form

1. Sign in to the portal with Google.
2. Choose **Connect Google Sheets** and approve read-only spreadsheet access.
3. In each Google Form, open **Responses → Link to Sheets**.
4. Copy the response spreadsheet URL and add it to Genesis Forms.

The Google account used for Sheets access must be able to open the response spreadsheet. The first row is treated as column names and the first column as the submission timestamp.

## Security and limits

Forms are scoped to the signed-in user and protected by RLS. The Edge Function verifies the user for each portal request and keeps Google refresh tokens server-side, encrypted at rest. The server function is configured with JWT verification disabled only because Google must reach its OAuth callback without a Supabase session; all non-callback actions verify the Supabase user token in code.

This is a starter implementation. It fetches Sheets when the signed-in portal asks for data; it does not run scheduled background syncs or deliver push notifications. Google Forms does not provide a native response push feed, so updates are near-live polling while the page is open.
