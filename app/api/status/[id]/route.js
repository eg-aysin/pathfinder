import { NextResponse } from 'next/server';
import { getProcess } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { id } = await params;
  const proc = getProcess(id);
  if (!proc) {
    return NextResponse.json({ error: 'Process not found' }, { status: 404 });
  }
  return NextResponse.json(proc);
}
