import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/app/lib/kv';
import { getSession } from '@/app/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const savedInboxes = await kv.lrange(`vault:${session.userId}`, 0, -1);
    return NextResponse.json({ savedInboxes: savedInboxes || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, inbox_id, tok } = await req.json();
    if (!email || !inbox_id || !tok) {
      return NextResponse.json({ error: 'Missing inbox data' }, { status: 400 });
    }

    const existing = await kv.lrange(`vault:${session.userId}`, 0, -1);
    if (existing.some((i: any) => i.inbox_id === inbox_id)) {
      return NextResponse.json({ error: 'Inbox already saved' }, { status: 400 });
    }

    const inboxData = { email, inbox_id, tok, savedAt: new Date().toISOString() };
    await kv.rpush(`vault:${session.userId}`, JSON.stringify(inboxData));
    
    return NextResponse.json({ success: true, message: 'Inbox saved to vault' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const inbox_id = url.searchParams.get('inbox_id');
    if (!inbox_id) return NextResponse.json({ error: 'Missing inbox_id' }, { status: 400 });

    const existing = await kv.lrange(`vault:${session.userId}`, 0, -1);
    const toRemove = existing.find((i: any) => {
      const parsed = typeof i === 'string' ? JSON.parse(i) : i;
      return parsed.inbox_id === inbox_id;
    });
    
    if (toRemove) {
      await kv.lrem(`vault:${session.userId}`, 0, typeof toRemove === 'string' ? toRemove : JSON.stringify(toRemove));
    }

    return NextResponse.json({ success: true, message: 'Inbox removed from vault' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
