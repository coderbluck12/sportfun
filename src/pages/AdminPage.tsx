import { useState, useEffect, useMemo } from 'react'
import { Lock, Plus, Trash2, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle, Wifi, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStreamUrls } from '../hooks/useStreamUrls'
import {
    getAllTodaysTopMatches,
    isLive,
    isUpcoming,
    statusLabel,
    getLeagueMeta,
    type FDMatch,
} from '../services/footballApi'
import './AdminPage.css'

// ── Password gate (change this to your own password) ──────────
const ADMIN_PASSWORD = 'sportfun2026'

const STORAGE_KEY = 'sf_fdtoken'   // football-data.org token key
const FIXTURE_PAGE_SIZE = 10       // fixture rows per page

const STREAM_TIPS = [
    { label: 'HLS Stream (m3u8)', example: 'https://cdn.example.com/live/match.m3u8', desc: 'Best quality — plays natively in the site video player' },
    { label: 'Iframe Embed', example: 'embed:https://player.example.com/embed/abc123', desc: 'Add "embed:" prefix — loads in an iframe inside the player' },
    { label: 'Auto-Extract (resolve:) ✨', example: 'resolve:https://gooz.aapmains.net/new-stream-embed/45625', desc: 'Add "resolve:" prefix — fetches the embed page server-side, extracts the .m3u8, bypasses CSP blocks' },
]


export default function AdminPage() {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('sf_admin') === '1')
    const [pwInput, setPwInput] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [pwError, setPwError] = useState(false)

    const { urls, setUrl, removeUrl, clearAll } = useStreamUrls()

    const [matches, setMatches] = useState<FDMatch[]>([])
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')

    const [manualId, setManualId] = useState('')
    const [manualUrl, setManualUrl] = useState('')
    const [saveMsg, setSaveMsg] = useState('')
    const [fixPage, setFixPage] = useState(1)

    // ── Auth ──────────────────────────────────────────────────
    const login = () => {
        if (pwInput === ADMIN_PASSWORD) {
            sessionStorage.setItem('sf_admin', '1')
            setAuthed(true)
        } else {
            setPwError(true)
            setTimeout(() => setPwError(false), 1500)
        }
    }

    // ── Load matches ──────────────────────────────────────────
    const loadMatches = async () => {
        if (!token.trim()) { setApiError('Enter your football-data.org token first'); return }
        localStorage.setItem(STORAGE_KEY, token.trim())
        setLoading(true)
        setApiError(null)
        try {
            const data = await getAllTodaysTopMatches(token.trim())
            // Sort: LIVE first, upcoming, finished
            setMatches(data.sort((a, b) => {
                const order = (m: FDMatch) => isLive(m) ? 0 : isUpcoming(m) ? 1 : 2
                return order(a) - order(b)
            }))
            setFixPage(1)  // reset to page 1 when new data loads
        } catch (e: unknown) {
            setApiError(e instanceof Error ? e.message : 'Failed to load matches')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (authed && token) loadMatches()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authed])

    const flash = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000) }

    // Pagination for fixtures
    const fixTotalPages = Math.ceil(matches.length / FIXTURE_PAGE_SIZE)
    const pagedMatches = useMemo(
        () => matches.slice((fixPage - 1) * FIXTURE_PAGE_SIZE, fixPage * FIXTURE_PAGE_SIZE),
        [matches, fixPage]
    )

    const saveManual = () => {
        if (!manualId || !manualUrl) return
        setUrl(manualId, manualUrl)
        flash(`✅ Saved stream for Match ID ${manualId}`)
        setManualId(''); setManualUrl('')
    }

    const saveFromMatch = (m: FDMatch, url: string) => {
        if (!url.trim()) return
        setUrl(m.id, url)
        flash(`✅ Saved stream for ${m.homeTeam.name} vs ${m.awayTeam.name}`)
    }

    // ── Login screen ──────────────────────────────────────────
    if (!authed) {
        return (
            <div className="admin-login">
                <div className="admin-login__box glass-card">
                    <div className="admin-login__icon"><Lock size={28} /></div>
                    <h2>Admin Access</h2>
                    <p>Sportfun Stream Manager</p>
                    <div className={`admin-login__field ${pwError ? 'error' : ''}`}>
                        <input
                            type={showPw ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={pwInput}
                            onChange={e => setPwInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && login()}
                            autoFocus
                        />
                        <button onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {pwError && <p className="admin-login__error">Incorrect password</p>}
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={login}>
                        <Lock size={14} /> Login
                    </button>
                </div>
            </div>
        )
    }

    // ── Dashboard ─────────────────────────────────────────────
    return (
        <div className="admin-page">
            <div className="container">

                <div className="admin-header">
                    <div>
                        <h1 className="admin-header__title">🎛️ Stream Manager</h1>
                        <p className="admin-header__sub">football-data.org · Assign stream URLs to live matches</p>
                    </div>
                    <div className="admin-header__stats">
                        <div className="admin-stat">
                            <span className="admin-stat__val">{Object.keys(urls).length}</span>
                            <span className="admin-stat__label">Streams Saved</span>
                        </div>
                        <div className="admin-stat">
                            <span className="admin-stat__val">{matches.filter(isLive).length}</span>
                            <span className="admin-stat__label">Live Now</span>
                        </div>
                    </div>
                </div>

                {saveMsg && (
                    <div className="admin-toast">
                        <CheckCircle size={16} /> {saveMsg}
                    </div>
                )}

                {/* Stream URL format tips */}
                <div className="admin-tips glass-card">
                    <div className="admin-tips__title"><Info size={14} /> Stream URL Format</div>
                    <div className="admin-tips__list">
                        {STREAM_TIPS.map(tip => (
                            <div key={tip.label} className="admin-tip">
                                <strong>{tip.label}</strong>
                                <code>{tip.example}</code>
                                <span>{tip.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── LIVE FIXTURES ──────────────────────────────────── */}
                <section className="admin-section">
                    <div className="admin-section__header">
                        <h2>Today's Matches</h2>
                        <div className="admin-api-row">
                            <input
                                type="text"
                                placeholder="Paste your football-data.org API token..."
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                className="admin-api-input"
                            />
                            <button className="btn btn-outline admin-refresh-btn" onClick={loadMatches} disabled={loading}>
                                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                                {loading ? 'Loading...' : 'Load Matches'}
                            </button>
                        </div>
                        {apiError && (
                            <div className="admin-api-error">
                                <AlertCircle size={14} /> {apiError}
                                {apiError.includes('token') && (
                                    <span>
                                        {' '}— Get your token at{' '}
                                        <a href="https://www.football-data.org/client/register" target="_blank" rel="noreferrer">
                                            football-data.org
                                        </a>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {matches.length > 0 ? (
                        <>
                            {/* results line */}
                            <div className="admin-fixtures-meta">
                                <span>{matches.length} match{matches.length !== 1 ? 'es' : ''} · Page {fixPage} of {fixTotalPages}</span>
                            </div>
                            <div className="admin-fixtures">
                                {pagedMatches.map(m => {
                                    const league = getLeagueMeta(m.competition.code)
                                    const live = isLive(m)
                                    const saved = urls[String(m.id)]
                                    return (
                                        <MatchRow
                                            key={m.id}
                                            match={m}
                                            live={live}
                                            league={league}
                                            savedUrl={saved}
                                            onSave={url => saveFromMatch(m, url)}
                                            onRemove={() => removeUrl(m.id)}
                                        />
                                    )
                                })}
                            </div>
                            {/* Pagination */}
                            {fixTotalPages > 1 && (
                                <div className="admin-pagination">
                                    <button
                                        className="admin-page-btn"
                                        onClick={() => setFixPage(p => Math.max(1, p - 1))}
                                        disabled={fixPage === 1}
                                    >
                                        <ChevronLeft size={15} /> Prev
                                    </button>
                                    <div className="admin-page-numbers">
                                        {Array.from({ length: fixTotalPages }, (_, i) => i + 1)
                                            .filter(n => n === 1 || n === fixTotalPages || Math.abs(n - fixPage) <= 1)
                                            .reduce<(number | '...')[]>((acc, n, idx, arr) => {
                                                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('...')
                                                acc.push(n)
                                                return acc
                                            }, [])
                                            .map((n, i) =>
                                                n === '...'
                                                    ? <span key={`e-${i}`} className="admin-page-ellipsis">&hellip;</span>
                                                    : <button
                                                        key={n}
                                                        className={`admin-page-num${fixPage === n ? ' active' : ''}`}
                                                        onClick={() => setFixPage(n as number)}
                                                    >{n}</button>
                                            )
                                        }
                                    </div>
                                    <button
                                        className="admin-page-btn"
                                        onClick={() => setFixPage(p => Math.min(fixTotalPages, p + 1))}
                                        disabled={fixPage === fixTotalPages}
                                    >
                                        Next <ChevronRight size={15} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : !loading && (
                        <div className="admin-empty">
                            <Wifi size={32} />
                            <p>Enter your API token and click "Load Matches" to see today's fixtures</p>
                            <a
                                href="https://www.football-data.org/client/register"
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline"
                                style={{ fontSize: '0.8rem' }}
                            >
                                Get Free Token →
                            </a>
                        </div>
                    )}
                </section>

                {/* ── MANUAL ENTRY ───────────────────────────────────── */}
                <section className="admin-section">
                    <h2>Manual Stream Entry</h2>
                    <p className="admin-section__desc">
                        Use this if you know the Match ID directly. The ID is shown on each match card on the /live page.
                    </p>
                    <div className="admin-manual glass-card">
                        <div className="admin-manual__row">
                            <div className="admin-form-field">
                                <label>Match ID (from football-data.org)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 498530"
                                    value={manualId}
                                    onChange={e => setManualId(e.target.value)}
                                />
                            </div>
                            <div className="admin-form-field">
                                <label>Notes (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Real Madrid vs Arsenal"
                                    value={manualUrl}
                                    onChange={() => { }}
                                    readOnly
                                    style={{ opacity: 0.5 }}
                                />
                            </div>
                        </div>
                        <div className="admin-form-field">
                            <label>Stream URL</label>
                            <input
                                type="text"
                                placeholder="https://cdn.example.com/live/match.m3u8  –or–  embed:https://player.example.com/embed/123"
                                value={manualUrl}
                                onChange={e => setManualUrl(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={saveManual}
                            disabled={!manualId || !manualUrl}
                        >
                            <Plus size={15} /> Save Stream URL
                        </button>
                    </div>
                </section>

                {/* ── SAVED URLS ─────────────────────────────────────── */}
                {Object.keys(urls).length > 0 && (
                    <section className="admin-section">
                        <div className="admin-section__header">
                            <h2>Saved Stream URLs ({Object.keys(urls).length})</h2>
                            <button
                                className="admin-clear-btn"
                                onClick={() => { if (confirm('Clear all saved streams?')) clearAll() }}
                            >
                                <Trash2 size={14} /> Clear All
                            </button>
                        </div>
                        <div className="admin-saved-list glass-card">
                            {Object.entries(urls).map(([id, url]) => (
                                <div key={id} className="admin-saved-item">
                                    <div className="admin-saved-item__info">
                                        <span className="admin-saved-item__id">Match #{id}</span>
                                        <span className="admin-saved-item__url">{url}</span>
                                    </div>
                                    <button className="admin-remove-btn" onClick={() => removeUrl(id)} title="Remove">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

// ── MatchRow sub-component ─────────────────────────────────────
interface MatchRowProps {
    match: FDMatch
    live: boolean
    league: { name: string; color: string; logo: string }
    savedUrl: string | undefined
    onSave: (url: string) => void
    onRemove: () => void
}

function MatchRow({ match: m, live, league, savedUrl, onSave, onRemove }: MatchRowProps) {
    const [urlInput, setUrlInput] = useState(savedUrl ?? '')
    const [editing, setEditing] = useState(!savedUrl)
    const label = statusLabel(m)

    return (
        <div className={`fixture-row glass-card${live ? ' fixture-row--live' : ''}`}>
            <div className="fixture-row__left">
                <div className="fixture-row__league" style={{ color: league.color }}>
                    {league.logo} {m.competition.name}
                </div>
                <div className="fixture-row__teams">
                    <img src={m.homeTeam.crest} alt="" className="fixture-row__badge" />
                    <span>{m.homeTeam.name}</span>
                    <span className="fixture-row__score">
                        {live || m.status === 'FINISHED'
                            ? `${m.score.fullTime.home ?? 0} : ${m.score.fullTime.away ?? 0}`
                            : 'vs'}
                    </span>
                    <span>{m.awayTeam.name}</span>
                    <img src={m.awayTeam.crest} alt="" className="fixture-row__badge" />
                </div>
                <div className="fixture-row__meta">
                    <span className="fixture-row__id">ID: {m.id}</span>
                    <span className={`fixture-row__status${live ? ' live' : ''}`}>
                        {live && <span className="live-dot" />}
                        {label}
                    </span>
                    {m.venue && <span>{m.venue}</span>}
                </div>
            </div>

            <div className="fixture-row__right">
                {savedUrl && !editing ? (
                    <div className="fixture-row__saved">
                        <CheckCircle size={14} className="fixture-row__check" />
                        <span className="fixture-row__url-preview">{savedUrl.slice(0, 52)}…</span>
                        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => setEditing(true)}>
                            Edit
                        </button>
                        <button className="admin-remove-btn" onClick={onRemove} title="Remove">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="fixture-row__input-row">
                        <input
                            type="text"
                            placeholder="Paste stream URL here..."
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            className="fixture-row__input"
                        />
                        <button
                            className="btn btn-primary"
                            style={{ flexShrink: 0, padding: '8px 16px', fontSize: '0.8rem' }}
                            onClick={() => { onSave(urlInput); setEditing(false) }}
                            disabled={!urlInput.trim()}
                        >
                            <Plus size={13} /> Save
                        </button>
                        {savedUrl && (
                            <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '0.75rem' }} onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
