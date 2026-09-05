import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '../utils';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(req: NextRequest) {
    try {
        const inbox_id = req.nextUrl.searchParams.get("inbox_id");
        const tok = req.nextUrl.searchParams.get("tok");

        if (!inbox_id || !tok) {
            return NextResponse.json({ error: "Missing inbox_id or tok" }, { status: 400 });
        }

        const msgs = await apiGet(`email/${inbox_id}/messages`, tok);
        
        let allMessages = [];
        if (Array.isArray(msgs)) {
            for (const msg of msgs) {
                const mid = msg.id;
                try {
                    const full = await apiGet(`email/${inbox_id}/messages/${mid}`, tok);
                    allMessages.push(full);
                } catch (e) {
                    console.error("Failed to fetch full message", mid, e);
                }
            }
        }
        
        return NextResponse.json({ messages: allMessages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
