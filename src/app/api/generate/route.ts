import { NextResponse } from 'next/server';
import { apiPost, encode } from '../utils';

export async function POST() {
    try {
        const inbox = await apiPost("g-mail");
        const email = inbox.email;
        const inbox_id = inbox.id;
        const tok = encode({ email });

        return NextResponse.json({
            email,
            inbox_id,
            tok
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
