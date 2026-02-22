import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================
// useStreamUrls — syncs stream URL mappings with Vercel KV
// All visitors read URLs from /api/stream-urls (shared globally).
// Admin writes go through POST/DELETE to the same API.
// localStorage is used as a fast local cache.
// ============================================================

const STORAGE_KEY = 'sportfun_stream_urls'
const API_ENDPOINT = '/api/stream-urls'
// Must match ADMIN_SECRET env var in Vercel (defaults to 'sportfun2026')
const ADMIN_SECRET = 'sportfun2026'

export type StreamUrlMap = Record<string, string>

function loadCache(): StreamUrlMap {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}
function saveCache(map: StreamUrlMap) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function useStreamUrls() {
    const [urls, setUrls] = useState<StreamUrlMap>(loadCache)
    const fetchedRef = useRef(false)

    // ── Fetch from KV on mount ────────────────────────────────
    useEffect(() => {
        if (fetchedRef.current) return
        fetchedRef.current = true

        fetch(API_ENDPOINT)
            .then(r => r.json())
            .then((data: { urls?: StreamUrlMap }) => {
                if (data.urls) {
                    setUrls(data.urls)
                    saveCache(data.urls)
                }
            })
            .catch(() => {
                // Fall back to localStorage cache if API is unavailable
            })
    }, [])

    // ── Get URL for a fixture ─────────────────────────────────
    const getUrl = useCallback((fixtureId: number | string): string | null => {
        return urls[String(fixtureId)] ?? null
    }, [urls])

    // ── Set / update a stream URL (admin) ─────────────────────
    const setUrl = useCallback((fixtureId: number | string, url: string) => {
        const id = String(fixtureId)

        // Optimistic local update
        setUrls(prev => {
            const next = { ...prev, [id]: url }
            saveCache(next)
            return next
        })

        // Persist to KV
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': ADMIN_SECRET,
            },
            body: JSON.stringify({ id, url }),
        }).catch(console.error)
    }, [])

    // ── Remove a stream URL (admin) ───────────────────────────
    const removeUrl = useCallback((fixtureId: number | string) => {
        const id = String(fixtureId)

        // Optimistic local update
        setUrls(prev => {
            const next = { ...prev }
            delete next[id]
            saveCache(next)
            return next
        })

        // Persist to KV
        fetch(`${API_ENDPOINT}?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'x-admin-secret': ADMIN_SECRET },
        }).catch(console.error)
    }, [])

    // ── Clear ALL stream URLs (admin) ─────────────────────────
    const clearAll = useCallback(() => {
        setUrls({})
        saveCache({})

        // Clear each key — we POST an empty object by deleting all keys one by one
        // Simple approach: just set empty via a loop on current keys
        fetch(API_ENDPOINT)
            .then(r => r.json())
            .then(async (data: { urls?: StreamUrlMap }) => {
                const keys = Object.keys(data.urls ?? {})
                await Promise.all(keys.map(id =>
                    fetch(`${API_ENDPOINT}?id=${encodeURIComponent(id)}`, {
                        method: 'DELETE',
                        headers: { 'x-admin-secret': ADMIN_SECRET },
                    })
                ))
            })
            .catch(console.error)
    }, [])

    return { urls, getUrl, setUrl, removeUrl, clearAll }
}
