# Local development launcher. It does not save Google credentials to disk.
$ErrorActionPreference = 'Stop'
$ClientId = Read-Host 'Google OAuth Client ID'
$ClientSecret = Read-Host 'Google OAuth Client Secret'
$env:GOOGLE_CLIENT_ID = $ClientId
$env:GOOGLE_CLIENT_SECRET = $ClientSecret
$env:PORTAL_URL = 'http://localhost:8000'
try {
    Start-Process 'http://localhost:8000'
    python (Join-Path $PSScriptRoot 'forms_portal.py')
} finally {
    Remove-Item Env:GOOGLE_CLIENT_ID -ErrorAction SilentlyContinue
    Remove-Item Env:GOOGLE_CLIENT_SECRET -ErrorAction SilentlyContinue
    Remove-Item Env:PORTAL_URL -ErrorAction SilentlyContinue
}

