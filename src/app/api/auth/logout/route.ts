import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  let token = req.cookies.get('gf_session')?.value;
  if (!token) {
    const auth = req.headers.get('authorization') || '';
    if (auth.startsWith('Bearer ')) {
      token = auth.substring(7).trim();
    }
  }

  if (token) {
    serverStore.removeSession(token);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('gf_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });

  return res;
}

