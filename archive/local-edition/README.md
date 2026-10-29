# Genesis Forms — Local Python Edition

A standalone, single-user Google Forms response portal built with Python's standard library (no pip packages or external databases required).

## Requirements

- Python 3.8+
- Google Cloud Project with the **Google Sheets API** enabled and OAuth 2.0 Web Client credentials.

## Setup

1. In the [Google Cloud Console](https://console.cloud.google.com/):
   - Enable **Google Sheets API**.
   - Create an **OAuth 2.0 Client ID** (Application type: **Web application**).
   - Set **Authorized redirect URI**: `http://localhost:8000/oauth/callback`.
2. Run the PowerShell launcher:
   ```powershell
   ./start_portal.ps1
   ```
   Or set the environment variables and run Python directly:
   ```powershell
   $env:GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID"
   $env:GOOGLE_CLIENT_SECRET = "YOUR_CLIENT_SECRET"
   python forms_portal.py
   ```
3. Open `http://localhost:8000` in your browser.
4. Click **Connect Google** to approve read-only spreadsheet access.
5. In your Google Form, choose **Responses → Link to Sheets**, then copy and paste the spreadsheet link into Genesis Forms.

## Event Registration & Attendance Desk (Oct 30 & 31)

Genesis Forms comes equipped with a registration desk and attendance system:

- **Day 1 & Day 2 Attendance**: Independent check-in tracking for October 30 & 31 with live timestamps.
- **1-Click Check-In**: Audio chime confirmation, green status badge, and instant undo.
- **Instant Search**: Find teams or solo participants by name, roll number, phone, or payment UTR.
- **Verification Modal**: Inspect squad roster, click WhatsApp contact link, and verify payment proof screenshots.
- **CSV Export**: 1-click download of finalized attendance sheet with timestamps for reports and prize eligibility.
- **LAN Multi-Device Support**: Bound to `0.0.0.0` so other desk volunteers can open `http://<HOST_IP>:8000` from phones/tablets on the same Wi-Fi.

## Files

- `forms_portal.py`: HTTP server handling Google OAuth handshake, token refreshing, attendance persistence, and Sheets API proxying.
- `portal.html`: Registration & Attendance Desk UI served at `http://localhost:8000/`.
- `start_portal.ps1`: Interactive launcher script that keeps credentials out of source control.
- `portal_data.json`: Local JSON file storing connected forms, OAuth tokens, and attendance check-in records (auto-created, git-ignored).

