# Genesis Forms · Event Desk & AI Intelligence

A production-ready web application built in **Next.js** (App Router) and **TypeScript** for event registration desks, attendee verification, and AI Registration Analysis across multiple Google Forms response sheets.

Built with a minimalist Light Theme (with Dark Mode option), electric blue accents, responsive layout across every screen size (smartphones, tablets, laptops, and ultra-wide screens), and 1-click deployment on [Vercel](https://vercel.com).

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Modern CSS variables & [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio Feedback**: Web Audio API Synthesizer (harmonic chimes)
- **Backend / Storage**: LocalStorage caching + [Supabase](https://supabase.com/) Auth integration
- **Deployment**: [Vercel](https://vercel.com/) (Zero-configuration native Next.js deployment)

---

## Key Highlights

- **Next.js & TypeScript Architecture**:
  - Full type safety with strict TypeScript (`src/types/index.ts`).
  - Next.js App Router (`src/app/page.tsx`, `src/app/layout.tsx`).
  - Modular React components (`Navbar`, `DeskView`, `AITableAnalyzer`, `AttendeeModal`, `AddFormModal`, `AuthScreen`).
- **Minimalist Light & Dark Themes**:
  - Porcelain background (`#fbfbfc`, `#ffffff`), slate typography (`#0f172a`), linear borders (`#e2e8f0`), and electric blue accents (`#0062ff`).
  - Dark mode option (`#0b0f17`, `#111827`, `#3b82f6`).
- **Desk Mode (Attendee Verification)**:
  - Live metric counters: Total Registrations, Checked In count & progress meter, Pending Verification, and Desk Throughput.
  - One-tap WhatsApp link (`wa.me/91...`) for direct captain / attendee communication.
  - One-tap UTR / Transaction ID copy with clipboard confirmation.
  - Interactive audio chimes for check-in and undo via Web Audio API.
  - Attendee detail modal with full question responses, college IDs, and payment screenshots.
- **AI Registration Table Analyzer**:
  - Real-time cross-form aggregation per event name across all connected forms.
  - Calculates event rank, category, total registrations, volume capacity meter, tournament share percentage, demand status (`High Demand`, `Optimal`, `Moderate`), projected turnout (88% show-up conversion model), and recommended venue allocation.
  - Interactive AI prompt pills: `High-Capacity Events`, `Esports vs Technical`, `Venue Allocation`, `Low Traction Events`.
  - One-click **Export Table to CSV** and **Copy Markdown Table**.
- **Flexible Authentication**:
  - Pre-configured Organizer credentials (`harshitgujjar73@gmail.com` / `admin123`).
  - Supabase Email & Password authentication.
  - Google Sign-In via Supabase OAuth.
  - 1-click **Continue as Guest** for instant live preview.

---

## Local Development

```powershell
# 1. Install dependencies
npm install

# 2. Run the Next.js development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

```powershell
# Build for production
npm run build

# Start production server
npm run start
```

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── globals.css             # Theme variables and Tailwind styling
│   │   ├── layout.tsx              # Root HTML shell, fonts, and metadata
│   │   └── page.tsx                # Main client orchestrator
│   ├── components/
│   │   ├── Navbar.tsx              # Brand, view switcher, search, filters, actions
│   │   ├── DeskView.tsx            # Attendee verification desk & attendance table
│   │   ├── AITableAnalyzer.tsx     # AI registration table & venue capacity analysis
│   │   ├── AttendeeModal.tsx       # Attendee submission details & document preview
│   │   ├── AddFormModal.tsx        # Connect Google Sheet modal
│   │   └── AuthScreen.tsx          # Login, signup, organizer fallback, and guest access
│   ├── lib/
│   │   ├── chime.ts                # Web Audio API synthesizer for desk chimes
│   │   ├── data.ts                 # Default forms, responses, and venue maps
│   │   ├── storage.ts              # LocalStorage persistence helpers
│   │   └── supabase.ts             # Supabase client configuration
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces and types
│   └── data/
│       └── real_responses.json     # 211 authentic tournament registrations
├── package.json                    # Next.js, React, TypeScript dependencies
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
└── vercel.json                     # Vercel deployment headers
```
