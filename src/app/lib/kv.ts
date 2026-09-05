import { createClient } from '@vercel/kv';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn("Missing Redis Environment Variables! Please connect Vercel KV or Upstash Redis.");
}

export const kv = createClient({
  url: url || 'http://localhost:8079',
  token: token || 'example_token',
});
