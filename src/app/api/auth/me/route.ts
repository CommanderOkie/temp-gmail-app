import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: session });
}
