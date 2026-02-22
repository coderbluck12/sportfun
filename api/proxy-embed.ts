// api/proxy-embed.ts  — Vercel serverless function
// Route: GET /api/proxy-embed?url=<embed_url>
//
// Fetches the embed page server-side with a spoofed Referer,
// strips CSP / X-Frame-Options response headers, injects a
// <base href> tag so relative assets load from the original site,
// then returns the HTML from *our* domain.
//
// Result: the iframe loads from /api/proxy-embed on our domain
// so the browser never sees the streaming site's frame-ancestors
// restriction.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'node:https'
import http from 'node:http'

const REFERER_SPOOF = 'https://sportsurge.ws/'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (req.method === 'OPTIONS') { res.status(200).end(); return }

    const embedUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url

    if (!embedUrl) {
        res.status(400).setHeader('Content-Type', 'text/plain').end('Missing ?url= parameter')
        return
    }

    let parsed: URL
    try { parsed = new URL(embedUrl) } catch {
        res.status(400).setHeader('Content-Type', 'text/plain').end('Invalid URL')
        return
    }

    const origin = parsed.origin
    const lib = parsed.protocol === 'https:' ? https : http

    const proxyReq = lib.request(
        {
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
        },
        (proxyRes) => {
            let html = ''
            proxyRes.on('data', (chunk: Buffer) => { html += chunk.toString() })
            proxyRes.on('end', () => {
                // Rewrite: inject base href + fix protocol-relative URLs
                const patched = html
                    .replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">`)
                    .replace(/src="\/\//g, 'src="https://')
                    .replace(/href="\/\//g, 'href="https://')

                // Return with all CSP stripped — browser won't block our iframe
                res
                    .status(200)
                    .setHeader('Content-Type', 'text/html; charset=utf-8')
                    .setHeader('Content-Security-Policy', 'frame-ancestors *')
                    .end(patched)
            })
        },
    )

    proxyReq.on('error', (err: Error) => {
        res.status(500).setHeader('Content-Type', 'text/plain').end(`Proxy error: ${err.message}`)
    })

    proxyReq.setTimeout(10_000, () => {
        proxyReq.destroy()
        res.status(504).setHeader('Content-Type', 'text/plain').end('Request timed out')
    })

    proxyReq.end()
}
