import { NextResponse } from 'next/server';
import { getHistory, deleteEntry, clearHistory, getStats } from '@/lib/history';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const facility = searchParams.get('facility') || '';
  const from     = searchParams.get('from')     || '';
  const to       = searchParams.get('to')       || '';
  const statsOnly = searchParams.get('stats') === 'true';

  if (statsOnly) {
    return NextResponse.json(getStats());
  }

  const entries = getHistory({ facility, from, to });
  return NextResponse.json({ entries });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id  = searchParams.get('id');
  const all = searchParams.get('all') === 'true';

  if (all) {
    clearHistory();
    return NextResponse.json({ ok: true, message: 'History cleared' });
  }
  if (id) {
    deleteEntry(id);
    return NextResponse.json({ ok: true, message: `Entry ${id} deleted` });
  }
  return NextResponse.json({ error: 'Provide ?id=... or ?all=true' }, { status: 400 });
}
