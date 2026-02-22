// api/fd-proxy.ts
// Vercel serverless function — proxies requests to api.football-data.org
// Route: GET /api/fd-proxy/v4/matches  →  GET https://api.football-data.org/v4/matches
//
// This replaces the Vite dev proxy (/fd-api/*) for production.
// The X-Auth-Token header is forwarded from the frontend request.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'node:https'

export const config = {
    api: { bodyParser: false },
}

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'X-Auth-Token, Content-Type')

    if (req.method === 'OPTIONS') { res.status(200).end(); return }

    // Extract path after /api/fd-proxy  e.g. /v4/matches?status=IN_PLAY
    const path = (req.url ?? '').replace(/^\/api\/fd-proxy/, '') || '/v4/matches'
    const token = req.headers['x-auth-token'] as string | undefined

    if (!token) {
        res.status(401).json({ error: 'Missing X-Auth-Token header' })
        return
    }

    const targetUrl = new URL(`https://api.football-data.org${path}`)

    const proxyReq = https.request(
        {
            hostname: targetUrl.hostname,
            path: targetUrl.pathname + targetUrl.search,
            method: 'GET',
            headers: {
                'X-Auth-Token': token,
                'Accept': 'application/json',
            },
        },
        (proxyRes) => {
            let data = ''
            proxyRes.on('data', (chunk: Buffer) => { data += chunk.toString() })
            proxyRes.on('end', () => {
                res
                    .status(proxyRes.statusCode ?? 200)
                    .setHeader('Content-Type', 'application/json')
                    .end(data)
            })
        },
    )

    proxyReq.on('error', (err: Error) => {
        res.status(502).json({ error: err.message })
    })

    proxyReq.setTimeout(10_000, () => {
        proxyReq.destroy()
        res.status(504).json({ error: 'Request to football-data.org timed out' })
    })

    proxyReq.end()
}
