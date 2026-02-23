// api/stream-urls.ts  — Vercel serverless function
// Stores stream URL mappings in Vercel KV (via REST API) so ALL users see them.
//
// GET  /api/stream-urls          → { urls: Record<string, string> }
// POST /api/stream-urls          → body { id, url } → saves to Redis
// DELETE /api/stream-urls?id=123 → removes key from Redis
//
// Write operations require the header: x-admin-secret: <ADMIN_SECRET env var>

import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.KV_REST_API_URL ?? ''
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? ''
const KV_KEY = 'sf:stream_urls'
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'sportfun2026'

async function redisGet(key: string): Promise<Record<string, string>> {
    if (!REDIS_URL) return {}
    const res = await fetch(`${REDIS_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    })
    const data = await res.json() as { result: string | null }
    if (!data.result) return {}
    try { return JSON.parse(data.result) } catch { return {} }
}

async function redisSet(key: string, value: Record<string, string>): Promise<void> {
    if (!REDIS_URL) return
    await fetch(`${REDIS_URL}/set/${key}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${REDIS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(value)), // Redis stores as string
    })
}

function cors(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    cors(res)
    if (req.method === 'OPTIONS') { res.status(200).end(); return }

    // ── GET — public ───────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            const urls = await redisGet(KV_KEY)
            res.status(200).json({ urls })
        } catch (e) {
            res.status(500).json({ error: String(e) })
        }
        return
    }

    // ── Auth check for write operations ───────────────────────
    if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
        res.status(401).json({ error: 'Unauthorized' }); return
    }

    // ── POST ───────────────────────────────────────────────────
    if (req.method === 'POST') {
        const { id, url } = req.body as { id: string; url: string }
        if (!id || !url) { res.status(400).json({ error: 'Missing id or url' }); return }
        try {
            const current = await redisGet(KV_KEY)
            current[String(id)] = url
            await redisSet(KV_KEY, current)
            res.status(200).json({ ok: true, urls: current })
        } catch (e) { res.status(500).json({ error: String(e) }) }
        return
    }

    // ── DELETE ─────────────────────────────────────────────────
    if (req.method === 'DELETE') {
        const id = String(req.query.id ?? '')
        if (!id) { res.status(400).json({ error: 'Missing ?id= parameter' }); return }
        try {
            const current = await redisGet(KV_KEY)
            delete current[id]
            await redisSet(KV_KEY, current)
            res.status(200).json({ ok: true, urls: current })
        } catch (e) { res.status(500).json({ error: String(e) }) }
        return
    }

    res.status(405).json({ error: 'Method not allowed' })
}
