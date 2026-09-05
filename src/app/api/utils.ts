export const DEC_SW: Record<string, string> = {
    "*": "4", "=": "x", "B": "z", "z": "B",
    "5": "b", "b": "5", "a": "o", "o": "a",
    "q": "s", "s": "q",
};

export const ENC_SW: Record<string, string> = {};
for (const key in DEC_SW) {
    ENC_SW[DEC_SW[key]] = key;
}

export function decode(s: string) {
    let n = s.length - s.replace(/^x+/, '').length;
    let t = "=".repeat(n) + s.slice(n);
    let rev = t.split('').reverse().join('');
    let m = rev.length - rev.replace(/=+$/, '').length;
    let body = m ? rev.slice(0, rev.length - m) : rev;
    let std = body.split('').map(c => DEC_SW[c] || c).join('') + "=".repeat(m);
    let raw = Buffer.from(std + "==", 'base64').toString('utf8');
    let obj;
    try {
        obj = JSON.parse(raw);
    } catch {
        raw = Buffer.from(std + "==", 'base64').toString('latin1');
        obj = JSON.parse(raw);
    }
    return typeof obj === 'string' ? JSON.parse(obj) : obj;
}

export function encode(obj: any) {
    let s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    let b64 = Buffer.from(s).toString('base64');
    let custom = b64.split('').map(c => ENC_SW[c] || c).join('');
    let rev = custom.split('').reverse().join('');
    let n = rev.length - rev.replace(/^=+/, '').length;
    return "x".repeat(n) + rev.slice(n);
}

const BASE = "https://mail-server.1timetech.com/api";
const HEADERS = {
    "accept": "application/json",
    "x-app-key": "b9db03078622",
    "User-Agent": "okhttp/4.12.0",
    "Content-Type": "application/json",
};

export async function apiPost(path: string, payload?: any) {
    const p = payload ? encode(payload) : encode({});
    const res = await fetch(`${BASE}/${path}?params=${encodeURIComponent(p)}`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ data: p }),
    });
    if (!res.ok) throw new Error("API POST failed");
    const data = await res.json();
    return decode(data.data);
}

export async function apiGet(path: string, tok: string) {
    const h = { ...HEADERS };
    delete (h as any)["Content-Type"];
    const res = await fetch(`${BASE}/${path}?params=${encodeURIComponent(tok)}`, {
        method: "GET",
        headers: h as any,
    });
    if (!res.ok) throw new Error("API GET failed");
    const data = await res.json();
    return decode(data.data);
}
