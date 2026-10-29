import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const responseId = String(body.responseId || body.id || '').trim();
    const checkedInBy = String(body.checkedInBy || 'Organizer').trim();

    if (!responseId) {
      return NextResponse.json({ error: 'Response ID is required.' }, { status: 400 });
    }

    const updated = serverStore.toggleAttendance(responseId, checkedInBy);
    if (!updated) {
      return NextResponse.json({ error: 'Registration record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      response: updated
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

