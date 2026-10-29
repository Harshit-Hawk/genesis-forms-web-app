# Vercel Deployment & Setup Guide

## One-Click Deployment to Vercel

The Genesis Forms Web App is ready for **zero-configuration** deployment on [Vercel](https://vercel.com).

### Option 1: Deploy with Vercel CLI
```powershell
# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Deploy directly from the project directory
vercel
```

Follow the interactive prompts:
- **Set up and deploy?** [Y]
- **Which scope?** (Select your Vercel account)
- **Link to existing project?** [N]
- **Project name?** `genesis-forms-desk`
- **In which directory is your code located?** `./` (or `./web`)

---

### Option 2: Deploy via GitHub / GitLab / Bitbucket
1. **Push your repository** to GitHub.
2. Go to **[vercel.com/new](https://vercel.com/new)**.
3. Import your repository:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
4. Click **Deploy**. Vercel will build and provide your live production Next.js URL in seconds.

---

## Design System: Minimalist Light Edition

- **Light Theme (Default)**: Porcelain white (`#fbfbfc`, `#ffffff`) with subtle slate borders (`#e2e8f0`).
- **Electric Blue**: Clean accent (`#0062ff`, hover `#0050d4`).
- **High-Contrast Text**: Jet-slate (`#0f172a`, `#334155`) for sharp readability on all screens.
- **Panels & Tables**: Minimalist surface cards with subtle borders and shadows.
- **Theme Switcher**: Instant Light / Dark toggle in the top bar and mobile header.
- **Zero Emojis**: Replaced with clean line SVG icons and micro status dots.

---

## Mobile Optimization

- **Any Screen Size**: Fluid responsiveness from **320px** (iPhone SE), **390px-430px** (iPhone 14/15/16 Pro Max), **768px-1024px** (iPads/tablets), to **4K Ultra-wide monitors**.
- **Touch-Friendly Controls**: Touch targets >= 44px.
- **Mobile Bottom Navigation**: Quick one-thumb access between:
  - `Desk` (KPIs & Verification Desk)
  - `AI Table` (Instant AI Registration Analyzer)
  - `View` (Toggle between mobile cards and full data table)
  - `Add` (Connect new Google Sheet)
  - `Sync` (Live sheet polling)
- **Direct WhatsApp Link**: Instant contact link to team captains (`wa.me/91...`).
- **One-Tap UTR Copy**: Fast payment reconciliation with clipboard confirmation.
- **PWA Ready**: Includes `manifest.json`, standalone display, and home-screen installability.

---

## AI Registration Table Analyzer

The built-in AI Engine analyzes real-time registration data across all connected forms and generates:
1. **Multi-Dimensional AI Analytical Table**:
   - **Rank**: Sorted by registration volume.
   - **Event Name**: Displayed with electric blue indicator.
   - **Category**: Auto-categorized (Esports, Hackathon, Gaming, Technical, Cultural, Management).
   - **Total Registered**: Participant/team count with volume meters.
   - **Share %**: Percentage share of aggregate event turnout.
   - **Demand Status**: `High Demand`, `Optimal`, `Moderate`.
   - **Projected Turnout %**: Predictive arrival rate based on category and verification history.
   - **Allocated Venue**: Hall, lab, and coordinator recommendations.
   - **Action**: Operational advice (e.g., bracket preparation, check-in queue management).
2. **AI Interactive Prompt Pills**:
   - `High-Capacity Events`
   - `Esports vs Technical`
   - `Venue Allocation`
   - `Low Traction Events`
3. **Export Tools**:
   - `Export CSV`
   - `Copy Table`
   - `Re-Analyze`

---

## Authentication & Guest Mode

- **Guest / Instant Preview**: Allows any visitor on Vercel to immediately explore all 17 pre-loaded events and submissions without registering.
- **Supabase Cloud Auth**: Fully integrated with your Supabase backend for persistent user logins and multi-user team desks.
