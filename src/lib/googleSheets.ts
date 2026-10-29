import fs from 'fs';
import path from 'path';
import { FormModel, ResponseModel } from '@/models';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function getCredentials() {
  let clientId = process.env.GOOGLE_CLIENT_ID || '';
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  let refreshToken = process.env.GOOGLE_REFRESH_TOKEN || '';

  if (!clientId || !clientSecret || !refreshToken) {
    try {
      const envPath = path.join(process.cwd(), 'archive', 'local-edition', '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('GOOGLE_CLIENT_ID=')) clientId = clientId || trimmed.split('=')[1].trim();
          if (trimmed.startsWith('GOOGLE_CLIENT_SECRET=')) clientSecret = clientSecret || trimmed.split('=')[1].trim();
        }
      }

      const portalDataPath = path.join(process.cwd(), 'archive', 'local-edition', 'portal_data.json');
      if (fs.existsSync(portalDataPath)) {
        const portalData = JSON.parse(fs.readFileSync(portalDataPath, 'utf-8'));
        if (portalData?.token?.refresh_token) {
          refreshToken = refreshToken || portalData.token.refresh_token;
        }
      }
    } catch {
      // Fallback
    }
  }

  return { clientId, clientSecret, refreshToken };
}

export async function getGoogleAccessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const { clientId, clientSecret, refreshToken } = getCredentials();
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      tokenCache = {
        accessToken: data.access_token,
        expiresAt: Date.now() + ((data.expires_in || 3600) - 60) * 1000
      };
      return data.access_token;
    }
  } catch {
    // Return null
  }

  return null;
}

export function extractAttendeeName(answers: Record<string, string>): string {
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (
      lk.includes('full name') ||
      lk.includes('captain name') ||
      lk.includes('leader name') ||
      lk.includes('team lead') ||
      lk.includes('player name') ||
      lk.includes('candidate name') ||
      lk === 'name'
    ) {
      if (answers[key]?.trim()) return answers[key].trim();
    }
  }
  for (const key of Object.keys(answers)) {
    if (key.toLowerCase().includes('name') && answers[key]?.trim()) {
      return answers[key].trim();
    }
  }
  for (const key of Object.keys(answers)) {
    if (key.toLowerCase().includes('squad') || key.toLowerCase().includes('team')) {
      if (answers[key]?.trim()) return answers[key].trim();
    }
  }
  return 'Attendee';
}

export function extractTeamName(answers: Record<string, string>): string {
  if (!answers) return '';
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (
      (lk.includes('squad name') ||
        lk.includes('team name') ||
        lk.includes('group name') ||
        lk === 'squad' ||
        lk === 'team') &&
      !lk.includes('captain') &&
      !lk.includes('leader') &&
      !lk.includes('lead') &&
      !lk.includes('member') &&
      !lk.includes('player') &&
      !lk.includes('email') &&
      !lk.includes('phone') &&
      !lk.includes('mobile')
    ) {
      const val = answers[key]?.trim();
      if (val && val.toLowerCase() !== 'n/a' && val.toLowerCase() !== 'none' && val.toLowerCase() !== 'na') {
        return val;
      }
    }
  }
  return '';
}

export function extractPhone(answers: Record<string, string>): string {
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (lk.includes('phone') || lk.includes('whatsapp') || lk.includes('contact') || lk.includes('mobile')) {
      const val = answers[key]?.trim();
      if (val && /\d{8,}/.test(val)) return val.replace(/\D/g, '');
    }
  }
  return '';
}

export function extractUTR(answers: Record<string, string>): string {
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (lk.includes('utr') || lk.includes('transaction') || lk.includes('reference') || lk.includes('payment id')) {
      const val = answers[key]?.trim();
      if (val) return val;
    }
  }
  return '';
}

async function fetchFormWithAccessToken(form: FormModel, accessToken: string): Promise<ResponseModel[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${form.sheetId}/values/A:ZZ`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Sheets API responded with ${res.status}`);
  }

  const data = await res.json();
  const values: string[][] = data.values || [];
  if (values.length <= 1) return [];

  const headers = values[0] || [];
  const responses: ResponseModel[] = [];

  for (let idx = 1; idx < values.length; idx++) {
    const row = values[idx] || [];
    const answers: Record<string, string> = {};

    headers.forEach((h, colIdx) => {
      const headerName = h?.trim() || `Column ${colIdx + 1}`;
      answers[headerName] = row[colIdx] ? String(row[colIdx]).trim() : '';
    });

    const submitted = row[0] || answers['Timestamp'] || '';
    const teamName = extractTeamName(answers);
    responses.push({
      id: `${form.id}:${idx + 1}`,
      form: form.name,
      formName: form.name,
      formId: form.id,
      submitted,
      submittedAt: submitted,
      answers,
      attendeeName: extractAttendeeName(answers),
      teamName: teamName || undefined,
      team_name: teamName || undefined,
      phone: extractPhone(answers),
      utr: extractUTR(answers),
      checkedIn: false,
      checked_in: false
    });
  }

  return responses;
}

async function fetchFormWithGViz(form: FormModel): Promise<ResponseModel[]> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${form.sheetId}/gviz/tq?tqx=out:json`;
  const res = await fetch(gvizUrl);
  if (!res.ok) return [];

  const text = await res.text();
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
  if (!jsonMatch) return [];

  const data = JSON.parse(jsonMatch[1]);
  const table = data?.table;
  if (!table) return [];

  const cols: string[] = (table.cols || []).map((c: { label?: string }) => c.label || 'Field');
  const rows: unknown[] = table.rows || [];
  const responses: ResponseModel[] = [];

  rows.forEach((r: unknown, rIdx: number) => {
    const rowObj = r as { c?: Array<{ v?: string; f?: string } | null> };
    const answers: Record<string, string> = {};
    (rowObj.c || []).forEach((cell, cIdx: number) => {
      const colName = cols[cIdx] || `Column ${cIdx + 1}`;
      const val = cell?.f || cell?.v || '';
      answers[colName] = String(val);
    });

    const submitted = answers['Timestamp'] || '';
    const teamName = extractTeamName(answers);
    responses.push({
      id: `${form.id}:${rIdx + 2}`,
      form: form.name,
      formName: form.name,
      formId: form.id,
      submitted,
      submittedAt: submitted,
      answers,
      attendeeName: extractAttendeeName(answers),
      teamName: teamName || undefined,
      team_name: teamName || undefined,
      phone: extractPhone(answers),
      utr: extractUTR(answers),
      checkedIn: false,
      checked_in: false
    });
  });

  return responses;
}

export async function fetchLiveResponses(forms: FormModel[]): Promise<{ responses: ResponseModel[]; isLive: boolean; error?: string }> {
  const accessToken = await getGoogleAccessToken();
  const allResponses: ResponseModel[] = [];
  let isLive = false;

  // Process in concurrent batches of 4 to avoid rate limits
  const BATCH_SIZE = 4;
  for (let i = 0; i < forms.length; i += BATCH_SIZE) {
    const batch = forms.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async form => {
        if (accessToken) {
          try {
            const res = await fetchFormWithAccessToken(form, accessToken);
            isLive = true;
            return res;
          } catch {
            return await fetchFormWithGViz(form);
          }
        } else {
          return await fetchFormWithGViz(form);
        }
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        allResponses.push(...r.value);
      }
    }
  }

  return { responses: allResponses, isLive };
}

