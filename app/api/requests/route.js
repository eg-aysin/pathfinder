import { NextResponse } from 'next/server';
import { getAllProcesses } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  const processes = getAllProcesses();
  return NextResponse.json({ processes });
}
