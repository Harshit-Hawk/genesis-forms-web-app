import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export async function GET() {
  const forms = serverStore.getForms();
  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const category = String(body.category || 'Technical').trim();
    const sheetId = String(body.sheetId || body.sheet_id || '').trim();
    const url = body.url ? String(body.url).trim() : `https://docs.google.com/spreadsheets/d/${sheetId}`;

    if (!name || !sheetId) {
      return NextResponse.json({ error: 'Name and Google Sheet ID are required.' }, { status: 400 });
    }

    const form = serverStore.addForm({
      name,
      category,
      sheetId,
      url
    });

    return NextResponse.json({ ok: true, form }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Form ID is required.' }, { status: 400 });
  }

  const deleted = serverStore.deleteForm(id);
  return NextResponse.json({ ok: deleted });
}

