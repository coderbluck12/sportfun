// api/stream-urls.ts  — Vercel serverless function
// Stores stream URL mappings in Vercel KV so ALL users see them.
//
// GET  /api/stream-urls          → { urls: Record<string, string> }
// POST /api/stream-urls          → body { id, url } → saves to KV
// DELETE /api/stream-urls?id=123 → removes key from KV
//
// Write operations require the header: x-admin-secret: <ADMIN_SECRET env var>

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

const KV_KEY = 'sf:stream_urls'
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'sportfun2026'

function cors(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    cors(res)
    if (req.method === 'OPTIONS') { res.status(200).end(); return }

    // ── GET — public, returns all stream URLs ──────────────────
    if (req.method === 'GET') {
        try {
            const urls = (await kv.get<Record<string, string>>(KV_KEY)) ?? {}
            res.status(200).json({ urls })
        } catch (e) {
            res.status(500).json({ error: String(e) })
        }
        return
    }

    // ── Auth check for write operations ───────────────────────
    const secret = req.headers['x-admin-secret']
    if (secret !== ADMIN_SECRET) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    // ── POST — save a stream URL ───────────────────────────────
    if (req.method === 'POST') {
        const { id, url } = req.body as { id: string; url: string }
        if (!id || !url) { res.status(400).json({ error: 'Missing id or url' }); return }
        try {
            const current = (await kv.get<Record<string, string>>(KV_KEY)) ?? {}
            current[String(id)] = url
            await kv.set(KV_KEY, current)
            res.status(200).json({ ok: true, urls: current })
        } catch (e) {
            res.status(500).json({ error: String(e) })
        }
        return
    }

    // ── DELETE — remove a stream URL ───────────────────────────
    if (req.method === 'DELETE') {
        const id = String(req.query.id ?? '')
        if (!id) { res.status(400).json({ error: 'Missing ?id= parameter' }); return }
        try {
            const current = (await kv.get<Record<string, string>>(KV_KEY)) ?? {}
            delete current[id]
            await kv.set(KV_KEY, current)
            res.status(200).json({ ok: true, urls: current })
        } catch (e) {
            res.status(500).json({ error: String(e) })
        }
        return
    }

    res.status(405).json({ error: 'Method not allowed' })
}
