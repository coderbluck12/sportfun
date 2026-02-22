import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { X, Volume2, VolumeX, Maximize2, RefreshCw, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { resolveStreamUrl } from '../services/streamResolver'
import type { LiveMatch } from '../data/liveMatches'
import './StreamPlayer.css'

interface Props {
    match: LiveMatch | null
    onClose: () => void
}

type PlayerMode = 'loading' | 'resolving' | 'hls' | 'embed' | 'error'

export default function StreamPlayer({ match, onClose }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)

    const [muted, setMuted] = useState(false)
    const [playerMode, setPlayerMode] = useState<PlayerMode>('loading')
    const [hlsUrl, setHlsUrl] = useState<string | null>(null)
    const [embedUrl, setEmbedUrl] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [rawUrl, setRawUrl] = useState<string>('')

    // ── Resolve the stream URL ─────────────────────────────────
    const resolveUrl = useCallback(async (streamUrl: string) => {
        setPlayerMode('resolving')
        setHlsUrl(null)
        setEmbedUrl(null)
        setErrorMsg('')

        const result = await resolveStreamUrl(streamUrl)

        if (result.type === 'hls') {
            setHlsUrl(result.url)
            setPlayerMode('hls')
        } else if (result.type === 'embed') {
            setEmbedUrl(result.url)
            setPlayerMode('embed')
        } else {
            setErrorMsg(result.message)
            setPlayerMode('error')
        }
    }, [])

    // Trigger resolve whenever the match stream URL changes
    useEffect(() => {
        if (!match?.streamUrl) return
        setRawUrl(match.streamUrl)
        resolveUrl(match.streamUrl)
    }, [match?.streamUrl, resolveUrl])

    // ── HLS playback ───────────────────────────────────────────
    useEffect(() => {
        if (playerMode !== 'hls' || !hlsUrl) return
        const video = videoRef.current
        if (!video) return

        setPlayerMode('loading')

        if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
            hlsRef.current = hls
            hls.loadSource(hlsUrl)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setPlayerMode('hls')
                video.play().catch(() => { })
            })
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    setErrorMsg('HLS stream failed to load. The stream may have ended or the URL is invalid.')
                    setPlayerMode('error')
                }
            })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = hlsUrl
            video.addEventListener('loadedmetadata', () => {
                setPlayerMode('hls')
                video.play().catch(() => { })
            })
            video.addEventListener('error', () => {
                setErrorMsg('Could not play this stream in your browser.')
                setPlayerMode('error')
            })
        } else {
            setErrorMsg('HLS playback is not supported in this browser.')
            setPlayerMode('error')
        }

        return () => {
            hlsRef.current?.destroy()
            hlsRef.current = null
        }
    }, [hlsUrl, playerMode])

    // ── Keyboard & scroll lock ──────────────────────────────────
    useEffect(() => {
        if (!match) return
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', onKey)
        }
    }, [match, onClose])

    if (!match) return null

    const toggleMute = () => {
        if (videoRef.current) videoRef.current.muted = !muted
        setMuted(m => !m)
    }

    const fullscreen = () => {
        const el = document.querySelector('.stream-player__video-wrap') as HTMLElement
        el?.requestFullscreen?.()
    }

    const retry = () => resolveUrl(rawUrl)

    const isHlsMode = playerMode === 'hls' || playerMode === 'loading'
    const isResolving = playerMode === 'resolving'
    const isError = playerMode === 'error'
    const isEmbed = playerMode === 'embed'

    return (
        <div className="stream-player__backdrop" onClick={onClose}>
            <div className="stream-player" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="stream-player__header">
                    <div className="stream-player__match-info">
                        <span className="stream-player__league-logo">{match.leagueLogo}</span>
                        <div>
                            <div className="stream-player__teams">
                                {match.homeName}
                                <span className="stream-player__score-inline">
                                    {match.homeScore} : {match.awayScore}
                                </span>
                                {match.awayName}
                            </div>
                            <div className="stream-player__meta">
                                {match.league}&nbsp;·&nbsp;
                                {match.status === 'LIVE' ? (
                                    <span className="stream-player__live">
                                        <span className="sp-dot" /> LIVE {match.minute}'
                                    </span>
                                ) : match.status === 'FINISHED' ? (
                                    <span className="stream-player__ft">Full Time</span>
                                ) : (
                                    <span>{match.kickoffTime}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="stream-player__controls">
                        {isHlsMode && (
                            <>
                                <button onClick={toggleMute} className="sp-ctrl-btn" title={muted ? 'Unmute' : 'Mute'}>
                                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <button onClick={fullscreen} className="sp-ctrl-btn" title="Fullscreen">
                                    <Maximize2 size={16} />
                                </button>
                            </>
                        )}
                        {/* Open in new tab — always available */}
                        {rawUrl && (
                            <a
                                href={rawUrl.replace(/^(resolve:|embed:)/, '')}
                                target="_blank"
                                rel="noreferrer"
                                className="sp-ctrl-btn"
                                title="Open stream in new tab"
                                onClick={e => e.stopPropagation()}
                            >
                                <ExternalLink size={16} />
                            </a>
                        )}
                        <button onClick={onClose} className="sp-ctrl-btn sp-ctrl-btn--close" title="Close">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Video Area */}
                <div className="stream-player__video-wrap">

                    {/* Resolving spinner */}
                    {isResolving && (
                        <div className="stream-player__loading">
                            <Loader2 size={36} className="sp-spin" />
                            <p>Extracting stream URL&hellip;</p>
                            <span className="sp-resolve-hint">Fetching embed page server-side</span>
                        </div>
                    )}

                    {/* HLS loading */}
                    {playerMode === 'loading' && hlsUrl && (
                        <div className="stream-player__loading">
                            <div className="sp-spinner" />
                            <p>Connecting to stream&hellip;</p>
                        </div>
                    )}

                    {/* Error */}
                    {isError && (
                        <div className="stream-player__error">
                            <AlertCircle size={40} />
                            <h3>Stream Unavailable</h3>
                            <p>{errorMsg || 'Could not load this stream.'}</p>
                            <div className="sp-error-actions">
                                <button className="btn btn-outline" onClick={retry}>
                                    <RefreshCw size={14} /> Retry
                                </button>
                                {rawUrl && (
                                    <a
                                        href={rawUrl.replace(/^(resolve:|embed:)/, '')}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-outline"
                                    >
                                        <ExternalLink size={14} /> Open in New Tab
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* HLS video */}
                    {(isHlsMode && hlsUrl) && (
                        <video
                            ref={videoRef}
                            className="stream-player__video"
                            playsInline
                            muted={muted}
                            controls={false}
                            style={{ opacity: playerMode === 'loading' ? 0 : 1 }}
                        />
                    )}

                    {/* Iframe embed */}
                    {isEmbed && embedUrl && (
                        <iframe
                            src={embedUrl}
                            className="stream-player__iframe"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                            title={`${match.homeName} vs ${match.awayName}`}
                            onLoad={() => { /* iframe loaded */ }}
                        />
                    )}
                </div>

                {/* Events Ticker */}
                {match.events.length > 0 && (
                    <div className="stream-player__ticker">
                        <span className="stream-player__ticker-label">⚡ Events</span>
                        <div className="stream-player__ticker-scroll">
                            {[...match.events].reverse().map((ev, i) => (
                                <span key={i} className="stream-player__tick-item">
                                    {ev.minute}' {ev.type === 'GOAL' ? '⚽' : ev.type === 'YELLOW' ? '🟨' : ev.type === 'RED' ? '🟥' : '🔄'}
                                    {' '}{ev.player}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
