import { useState, useEffect, useCallback } from 'react'

// ============================================================
// useStreamUrls — persists stream URL mappings to localStorage
// Key: fixture ID (string)  →  Value: stream URL string
// ============================================================

const STORAGE_KEY = 'sportfun_stream_urls'

export type StreamUrlMap = Record<string, string>  // { "fixtureId": "embed:https://..." }

function load(): StreamUrlMap {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    } catch {
        return {}
    }
}

function save(map: StreamUrlMap) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function useStreamUrls() {
    const [urls, setUrls] = useState<StreamUrlMap>(load)

    // Sync from storage (other tabs)
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) setUrls(load())
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    /** Get stream URL for a fixture. Returns null if not set. */
    const getUrl = useCallback((fixtureId: number | string): string | null => {
        return urls[String(fixtureId)] ?? null
    }, [urls])

    /** Set or update stream URL for a fixture */
    const setUrl = useCallback((fixtureId: number | string, url: string) => {
        setUrls(prev => {
            const next = { ...prev, [String(fixtureId)]: url }
            save(next)
            return next
        })
    }, [])

    /** Remove stream URL for a fixture */
    const removeUrl = useCallback((fixtureId: number | string) => {
        setUrls(prev => {
            const next = { ...prev }
            delete next[String(fixtureId)]
            save(next)
            return next
        })
    }, [])

    /** Clear ALL stream URLs */
    const clearAll = useCallback(() => {
        setUrls({})
        localStorage.removeItem(STORAGE_KEY)
    }, [])

    return { urls, getUrl, setUrl, removeUrl, clearAll }
}
