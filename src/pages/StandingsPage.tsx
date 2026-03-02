import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle, Wifi, TrendingUp } from 'lucide-react'
import {
    getStandings,
    getLeagueMeta,
    TOP_COMPETITION_CODES,
    type FDStandingEntry,
    type FDStandingsResponse,
} from '../services/footballApi'
import './StandingsPage.css'

// Which position zones to highlight per league code
const ZONE_CONFIG: Record<string, { ucl: number; uel: number; rel: number }> = {
    PL: { ucl: 4, uel: 6, rel: 3 },
    BL1: { ucl: 4, uel: 6, rel: 3 },
    PD: { ucl: 4, uel: 6, rel: 3 },
    SA: { ucl: 4, uel: 6, rel: 3 },
    FL1: { ucl: 3, uel: 5, rel: 3 },
    CL: { ucl: 8, uel: 16, rel: 0 }, // UCL uses knockout spots, no relegation in group
}


function FormDots({ form }: { form: string | null }) {
    if (!form) return null
    const chars = form.split(',').slice(-5)
    return (
        <span className="sp-form">
            {chars.map((c, i) => (
                <span
                    key={i}
                    className={`sp-form__dot sp-form__dot--${c === 'W' ? 'w' : c === 'D' ? 'd' : 'l'}`}
                    title={c === 'W' ? 'Win' : c === 'D' ? 'Draw' : 'Loss'}
                />
            ))}
        </span>
    )
}

function SkeletonTable() {
    return (
        <div className="sp-skeleton">
            {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="sp-skeleton__row" style={{ animationDelay: `${i * 40}ms` }} />
            ))}
        </div>
    )
}

export default function StandingsPage() {
    const [activeCode, setActiveCode] = useState<string>('PL')
    const [cache, setCache] = useState<Record<string, FDStandingsResponse>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const token = localStorage.getItem('sf_fdtoken') ?? import.meta.env.VITE_FOOTBALLDATA_TOKEN ?? ''

    const fetchStandings = useCallback(async (code: string) => {
        if (cache[code]) return // already loaded — use cache
        setLoading(true)
        setError(null)
        try {
            if (!token) throw new Error('no-key')
            const data = await getStandings(token, code)
            setCache(prev => ({ ...prev, [code]: data }))
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load standings')
        } finally {
            setLoading(false)
        }
    }, [token, cache])

    useEffect(() => {
        fetchStandings(activeCode)
    }, [activeCode]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleRefresh = () => {
        // Force re-fetch by clearing cache for active tab
        setCache(prev => {
            const next = { ...prev }
            delete next[activeCode]
            return next
        })
    }

    // After clearing cache, the effect will re-run fetchStandings
    useEffect(() => {
        if (!cache[activeCode] && !loading) {
            fetchStandings(activeCode)
        }
    }, [cache, activeCode]) // eslint-disable-line react-hooks/exhaustive-deps

    const data = cache[activeCode]

    // Extract TOTAL table (or first if TOTAL not found)
    const totalTable = data?.standings.find(s => s.type === 'TOTAL') ?? data?.standings[0]
    const rows: FDStandingEntry[] = totalTable?.table ?? []

    // For UCL group stages the API returns multiple groups — detect multi-group
    const isGroupStage = (data?.standings.length ?? 0) > 1 && data?.standings[0].group != null

    const meta = getLeagueMeta(activeCode)

    return (
        <div className="sp-page">

            {/* ── HERO ─────────────────────────────────────────── */}
            <section className="sp-hero">
                <div className="sp-hero__glow" />
                <div className="container sp-hero__content">
                    <div className="sp-hero__badge">
                        <TrendingUp size={13} /> LEAGUE TABLES
                    </div>
                    <h1 className="sp-hero__title">
                        Live <span className="sp-hero__accent">Standings</span>
                    </h1>
                    <p className="sp-hero__sub">
                        UCL · Premier League · La Liga · Serie A · Bundesliga · Ligue 1
                    </p>
                </div>
            </section>

            {/* ── LEAGUE TABS ──────────────────────────────────── */}
            <section className="sp-tabs-bar">
                <div className="container sp-tabs-bar__inner">
                    <div className="sp-tabs">
                        {TOP_COMPETITION_CODES.map(code => {
                            const m = getLeagueMeta(code)
                            return (
                                <button
                                    key={code}
                                    className={`sp-tab${activeCode === code ? ' sp-tab--active' : ''}`}
                                    onClick={() => setActiveCode(code)}
                                    style={{ '--tab-color': m.color } as React.CSSProperties}
                                >
                                    <span className="sp-tab__logo">{m.logo}</span>
                                    <span className="sp-tab__name">{m.name}</span>
                                </button>
                            )
                        })}
                    </div>
                    <button
                        className="sp-refresh"
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Refresh standings"
                    >
                        <RefreshCw size={14} className={loading ? 'spin-refresh' : ''} />
                    </button>
                </div>
            </section>

            {/* ── TABLE SECTION ────────────────────────────────── */}
            <section className="sp-table-section">
                <div className="container">

                    {/* No API key */}
                    {error === 'no-key' && (
                        <div className="sp-state sp-state--warn">
                            <Wifi size={40} />
                            <h3>API Token Required</h3>
                            <p>Visit the <strong>Admin panel</strong> to add your football-data.org token.</p>
                            <a href="/admin" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                                Go to Admin →
                            </a>
                        </div>
                    )}

                    {/* Error */}
                    {error && error !== 'no-key' && (
                        <div className="sp-state sp-state--error">
                            <AlertCircle size={36} />
                            <h3>Could not load standings</h3>
                            <p>{error}</p>
                            <button className="btn btn-outline" onClick={handleRefresh}>Retry</button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && !error && <SkeletonTable />}

                    {/* Table */}
                    {!loading && !error && data && (
                        <>
                            {/* Season header */}
                            <div className="sp-season-header">
                                <span
                                    className="sp-season-header__logo"
                                    style={{ color: meta.color }}
                                >
                                    {meta.logo}
                                </span>
                                <div>
                                    <div className="sp-season-header__league">{meta.name}</div>
                                    <div className="sp-season-header__season">
                                        Season {data.season.startDate.slice(0, 4)}/{data.season.endDate.slice(2, 4)}
                                        {data.season.currentMatchday && (
                                            <> &bull; Matchday {data.season.currentMatchday}</>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            {activeCode !== 'CL' && (
                                <div className="sp-legend">
                                    <span className="sp-legend__item sp-legend__item--ucl">Champions League</span>
                                    <span className="sp-legend__item sp-legend__item--uel">Europa / Conference</span>
                                    <span className="sp-legend__item sp-legend__item--rel">Relegation</span>
                                </div>
                            )}

                            {isGroupStage ? (
                                /* Multiple group tables (UCL group stage) */
                                <div className="sp-groups">
                                    {data.standings.map(group => (
                                        <div key={group.group ?? group.stage} className="sp-group">
                                            <div className="sp-group__title">
                                                Group {group.group ?? group.stage}
                                            </div>
                                            <StandingsTable rows={group.table} code={activeCode} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <StandingsTable rows={rows} code={activeCode} />
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}

// ── Standings Table ──────────────────────────────────────────────
function StandingsTable({ rows, code }: { rows: FDStandingEntry[]; code: string }) {
    // Determine total teams for relegation zone calculation
    const total = rows.length
    const z = ZONE_CONFIG[code] ?? { ucl: 4, uel: 6, rel: 3 }

    function zone(pos: number) {
        if (pos <= z.ucl) return 'ucl'
        if (pos <= z.uel) return 'uel'
        if (z.rel > 0 && pos > total - z.rel) return 'rel'
        return null
    }

    return (
        <div className="sp-table-wrap">
            <table className="sp-table">
                <thead>
                    <tr>
                        <th className="sp-th sp-th--pos">#</th>
                        <th className="sp-th sp-th--team">Club</th>
                        <th className="sp-th sp-th--num" title="Played">P</th>
                        <th className="sp-th sp-th--num" title="Won">W</th>
                        <th className="sp-th sp-th--num" title="Drawn">D</th>
                        <th className="sp-th sp-th--num" title="Lost">L</th>
                        <th className="sp-th sp-th--num" title="Goals For">GF</th>
                        <th className="sp-th sp-th--num" title="Goals Against">GA</th>
                        <th className="sp-th sp-th--num" title="Goal Difference">GD</th>
                        <th className="sp-th sp-th--pts" title="Points">Pts</th>
                        <th className="sp-th sp-th--form">Form</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => {
                        const zoneName = zone(row.position)
                        return (
                            <tr
                                key={row.team.id}
                                className={`sp-tr${zoneName ? ` sp-tr--${zoneName}` : ''}`}
                            >
                                <td className="sp-td sp-td--pos">
                                    {zoneName && (
                                        <span className={`sp-zone-bar sp-zone-bar--${zoneName}`} />
                                    )}
                                    {row.position}
                                </td>
                                <td className="sp-td sp-td--team">
                                    {row.team.crest
                                        ? <img src={row.team.crest} alt={row.team.shortName} className="sp-crest" />
                                        : <span className="sp-crest-fallback">⚽</span>
                                    }
                                    <span className="sp-team-name" title={row.team.name}>
                                        <span className="sp-team-name--full">{row.team.name}</span>
                                        <span className="sp-team-name--short">{row.team.tla ?? row.team.shortName}</span>
                                    </span>
                                </td>
                                <td className="sp-td sp-td--num">{row.playedGames}</td>
                                <td className="sp-td sp-td--num sp-td--w">{row.won}</td>
                                <td className="sp-td sp-td--num">{row.draw}</td>
                                <td className="sp-td sp-td--num sp-td--l">{row.lost}</td>
                                <td className="sp-td sp-td--num">{row.goalsFor}</td>
                                <td className="sp-td sp-td--num">{row.goalsAgainst}</td>
                                <td className={`sp-td sp-td--num sp-td--gd${row.goalDifference > 0 ? ' pos' : row.goalDifference < 0 ? ' neg' : ''}`}>
                                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                </td>
                                <td className="sp-td sp-td--pts">{row.points}</td>
                                <td className="sp-td sp-td--form">
                                    <FormDots form={row.form} />
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
