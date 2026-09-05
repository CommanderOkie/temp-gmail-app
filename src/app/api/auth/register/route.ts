import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import { loginUser } from '@/app/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { username, password, inviteCode } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (process.env.INVITE_CODE && inviteCode !== process.env.INVITE_CODE) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
    }

    const existingUser = await kv.hget(`user:${username}`, 'password');
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await kv.hset(`user:${username}`, {
      userId,
      password: hashedPassword,
    });
    
    // Reverse lookup map to find username by userId if needed
    await kv.set(`user_id:${userId}`, username);

    await loginUser(userId, username);

    return NextResponse.json({ success: true, message: 'Account created' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
