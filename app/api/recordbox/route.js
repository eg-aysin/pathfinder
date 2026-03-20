import { NextResponse } from 'next/server';
import { getRecordboxLog } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ log: getRecordboxLog(), status: 'online' });
}
