import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, RefreshCw, AlertCircle, ExternalLink, Play,
    ShieldAlert, Tv2
} from 'lucide-react'
import {
    getMatchById, getMatchH2H,
    isLive, isUpcoming, statusLabel, getLeagueMeta,
    type FDMatchDetail, type FDH2HResponse, type FDMatch,
} from '../services/footballApi'
import { useStreamUrls } from '../hooks/useStreamUrls'
import StreamPlayer from '../components/StreamPlayer'
import './MatchPage.css'

type Tab = 'overview' | 'h2h' | 'lineup' | 'watch'

function cardIcon(card: string) {
    if (card === 'RED_CARD') return '🟥'
    if (card === 'YELLOW_RED_CARD') return '🟧'
    return '🟨'
}

function minuteLabel(min: number, inj?: number | null) {
    return inj ? `${min}+${inj}'` : `${min}'`
}

export default function MatchPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { getUrl } = useStreamUrls()
    const token = localStorage.getItem('sf_fdtoken') ?? import.meta.env.VITE_FOOTBALLDATA_TOKEN ?? ''

    const [match, setMatch] = useState<FDMatchDetail | null>(null)
    const [h2h, setH2h] = useState<FDH2HResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [h2hLoading, setH2hLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>('overview')
    const [player, setPlayer] = useState(false)

    const fetchMatch = useCallback(async () => {
        if (!id || !token) return
        try {
            const data = await getMatchById(token, id)
            setMatch(data)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load match')
        } finally {
            setLoading(false)
        }
    }, [id, token])

    const fetchH2H = useCallback(async () => {
        if (!id || !token || h2h) return
        setH2hLoading(true)
        try {
            const data = await getMatchH2H(token, id)
            setH2h(data)
        } catch { /* H2H optional */ } finally { setH2hLoading(false) }
    }, [id, token, h2h])

    // Initial load
    useEffect(() => { fetchMatch() }, [fetchMatch])

    // Auto-refresh every 60s if live
    useEffect(() => {
        if (!match || !isLive(match)) return
        const t = setInterval(fetchMatch, 60_000)
        return () => clearInterval(t)
    }, [match, fetchMatch])

    // Load H2H when tab selected
    useEffect(() => { if (tab === 'h2h') fetchH2H() }, [tab, fetchH2H])

    if (loading) return (
        <div className="mp-loading">
            <div className="mp-spinner" />
            <p>Loading match&hellip;</p>
        </div>
    )

    if (error || !match) return (
        <div className="mp-error-screen">
            <AlertCircle size={40} />
            <h3>Could not load match</h3>
            <p>{error}</p>
            <button className="btn btn-outline" onClick={() => navigate('/live')}>← Back to Live</button>
        </div>
    )

    const league = getLeagueMeta(match.competition.code)
    const live = isLive(match)
    const upcoming = isUpcoming(match)
    const homeScore = match.score.fullTime.home
    const awayScore = match.score.fullTime.away
    const stLabel = statusLabel(match)
    const streamUrl = getUrl(match.id)

    // All events merged and sorted by minute for the timeline
    const goals = match.goals ?? []
    const cards = match.bookings ?? []
    const subs = match.substitutions ?? []
    const lineups = match.lineups ?? []

    type Event = { minute: number; injuryTime?: number | null; kind: 'goal' | 'card' | 'sub'; data: unknown }
    const events: Event[] = [
        ...goals.map(g => ({ minute: g.minute, injuryTime: g.injuryTime, kind: 'goal' as const, data: g })),
        ...cards.map(b => ({ minute: b.minute, injuryTime: null, kind: 'card' as const, data: b })),
        ...subs.map(s => ({ minute: s.minute, injuryTime: null, kind: 'sub' as const, data: s })),
    ].sort((a, b) => a.minute - b.minute || (a.injuryTime ?? 0) - (b.injuryTime ?? 0))

    const hasLineups = lineups.length >= 2

    // Build a LiveMatchData-compatible shape for the StreamPlayer
    const matchForPlayer: Parameters<typeof StreamPlayer>[0]['match'] = {
        id: String(match.id), status: live ? 'LIVE' : upcoming ? 'UPCOMING' : 'FINISHED',
        league: league.name, leagueLogo: league.logo, leagueColor: league.color,
        homeName: match.homeTeam.name, homeShort: match.homeTeam.tla,
        homeLogo: match.homeTeam.crest,
        awayName: match.awayTeam.name, awayShort: match.awayTeam.tla,
        awayLogo: match.awayTeam.crest,
        homeScore: homeScore ?? 0, awayScore: awayScore ?? 0,
        minute: match.minute, kickoffTime: '',
        venue: match.venue ?? '', events: [], broadcasters: [],
        streamUrl: streamUrl ?? '',
    }

    function isDirectHls(url: string | null) {
        return !!url && (url.includes('.m3u8') || url.startsWith('/proxy-hls'))
    }
    function rawUrl(url: string) {
        return url.replace(/^(embed:|resolve:)/, '')
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'h2h', label: 'H2H' },
        ...(hasLineups ? [{ key: 'lineup' as Tab, label: 'Lineups' }] : []),
        ...(streamUrl ? [{ key: 'watch' as Tab, label: '▶ Watch' }] : []),
    ]

    return (
        <div className="mp">
            {/* ── Back ─────────────────────────────────────────── */}
            <div className="mp__back">
                <Link to="/live" className="mp__back-link">
                    <ArrowLeft size={15} /> Live Matches
                </Link>
                <button className="mp__refresh" onClick={fetchMatch} title="Refresh">
                    <RefreshCw size={13} />
                </button>
            </div>

            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="mp__hero" style={{ '--lc': league.color } as React.CSSProperties}>
                <div className="mp__hero-glow" />
                <div className="container mp__hero-inner">
                    {/* League */}
                    <div className="mp__league">
                        <span>{league.logo}</span>
                        <span>{league.name}</span>
                        {live && <span className="mp__live-badge"><span className="mp__live-dot" />{stLabel}</span>}
                        {!live && <span className="mp__status-badge">{stLabel}</span>}
                    </div>

                    {/* Teams + Score */}
                    <div className="mp__matchup">
                        {/* Home */}
                        <div className="mp__team">
                            {match.homeTeam.crest
                                ? <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="mp__crest" />
                                : <span className="mp__crest-fallback">🏟</span>}
                            <span className="mp__team-name">{match.homeTeam.name}</span>
                        </div>

                        {/* Score */}
                        <div className="mp__score-block">
                            {upcoming ? (
                                <span className="mp__vs">VS</span>
                            ) : (
                                <div className="mp__score">
                                    <span className={homeScore !== null && awayScore !== null && homeScore > awayScore ? 'mp__score--win' : ''}>
                                        {homeScore ?? 0}
                                    </span>
                                    <span className="mp__score-sep">:</span>
                                    <span className={homeScore !== null && awayScore !== null && awayScore > homeScore ? 'mp__score--win' : ''}>
                                        {awayScore ?? 0}
                                    </span>
                                </div>
                            )}
                            {match.score.halfTime.home !== null && !upcoming && (
                                <div className="mp__ht">HT {match.score.halfTime.home}–{match.score.halfTime.away}</div>
                            )}
                        </div>

                        {/* Away */}
                        <div className="mp__team mp__team--away">
                            {match.awayTeam.crest
                                ? <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="mp__crest" />
                                : <span className="mp__crest-fallback">🏟</span>}
                            <span className="mp__team-name">{match.awayTeam.name}</span>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="mp__meta">
                        {match.venue && <span>🏟 {match.venue}</span>}
                        {match.referees?.[0] && <span>👤 {match.referees[0].name}</span>}
                    </div>
                </div>
            </section>

            {/* ── Tabs ─────────────────────────────────────────── */}
            <div className="mp__tabs-bar">
                <div className="container">
                    <div className="mp__tabs">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                className={`mp__tab${tab === t.key ? ' active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >{t.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Tab content ──────────────────────────────────── */}
            <div className="container mp__body">

                {/* OVERVIEW */}
                {tab === 'overview' && (
                    <div className="mp__overview">
                        {events.length === 0 ? (
                            <div className="mp__empty">
                                {upcoming ? '⏳ Match has not started yet' : '📋 No match events available'}
                            </div>
                        ) : (
                            <div className="mp__events">
                                <h3 className="mp__section-title">Match Events</h3>
                                {events.map((ev, i) => {
                                    const isHome = (ev.data as { team: { id: number } }).team.id === match.homeTeam.id
                                    if (ev.kind === 'goal') {
                                        const g = ev.data as typeof goals[0]
                                        return (
                                            <div key={i} className={`mp__event mp__event--goal ${isHome ? 'home' : 'away'}`}>
                                                <span className="mp__event-min">{minuteLabel(ev.minute, ev.injuryTime)}</span>
                                                <span className="mp__event-icon">⚽{g.type === 'OWN' ? '(OG)' : g.type === 'PENALTY' ? '(P)' : ''}</span>
                                                <span className="mp__event-text">
                                                    <strong>{g.scorer?.name ?? 'Unknown'}</strong>
                                                    {g.assist && <span className="mp__event-assist"> (assist: {g.assist.name})</span>}
                                                </span>
                                                <span className="mp__event-team">{isHome ? match.homeTeam.tla : match.awayTeam.tla}</span>
                                            </div>
                                        )
                                    }
                                    if (ev.kind === 'card') {
                                        const b = ev.data as typeof cards[0]
                                        return (
                                            <div key={i} className={`mp__event ${isHome ? 'home' : 'away'}`}>
                                                <span className="mp__event-min">{minuteLabel(ev.minute)}</span>
                                                <span className="mp__event-icon">{cardIcon(b.card)}</span>
                                                <span className="mp__event-text"><strong>{b.player.name}</strong></span>
                                                <span className="mp__event-team">{isHome ? match.homeTeam.tla : match.awayTeam.tla}</span>
                                            </div>
                                        )
                                    }
                                    // sub
                                    const s = ev.data as typeof subs[0]
                                    return (
                                        <div key={i} className={`mp__event ${isHome ? 'home' : 'away'}`}>
                                            <span className="mp__event-min">{minuteLabel(ev.minute)}</span>
                                            <span className="mp__event-icon">🔄</span>
                                            <span className="mp__event-text">
                                                <strong>{s.playerIn.name}</strong>
                                                <span className="mp__event-assist"> ↰ {s.playerOut.name}</span>
                                            </span>
                                            <span className="mp__event-team">{isHome ? match.homeTeam.tla : match.awayTeam.tla}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* H2H */}
                {tab === 'h2h' && (
                    <div className="mp__h2h">
                        {h2hLoading && <div className="mp__loading-inline"><div className="mp__spinner" /></div>}
                        {h2h && !h2hLoading && (
                            <>
                                {/* Aggregate bar — computed from match results, not API aggregates
                                    (API aggregates count wins *as home/away* which is misleading) */}
                                {(() => {
                                    const hId = match.homeTeam.id
                                    const aId = match.awayTeam.id
                                    const { homeWins, awayWins, h2hDraws } = h2h.matches.reduce(
                                        (acc, m) => {
                                            const hS = m.score.fullTime.home ?? 0
                                            const aS = m.score.fullTime.away ?? 0
                                            if (hS === aS) { acc.h2hDraws++; return acc }
                                            const winnerId = hS > aS ? m.homeTeam.id : m.awayTeam.id
                                            if (winnerId === hId) acc.homeWins++
                                            else if (winnerId === aId) acc.awayWins++
                                            return acc
                                        },
                                        { homeWins: 0, awayWins: 0, h2hDraws: 0 }
                                    )
                                    return (
                                        <div className="mp__h2h-agg">
                                            <div className="mp__h2h-team">
                                                <img src={match.homeTeam.crest} alt="" className="mp__h2h-crest" />
                                                <span>{match.homeTeam.tla}</span>
                                            </div>
                                            <div className="mp__h2h-stats">
                                                <span className="mp__h2h-stat">{homeWins} W</span>
                                                <span className="mp__h2h-stat mp__h2h-stat--draw">{h2hDraws} D</span>
                                                <span className="mp__h2h-stat mp__h2h-stat--loss">{awayWins} W</span>
                                            </div>
                                            <div className="mp__h2h-team mp__h2h-team--right">
                                                <img src={match.awayTeam.crest} alt="" className="mp__h2h-crest" />
                                                <span>{match.awayTeam.tla}</span>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* Past matches */}
                                <h3 className="mp__section-title">Last {h2h.matches.length} Meetings</h3>
                                <div className="mp__h2h-list">
                                    {h2h.matches.map((m: FDMatch) => {
                                        const d = new Date(m.utcDate)
                                        const hS = m.score.fullTime.home ?? 0
                                        const aS = m.score.fullTime.away ?? 0
                                        const isHomeWin = hS > aS
                                        const isAwayWin = aS > hS
                                        return (
                                            <div key={m.id} className="mp__h2h-row">
                                                <span className="mp__h2h-date">{d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <span className="mp__h2h-teams">
                                                    <span className={isHomeWin ? 'mp__h2h-winner' : ''}>{m.homeTeam.tla}</span>
                                                    <span className="mp__h2h-score">{hS}–{aS}</span>
                                                    <span className={isAwayWin ? 'mp__h2h-winner' : ''}>{m.awayTeam.tla}</span>
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                        {!h2hLoading && !h2h && (
                            <div className="mp__empty">H2H data unavailable</div>
                        )}
                    </div>
                )}

                {/* LINEUPS */}
                {tab === 'lineup' && hasLineups && (
                    <div className="mp__lineups">
                        {lineups.map(lineup => (
                            <div key={lineup.id} className="mp__lineup-col">
                                <h3 className="mp__lineup-team-name">
                                    {lineup.name}
                                    {lineup.formation && <span className="mp__formation">{lineup.formation}</span>}
                                </h3>
                                <div className="mp__lineup-section-label">Starting XI</div>
                                <ol className="mp__lineup-list">
                                    {lineup.startXI.map(({ player }) => (
                                        <li key={player.id} className="mp__lineup-player">
                                            <span className="mp__lineup-num">{player.shirtNumber}</span>
                                            <span className="mp__lineup-name">{player.name}</span>
                                            <span className="mp__lineup-pos">{player.position?.slice(0, 3).toUpperCase()}</span>
                                        </li>
                                    ))}
                                </ol>
                                {lineup.bench.length > 0 && (
                                    <>
                                        <div className="mp__lineup-section-label">Bench</div>
                                        <ol className="mp__lineup-list mp__lineup-list--bench">
                                            {lineup.bench.map(({ player }) => (
                                                <li key={player.id} className="mp__lineup-player">
                                                    <span className="mp__lineup-num">{player.shirtNumber}</span>
                                                    <span className="mp__lineup-name">{player.name}</span>
                                                    <span className="mp__lineup-pos">{player.position?.slice(0, 3).toUpperCase()}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* WATCH */}
                {tab === 'watch' && streamUrl && (
                    <div className="mp__watch">
                        {isDirectHls(streamUrl) ? (
                            <button className="mp__watch-btn mp__watch-btn--hls" onClick={() => setPlayer(true)}>
                                <Play size={18} /> Play Stream
                            </button>
                        ) : (
                            <a
                                href={rawUrl(streamUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="mp__watch-btn mp__watch-btn--ext"
                            >
                                <ExternalLink size={18} /> Open Stream
                            </a>
                        )}
                        <p className="mp__watch-hint">
                            <Tv2 size={13} /> Stream provided by the site admin
                        </p>
                        {streamUrl && !isDirectHls(streamUrl) && (
                            <p className="mp__watch-hint">
                                <ShieldAlert size={13} /> Opens in a new tab on the streaming site
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Stream player modal */}
            {player && streamUrl && (
                <StreamPlayer match={matchForPlayer} onClose={() => setPlayer(false)} />
            )}
        </div>
    )
}
