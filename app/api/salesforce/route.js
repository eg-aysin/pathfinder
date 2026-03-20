import { NextResponse } from 'next/server';
import { getSalesforceLog } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ log: getSalesforceLog(), status: 'online' });
}
