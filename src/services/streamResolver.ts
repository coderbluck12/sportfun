// src/services/streamResolver.ts
// ─────────────────────────────────────────────────────────────
// Resolves stream URLs to something the player can handle.
//
// URL FORMATS (stored in admin panel):
//
//   https://...m3u8              Direct HLS → hls.js player
//   embed:https://...            Embed page → proxied through our server
//                                  (strips CSP/X-Frame-Options, injects base href)
//   resolve:https://...          Extract .m3u8 from page → hls.js (fallback)
//
// The "embed:" prefix now routes through the proxy endpoint automatically,
// so URLs like:
//   embed:https://gooz.aapmains.net/new-stream-embed/45625
// are loaded as:
//   /proxy-embed?url=https://gooz.aapmains.net/new-stream-embed/45625
// which returns the HTML from our domain — no CSP frame-ancestors block.
// ─────────────────────────────────────────────────────────────

export type ResolveResult =
    | { type: 'hls'; url: string }
    | { type: 'embed'; url: string }  // url is already our proxy URL
    | { type: 'error'; message: string }

const PROXY_EMBED_ENDPOINT =
    import.meta.env.DEV
        ? '/proxy-embed'          // Vite dev middleware
        : '/api/proxy-embed'      // Vercel serverless function

const RESOLVE_ENDPOINT =
    import.meta.env.DEV
        ? '/resolve-stream'       // Vite dev middleware
        : '/api/resolve-stream'   // Vercel serverless function

/**
 * Determine what kind of stream URL it is and resolve it if needed.
 */
export async function resolveStreamUrl(rawUrl: string): Promise<ResolveResult> {

    // ── Direct HLS (.m3u8) ─────────────────────────────────────
    if (rawUrl.endsWith('.m3u8') || rawUrl.includes('.m3u8?')) {
        return { type: 'hls', url: rawUrl }
    }

    // ── Proxied iframe embed ────────────────────────────────────
    // Route the embed page through our server so CSP is stripped.
    if (rawUrl.startsWith('embed:')) {
        const originalUrl = rawUrl.slice('embed:'.length)
        const proxyUrl = `${PROXY_EMBED_ENDPOINT}?url=${encodeURIComponent(originalUrl)}`
        return { type: 'embed', url: proxyUrl }
    }

    // ── Server-side .m3u8 extraction (fallback) ─────────────────
    if (rawUrl.startsWith('resolve:')) {
        const embedUrl = rawUrl.slice('resolve:'.length)
        try {
            const res = await fetch(`${RESOLVE_ENDPOINT}?url=${encodeURIComponent(embedUrl)}`)
            const data = await res.json() as { url?: string; error?: string }
            if (data.url) return { type: 'hls', url: data.url }
            return { type: 'error', message: data.error ?? 'Could not find .m3u8 in embed page' }
        } catch (e) {
            return { type: 'error', message: e instanceof Error ? e.message : 'Resolver request failed' }
        }
    }

    // ── Unknown — try as bare embed URL ────────────────────────
    const proxyUrl = `${PROXY_EMBED_ENDPOINT}?url=${encodeURIComponent(rawUrl)}`
    return { type: 'embed', url: proxyUrl }
}
