import { NextResponse } from 'next/server';
import { logoutUser } from '@/app/lib/session';

export async function POST() {
  await logoutUser();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
