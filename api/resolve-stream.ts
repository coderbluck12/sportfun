// api/resolve-stream.ts
// Vercel Edge-compatible serverless function
// Route: GET /api/resolve-stream?url=<embed_url>
//
// Use this in production when Vite's dev middleware is not running.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'node:https'
import http from 'node:http'

const REFERER_SPOOF = 'https://sportsurge.ws/'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
const M3U8_REGEX = /https?:\/\/[^"'\s\\]+\.m3u8(?:[^"'\s\\]*)/g

export default function handler(req: VercelRequest, res: VercelResponse) {
    // CORS — allow requests from your deployed domain
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    const embedUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url

    if (!embedUrl) {
        res.status(400).json({ error: 'Missing ?url= parameter' })
        return
    }

    let parsed: URL
    try { parsed = new URL(embedUrl) } catch {
        res.status(400).json({ error: 'Invalid URL' })
        return
    }

    const lib = parsed.protocol === 'https:' ? https : http

    const options = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
            'Referer': REFERER_SPOOF,
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
        },
    }

    const proxyReq = lib.request(options, (proxyRes) => {
        let html = ''
        proxyRes.on('data', (chunk: Buffer) => { html += chunk.toString() })
        proxyRes.on('end', () => {
            const matches = html.match(M3U8_REGEX)
            if (matches && matches.length > 0) {
                const unique = [...new Set(matches)]
                res.status(200).json({ url: unique[0], all: unique })
            } else {
                res.status(404).json({ error: 'No .m3u8 stream found in embed page' })
            }
        })
    })

    proxyReq.on('error', (err: Error) => {
        res.status(500).json({ error: err.message })
    })

    proxyReq.setTimeout(10_000, () => {
        proxyReq.destroy()
        res.status(504).json({ error: 'Request timed out' })
    })

    proxyReq.end()
}
