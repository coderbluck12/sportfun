// api/stream-urls.ts  — Vercel serverless function
// Stores stream URL mappings in Vercel KV (REST API) so ALL users see them.
//
// GET    /api/stream-urls              → { urls: Record<string, string> }
// POST   /api/stream-urls              → body { id, url } → saves one URL
// DELETE /api/stream-urls?id=123       → removes one URL
// DELETE /api/stream-urls?action=clear → wipes all URLs
//
// Write operations require header: x-admin-secret

import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.KV_REST_API_URL ?? ''
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? ''
const KV_KEY = 'sf:stream_urls'
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'sportfun2026'

// ── Redis helpers using the command-array REST format ─────────
// POST {url}  body: ["COMMAND", "arg1", "arg2", ...]
async function redisCmd<T>(cmd: unknown[]): Promise<T> {
    const res = await fetch(REDIS_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${REDIS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cmd),
    })
    return res.json() as Promise<T>
}

async function getUrls(): Promise<Record<string, string>> {
    if (!REDIS_URL) return {}
    try {
        const data = await redisCmd<{ result: string | null }>(['GET', KV_KEY])
        if (!data.result) return {}
        return JSON.parse(data.result) as Record<string, string>
    } catch { return {} }
}

async function saveUrls(map: Record<string, string>): Promise<void> {
    if (!REDIS_URL) return
    await redisCmd(['SET', KV_KEY, JSON.stringify(map)])
}

// ── CORS ─────────────────────────────────────────────────────
function cors(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
}

// ── Handler ───────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
    cors(res)
    if (req.method === 'OPTIONS') { res.status(200).end(); return }

    // ── GET — public ──────────────────────────────────────────
    if (req.method === 'GET') {
        const urls = await getUrls()
        res.status(200).json({ urls })
        return
    }

    // ── Auth check for writes ─────────────────────────────────
    if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
        res.status(401).json({ error: 'Unauthorized' }); return
    }

    // ── POST — save one URL ───────────────────────────────────
    if (req.method === 'POST') {
        const { id, url } = (req.body ?? {}) as { id?: string; url?: string }
        if (!id || !url) { res.status(400).json({ error: 'Missing id or url' }); return }
        const current = await getUrls()
        current[String(id)] = url
        await saveUrls(current)
        res.status(200).json({ ok: true, urls: current })
        return
    }

    // ── DELETE — remove one URL or clear all ─────────────────
    if (req.method === 'DELETE') {
        // ?action=clear → wipe everything at once
        if (req.query.action === 'clear') {
            await saveUrls({})
            res.status(200).json({ ok: true, urls: {} })
            return
        }

        const id = String(req.query.id ?? '')
        if (!id) { res.status(400).json({ error: 'Missing ?id= or ?action=clear' }); return }
        const current = await getUrls()
        delete current[id]
        await saveUrls(current)
        res.status(200).json({ ok: true, urls: current })
        return
    }

    res.status(405).json({ error: 'Method not allowed' })
}
