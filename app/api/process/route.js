import { NextResponse } from 'next/server';
import { createProcess } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { facilityName } = await request.json();
    if (!facilityName || !facilityName.trim()) {
      return NextResponse.json({ error: 'facilityName is required' }, { status: 400 });
    }
    const processId = createProcess(facilityName.trim());
    return NextResponse.json({ processId, facilityName: facilityName.trim() });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
