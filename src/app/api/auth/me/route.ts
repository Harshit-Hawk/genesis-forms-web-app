import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  let token = req.cookies.get('gf_session')?.value;
  if (!token) {
    const auth = req.headers.get('authorization') || '';
    if (auth.startsWith('Bearer ')) {
      token = auth.substring(7).trim();
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = serverStore.getSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
  }

  const user = serverStore.getUser(session.email);
  return NextResponse.json({
    ok: true,
    user: {
      id: session.userId,
      email: session.email,
      name: user?.name,
      role: session.role
    }
  });
}

