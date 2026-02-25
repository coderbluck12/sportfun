import { useState, useEffect, useMemo, useCallback } from 'react'
import { Radio, Clock, CheckCircle2, RefreshCw, AlertCircle, Wifi, ChevronLeft, ChevronRight, ExternalLink, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StreamPlayer from '../components/StreamPlayer'
import { useStreamUrls } from '../hooks/useStreamUrls'
import {
    getAllTodaysTopMatches,
    isLive,
    isUpcoming,
    statusLabel,
    getLeagueMeta,
    type FDMatch,
} from '../services/footballApi'
import './LivePage.css'

// ── Types ─────────────────────────────────────────────────────
export interface LiveMatchData {
    fixtureId: number
    status: 'LIVE' | 'UPCOMING' | 'FINISHED'
    minuteLabel: string
    league: string
    leagueLogo: string
    leagueColor: string
    homeName: string
    homeShortName: string
    homeScore: number | null
    homeLogo: string
    awayName: string
    awayShortName: string
    awayScore: number | null
    awayLogo: string
    venue: string
    streamUrl: string | null
}

function fixtureToCard(m: FDMatch, streamUrl: string | null): LiveMatchData {
    const meta = getLeagueMeta(m.competition.code)
    return {
        fixtureId: m.id,
        status: isLive(m) ? 'LIVE' : isUpcoming(m) ? 'UPCOMING' : 'FINISHED',
        minuteLabel: statusLabel(m),
        league: meta.name,
        leagueLogo: meta.logo,
        leagueColor: meta.color,
        homeName: m.homeTeam.name,
        homeShortName: m.homeTeam.shortName ?? m.homeTeam.tla ?? m.homeTeam.name.split(' ')[0],
        homeScore: m.score.fullTime.home,
        homeLogo: m.homeTeam.crest,
        awayName: m.awayTeam.name,
        awayShortName: m.awayTeam.shortName ?? m.awayTeam.tla ?? m.awayTeam.name.split(' ')[0],
        awayScore: m.score.fullTime.away,
        awayLogo: m.awayTeam.crest,
        venue: m.venue ?? '',
        streamUrl,
    }
}

const ALL_LEAGUES = 'All'
const STATUS_TABS = ['All', 'Live Now', 'Upcoming', 'Finished'] as const
const PAGE_SIZE = 12   // matches per page
type StatusTab = typeof STATUS_TABS[number]

/** Returns true if a URL should be played in the HLS player rather than a new tab */
function isDirectHls(url: string | null): boolean {
    if (!url) return false
    return url.includes('.m3u8') || url.startsWith('/proxy-hls')
}

/** Strip any prefix (embed:, resolve:) to get the raw URL for new-tab opening */
function rawStreamUrl(url: string): string {
    return url.replace(/^(embed:|resolve:)/, '')
}

export default function LivePage() {
    const { getUrl } = useStreamUrls()
    const [fixtures, setFixtures] = useState<FDMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusTab, setStatusTab] = useState<StatusTab>('All')
    const [league, setLeague] = useState(ALL_LEAGUES)
    const [activeCard, setActiveCard] = useState<LiveMatchData | null>(null)
    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [page, setPage] = useState(1)

    /** Smart watch handler: HLS → StreamPlayer, everything else → new tab */
    const handleWatch = useCallback((card: LiveMatchData) => {
        if (isDirectHls(card.streamUrl)) {
            setActiveCard(card)
        } else if (card.streamUrl) {
            window.open(rawStreamUrl(card.streamUrl), '_blank', 'noopener,noreferrer')
        }
    }, [])

    const token = localStorage.getItem('sf_fdtoken') ?? import.meta.env.VITE_FOOTBALLDATA_TOKEN ?? ''

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            if (!token) throw new Error('no-key')
            const data = await getAllTodaysTopMatches(token)
            setFixtures(data)
            setLastRefresh(new Date())
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 60_000)
        return () => clearInterval(interval)
    }, [fetchData])

    // Reset page when filters change
    useEffect(() => { setPage(1) }, [statusTab, league])

    const cards = useMemo<LiveMatchData[]>(
        () => fixtures.map(m => fixtureToCard(m, getUrl(m.id))),
        [fixtures, getUrl]
    )

    const liveCount = cards.filter(c => c.status === 'LIVE').length
    const leagueNames = [ALL_LEAGUES, ...new Set(cards.map(c => c.league))]

    const filtered = useMemo(() => {
        return cards
            .filter(c => {
                const sOk =
                    statusTab === 'All' ? true :
                        statusTab === 'Live Now' ? c.status === 'LIVE' :
                            statusTab === 'Upcoming' ? c.status === 'UPCOMING' :
                                c.status === 'FINISHED'
                const lOk = league === ALL_LEAGUES || c.league === league
                return sOk && lOk
            })
            .sort((a, b) => {
                const ord = { LIVE: 0, UPCOMING: 1, FINISHED: 2 }
                return ord[a.status] - ord[b.status]
            })
    }, [cards, statusTab, league])

    // Pagination
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const liveCards = paginated.filter(c => c.status === 'LIVE')
    const upcomingCards = paginated.filter(c => c.status === 'UPCOMING')
    const finishedCards = paginated.filter(c => c.status === 'FINISHED')

    // All-page LIVE markers (for ticker — use full unfiltered live)
    const allLiveCards = cards.filter(c => c.status === 'LIVE')

    return (
        <div className="live-page">

            {/* ── HERO ──────────────────────────────────────────── */}
            <section className="livepage-hero">
                <div className="livepage-hero__glow" />
                <div className="container livepage-hero__content">
                    <div className="livepage-hero__badge">
                        <span className="live-dot" />
                        {loading
                            ? 'Loading matches\u2026'
                            : `${liveCount} Match${liveCount !== 1 ? 'es' : ''} Live Now`}
                    </div>
                    <h1 className="livepage-hero__title">
                        Live <span className="livepage-hero__green">Football</span>
                    </h1>
                    <p className="livepage-hero__sub">
                        UCL &bull; Premier League &bull; La Liga &bull; Serie A &bull; Bundesliga &bull; Ligue 1
                    </p>
                </div>
            </section>

            {/* ── LIVE SCORE TICKER ─────────────────────────────── */}
            {allLiveCards.length > 0 && (
                <div className="score-ticker">
                    <div className="score-ticker__label"><Radio size={13} /> LIVE</div>
                    <div className="score-ticker__track">
                        <div className="score-ticker__items">
                            {[...allLiveCards, ...allLiveCards].map((c, i) => (
                                <button
                                    key={`${c.fixtureId}-${i}`}
                                    className="score-tick-item"
                                    onClick={() => setActiveCard(c)}
                                >
                                    <span className="score-tick-item__league">{c.leagueLogo}&nbsp;{c.league}</span>
                                    <span className="score-tick-item__teams">
                                        {c.homeShortName}
                                        <span className="score-tick-item__score">&nbsp;{c.homeScore ?? 0}:{c.awayScore ?? 0}&nbsp;</span>
                                        {c.awayShortName}
                                    </span>
                                    <span className="score-tick-item__min">{c.minuteLabel}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── CONTROLS ──────────────────────────────────────── */}
            <section className="livepage-controls">
                <div className="container livepage-controls__inner">
                    {/* Status tabs */}
                    <div className="livepage-status-tabs">
                        {STATUS_TABS.map(tab => (
                            <button
                                key={tab}
                                className={`livepage-status-tab${statusTab === tab ? ' active' : ''}`}
                                onClick={() => setStatusTab(tab)}
                            >
                                {tab === 'Live Now' && <span className="live-dot" style={{ background: 'currentColor' }} />}
                                {tab === 'Upcoming' && <Clock size={12} />}
                                {tab === 'Finished' && <CheckCircle2 size={12} />}
                                {tab}
                                {tab === 'Live Now' && liveCount > 0 && (
                                    <span className="livepage-status-tab__count">{liveCount}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* League filter — horizontal scroll */}
                    <div className="livepage-league-scroll">
                        <div className="livepage-league-filters">
                            {leagueNames.map(l => (
                                <button
                                    key={l}
                                    className={`livepage-league-btn${league === l ? ' active' : ''}`}
                                    onClick={() => setLeague(l)}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Refresh */}
                    <button className="livepage-refresh" onClick={fetchData} disabled={loading}>
                        <RefreshCw size={13} className={loading ? 'spin-refresh' : ''} />
                        <span>
                            {loading
                                ? 'Updating\u2026'
                                : lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </button>
                </div>
            </section>

            {/* ── CONTENT ───────────────────────────────────────── */}
            <section className="livepage-grid-section">
                <div className="container">

                    {/* No API key */}
                    {error === 'no-key' && (
                        <div className="livepage-state livepage-state--warn">
                            <Wifi size={40} />
                            <h3>API Token Required</h3>
                            <p>
                                Visit the <strong>Admin panel</strong> and enter your football-data.org token.
                                Matches will load automatically once it&apos;s saved.
                            </p>
                            <a href="/admin" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                                Go to Admin &rarr;
                            </a>
                        </div>
                    )}

                    {/* API error */}
                    {error && error !== 'no-key' && (
                        <div className="livepage-state livepage-state--error">
                            <AlertCircle size={36} />
                            <h3>Could not load matches</h3>
                            <p>{error}</p>
                            <button className="btn btn-outline" onClick={fetchData}>Retry</button>
                        </div>
                    )}

                    {/* Skeleton */}
                    {loading && !error && (
                        <div className="livepage-grid">
                            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                <div key={i} className="lmc-skeleton" />
                            ))}
                        </div>
                    )}

                    {/* Match groups */}
                    {!loading && !error && filtered.length > 0 && (
                        <>
                            {/* Results meta */}
                            <div className="livepage-results-meta">
                                <span>{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</span>
                                {totalPages > 1 && (
                                    <span>Page {page} of {totalPages}</span>
                                )}
                            </div>

                            {liveCards.length > 0 && (statusTab === 'All' || statusTab === 'Live Now') && (
                                <MatchGroup title="🔴 Live Now" count={liveCards.length} live>
                                    {liveCards.map(c => (
                                        <MatchCard key={c.fixtureId} card={c} onWatch={() => handleWatch(c)} />
                                    ))}
                                </MatchGroup>
                            )}
                            {upcomingCards.length > 0 && (statusTab === 'All' || statusTab === 'Upcoming') && (
                                <MatchGroup title="🕐 Upcoming" count={upcomingCards.length}>
                                    {upcomingCards.map(c => (
                                        <MatchCard key={c.fixtureId} card={c} onWatch={() => handleWatch(c)} />
                                    ))}
                                </MatchGroup>
                            )}
                            {finishedCards.length > 0 && (statusTab === 'All' || statusTab === 'Finished') && (
                                <MatchGroup title="✓ Full Time" count={finishedCards.length}>
                                    {finishedCards.map(c => (
                                        <MatchCard key={c.fixtureId} card={c} onWatch={() => handleWatch(c)} />
                                    ))}
                                </MatchGroup>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="livepage-pagination">
                                    <button
                                        className="livepage-page-btn"
                                        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft size={16} /> Prev
                                    </button>

                                    <div className="livepage-page-numbers">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                                            .reduce<(number | '...')[]>((acc, n, idx, arr) => {
                                                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('...')
                                                acc.push(n)
                                                return acc
                                            }, [])
                                            .map((n, i) =>
                                                n === '...'
                                                    ? <span key={`ellipsis-${i}`} className="livepage-page-ellipsis">&hellip;</span>
                                                    : <button
                                                        key={n}
                                                        className={`livepage-page-num${page === n ? ' active' : ''}`}
                                                        onClick={() => { setPage(n as number); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                                    >
                                                        {n}
                                                    </button>
                                            )
                                        }
                                    </div>

                                    <button
                                        className="livepage-page-btn"
                                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                        disabled={page === totalPages}
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Empty */}
                    {!loading && !error && filtered.length === 0 && (
                        <div className="livepage-empty">
                            <div className="livepage-empty__icon">⚽</div>
                            <h3>No matches found</h3>
                            <p>Try a different filter or check back later.</p>
                            <button
                                className="btn btn-outline"
                                onClick={() => { setStatusTab('All'); setLeague(ALL_LEAGUES) }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ── STREAM PLAYER ─────────────────────────────────── */}
            {activeCard && (
                <StreamPlayer
                    match={{
                        id: String(activeCard.fixtureId),
                        status: activeCard.status,
                        league: activeCard.league,
                        leagueLogo: activeCard.leagueLogo,
                        leagueColor: activeCard.leagueColor,
                        homeName: activeCard.homeName,
                        homeShort: activeCard.homeShortName,
                        homeLogo: activeCard.homeLogo,
                        awayName: activeCard.awayName,
                        awayShort: activeCard.awayShortName,
                        awayLogo: activeCard.awayLogo,
                        homeScore: activeCard.homeScore ?? 0,
                        awayScore: activeCard.awayScore ?? 0,
                        minute: null,
                        kickoffTime: '',
                        venue: activeCard.venue,
                        events: [],
                        streamUrl: activeCard.streamUrl ?? 'embed:about:blank',
                        broadcasters: [],
                    }}
                    onClose={() => setActiveCard(null)}
                />
            )}
        </div>
    )
}

// ── Match Group ────────────────────────────────────────────────
function MatchGroup({ title, count, live, children }: {
    title: string; count: number; live?: boolean; children: React.ReactNode
}) {
    return (
        <div className="livepage-group">
            <div className="livepage-group__header">
                <h2 className="livepage-group__title">{title}</h2>
                <span className="livepage-group__count">{count}</span>
                {live && <span className="livepage-group__live-pulse" />}
            </div>
            <div className="livepage-grid">{children}</div>
        </div>
    )
}

// ── Match Card ─────────────────────────────────────────────────
function MatchCard({ card, onWatch }: { card: LiveMatchData; onWatch: () => void }) {
    const navigate = useNavigate()
    const hasStream = !!card.streamUrl
    const isLiveCard = card.status === 'LIVE'
    const isDirectStream = isDirectHls(card.streamUrl)

    return (
        <div
            className={`mc${isLiveCard ? ' mc--live' : ''}${card.status === 'FINISHED' ? ' mc--finished' : ''}`}
            style={{ '--league-color': card.leagueColor } as React.CSSProperties}
        >
            {/* League bar */}
            <div className="mc__league">
                <span className="mc__league-emoji">{card.leagueLogo}</span>
                <span className="mc__league-name">&nbsp;{card.league}</span>
                <span className={`mc__status-badge mc__status-badge--${card.status.toLowerCase()}`}>
                    {isLiveCard && <span className="mc__live-pulse" />}
                    {isLiveCard ? card.minuteLabel : card.status === 'UPCOMING' ? card.minuteLabel : 'FT'}
                </span>
            </div>

            {/* Clickable body → match detail page */}
            <div
                className="mc__body"
                onClick={() => navigate(`/match/${card.fixtureId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/match/${card.fixtureId}`)}
                aria-label={`View ${card.homeName} vs ${card.awayName} details`}
            >
                <div className="mc__match">
                    {/* Home */}
                    <div className="mc__team mc__team--home">
                        <div className="mc__crest-wrap">
                            {card.homeLogo
                                ? <img src={card.homeLogo} alt={card.homeName} className="mc__crest" />
                                : <span className="mc__crest-fallback">🏟</span>
                            }
                        </div>
                        <span className="mc__name" title={card.homeName}>{card.homeShortName}</span>
                    </div>

                    {/* Score / VS */}
                    <div className="mc__center">
                        {card.status === 'UPCOMING' ? (
                            <div className="mc__vs">VS</div>
                        ) : (
                            <div className="mc__score">
                                <span className={card.homeScore !== null && card.awayScore !== null && card.homeScore > card.awayScore ? 'mc__score-win' : ''}>
                                    {card.homeScore ?? 0}
                                </span>
                                <span className="mc__score-dash">:</span>
                                <span className={card.homeScore !== null && card.awayScore !== null && card.awayScore > card.homeScore ? 'mc__score-win' : ''}>
                                    {card.awayScore ?? 0}
                                </span>
                            </div>
                        )}
                        {card.venue && (
                            <div className="mc__venue" title={card.venue}>
                                {card.venue.length > 22 ? card.venue.slice(0, 22) + '\u2026' : card.venue}
                            </div>
                        )}
                    </div>

                    {/* Away */}
                    <div className="mc__team mc__team--away">
                        <div className="mc__crest-wrap">
                            {card.awayLogo
                                ? <img src={card.awayLogo} alt={card.awayName} className="mc__crest" />
                                : <span className="mc__crest-fallback">🏟</span>
                            }
                        </div>
                        <span className="mc__name" title={card.awayName}>{card.awayShortName}</span>
                    </div>
                </div>{/* end mc__match */}
            </div>{/* end mc__body */}

            {/* Watch button */}
            <div className="mc__footer">
                {hasStream ? (
                    isDirectStream ? (
                        // Direct HLS → opens in-page player
                        <button className="mc__watch-btn" onClick={onWatch}>
                            <Play size={13} />
                            {isLiveCard ? 'Watch Live' : 'Watch Replay'}
                        </button>
                    ) : (
                        // Streaming site link → opens new tab
                        <button className="mc__watch-btn mc__watch-btn--external" onClick={onWatch}>
                            <ExternalLink size={13} />
                            {isLiveCard ? 'Watch Live' : 'Watch Stream'}
                        </button>
                    )
                ) : (
                    <span className="mc__no-stream">Stream not yet assigned</span>
                )}
            </div>
        </div>
    )
}
