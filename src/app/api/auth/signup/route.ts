import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    const name = body.name ? String(body.name).trim() : undefined;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const existing = serverStore.getUser(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
    }

    const user = serverStore.createUser(email, password, name, 'Organizer');
    const session = serverStore.createSession(user);

    const res = NextResponse.json({
      ok: true,
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 });

    res.cookies.set('gf_session', session.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 30
    });

    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

