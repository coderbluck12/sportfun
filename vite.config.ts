import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import http from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ─────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────
const REFERER_SPOOF = 'https://sportsurge.ws/'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
const M3U8_REGEX = /https?:\/\/[^"'\s\\]+\.m3u8(?:[^"'\s\\]*)/g

// ─────────────────────────────────────────────────────────────
// Helper: make a server-side HTTP(S) request and return the raw
// Buffer + response headers.
// ─────────────────────────────────────────────────────────────
function serverRequest(
  targetUrl: string,
  referer: string,
  cb: (err: Error | null, body: Buffer | null, headers: Record<string, string | string[] | undefined>) => void,
) {
  let parsed: URL
  try { parsed = new URL(targetUrl) } catch {
    cb(new Error('Invalid URL'), null, {})
    return
  }

  const lib = parsed.protocol === 'https:' ? https : http

  const req = lib.request(
    {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Referer': referer,
        'User-Agent': USER_AGENT,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    },
    (proxyRes) => {
      const chunks: Buffer[] = []
      proxyRes.on('data', (c: Buffer) => chunks.push(c))
      proxyRes.on('end', () => cb(null, Buffer.concat(chunks), proxyRes.headers as Record<string, string | string[] | undefined>))
    },
  )
  req.on('error', (e: Error) => cb(e, null, {}))
  req.setTimeout(12_000, () => { req.destroy(); cb(new Error('Timeout'), null, {}) })
  req.end()
}

function corsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
}

// ─────────────────────────────────────────────────────────────
// Middleware 1: /proxy-embed?url=...
// Fetches embed page, strips CSP/X-Frame-Options, injects base
// href, serves HTML from our origin → iframe loads without block.
// ─────────────────────────────────────────────────────────────
function proxyEmbedMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (!req.url?.startsWith('/proxy-embed')) return next()

  const embedUrl = new URL(req.url, 'http://localhost').searchParams.get('url') ?? ''
  corsHeaders(res)

  if (!embedUrl) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'text/plain')
    res.end('Missing ?url= parameter')
    return
  }

  let origin: string
  try { origin = new URL(embedUrl).origin } catch {
    res.statusCode = 400
    res.end('Invalid URL')
    return
  }

  serverRequest(embedUrl, REFERER_SPOOF, (err, body) => {
    if (err || !body) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'text/plain')
      res.end(`Proxy error: ${err?.message}`)
      return
    }

    const html = body.toString('utf8')
    const patched = html
      .replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">`)
      .replace(/src="\/\//g, 'src="https://')
      .replace(/href="\/\//g, 'href="https://')

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Security-Policy', "frame-ancestors *")
    res.statusCode = 200
    res.end(patched)
  })
}

// ─────────────────────────────────────────────────────────────
// Middleware 2: /resolve-stream?url=...
// Extracts the first .m3u8 URL from an embed page.
// Returns: { url: "https://proxy-hls?url=<m3u8>" } — already
// wrapped in our HLS proxy so hls.js can play it without CORS.
// ─────────────────────────────────────────────────────────────
function resolveStreamMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (!req.url?.startsWith('/resolve-stream')) return next()

  const embedUrl = new URL(req.url, 'http://localhost').searchParams.get('url') ?? ''
  res.setHeader('Content-Type', 'application/json')
  corsHeaders(res)

  if (!embedUrl) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Missing ?url= parameter' }))
    return
  }

  serverRequest(embedUrl, REFERER_SPOOF, (err, body) => {
    if (err || !body) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err?.message ?? 'Fetch failed' }))
      return
    }

    const matches = body.toString().match(M3U8_REGEX)
    if (matches && matches.length > 0) {
      const unique = [...new Set(matches)]
      // Wrap in our HLS proxy so browser doesn't hit CDN CORS
      const proxied = `/proxy-hls?url=${encodeURIComponent(unique[0])}`
      res.statusCode = 200
      res.end(JSON.stringify({ url: proxied, raw: unique[0], all: unique }))
    } else {
      res.statusCode = 404
      res.end(JSON.stringify({ error: 'No .m3u8 stream found in embed page' }))
    }
  })
}

// ─────────────────────────────────────────────────────────────
// Middleware 3: /proxy-hls?url=...
// Fetches an .m3u8 playlist from the CDN server-side.
// Rewrites all segment/chunk URIs inside the playlist to point
// to /proxy-segment?url=<encoded> so segment requests also go
// through our server (bypassing CDN CORS).
// ─────────────────────────────────────────────────────────────
function proxyHlsMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (!req.url?.startsWith('/proxy-hls')) return next()

  const m3u8Url = new URL(req.url, 'http://localhost').searchParams.get('url') ?? ''
  corsHeaders(res)

  if (!m3u8Url) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'text/plain')
    res.end('Missing ?url= parameter')
    return
  }

  // The base URL of segments relative to the manifest
  let base: URL
  try { base = new URL(m3u8Url) } catch {
    res.statusCode = 400; res.end('Invalid URL'); return
  }
  const baseDir = base.origin + base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)

  serverRequest(m3u8Url, REFERER_SPOOF, (err, body) => {
    if (err || !body) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'text/plain')
      res.end(`HLS proxy error: ${err?.message}`)
      return
    }

    const playlist = body.toString('utf8')

    // Rewrite each URI line in the manifest to go through /proxy-segment
    // Lines starting with # are directives — skip them.
    // Absolute URIs (http/https) stay as-is but get wrapped.
    // Relative URIs get resolved against the manifest base URL first.
    const rewritten = playlist.split('\n').map(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || trimmed === '') return line

      // Resolve relative to absolute
      const absoluteUri = trimmed.startsWith('http')
        ? trimmed
        : baseDir + trimmed

      return `/proxy-segment?url=${encodeURIComponent(absoluteUri)}`
    }).join('\n')

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
    res.statusCode = 200
    res.end(rewritten)
  })
}

// ─────────────────────────────────────────────────────────────
// Middleware 4: /proxy-segment?url=...
// Pipes a .ts video segment (or any HLS resource) from the CDN
// through our server so hls.js can load it without CORS issues.
// ─────────────────────────────────────────────────────────────
function proxySegmentMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (!req.url?.startsWith('/proxy-segment')) return next()

  const segUrl = new URL(req.url, 'http://localhost').searchParams.get('url') ?? ''
  corsHeaders(res)

  if (!segUrl) {
    res.statusCode = 400
    res.end('Missing ?url= parameter')
    return
  }

  let parsed: URL
  try { parsed = new URL(segUrl) } catch {
    res.statusCode = 400; res.end('Invalid URL'); return
  }

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
      },
    },
    (proxyRes) => {
      // Forward content-type, pipe the binary data straight through
      const ct = proxyRes.headers['content-type'] ?? 'video/mp2t'
      res.setHeader('Content-Type', ct)
      res.statusCode = proxyRes.statusCode ?? 200
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('error', (e: Error) => {
    res.statusCode = 502
    res.end(`Segment proxy error: ${e.message}`)
  })
  proxyReq.setTimeout(15_000, () => { proxyReq.destroy() })
  proxyReq.end()
}

// ─────────────────────────────────────────────────────────────
// Vite Config
// ─────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sportfun-proxies',
      configureServer(server) {
        // Order matters — most specific paths first
        server.middlewares.use(proxyEmbedMiddleware)
        server.middlewares.use(proxyHlsMiddleware)
        server.middlewares.use(proxySegmentMiddleware)
        server.middlewares.use(resolveStreamMiddleware)
      },
    },
  ],
  server: {
    proxy: {
      '/fd-api': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fd-api/, ''),
        secure: true,
      },
    },
  },
})
