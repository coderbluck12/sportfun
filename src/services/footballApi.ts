// ============================================================
// Sportfun — football-data.org v4 API Service
// ============================================================
//
// SETUP:
//   1. Sign up at https://www.football-data.org/client/register
//   2. Copy your API token from your account profile
//   3. Either:
//      a) Paste it in the /admin panel (saved automatically)
//      b) Add to .env.local: VITE_FOOTBALLDATA_TOKEN=your_token_here
//
// FREE TIER competitions available:
//   CL  — UEFA Champions League
//   PL  — Premier League (England)
//   BL1 — Bundesliga (Germany)
//   PD  — La Liga / Primera Division (Spain)
//   SA  — Serie A (Italy)
//   FL1 — Ligue 1 (France)
//   WC  — FIFA World Cup
//   EC  — European Championship
//
// Rate limit: 10 requests / minute on free tier
// Docs: https://www.football-data.org/documentation/quickstart
// ============================================================

// In dev: use the Vite proxy → avoids CORS during local development
// In prod: use the Vercel serverless function → actual server-side proxy
const BASE_URL = import.meta.env.DEV
    ? '/fd-api/v4'        // Vite dev proxy  (vite.config.ts)
    : '/api/fd-proxy/v4'  // Vercel function (api/fd-proxy.ts)

function getHeaders(token: string): Record<string, string> {
    return { 'X-Auth-Token': token }
}

// ── Response Types ────────────────────────────────────────────

export interface FDTeam {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
}

export interface FDScore {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
}

export interface FDCompetition {
    id: number
    name: string
    code: string
    type: string
    emblem: string
}

export interface FDMatch {
    id: number
    competition: FDCompetition
    utcDate: string
    status:
    | 'SCHEDULED'    // not started yet (no set time)
    | 'TIMED'        // upcoming, has set time
    | 'IN_PLAY'      // live
    | 'PAUSED'       // half-time
    | 'FINISHED'     // full time
    | 'CANCELLED'
    | 'POSTPONED'
    | 'SUSPENDED'
    | 'AWARDED'
    minute: number | null
    injuryTime: number | null
    venue: string | null
    homeTeam: FDTeam
    awayTeam: FDTeam
    score: FDScore
    referees: Array<{ id: number; name: string; nationality: string }>
}

interface FDMatchesResponse {
    matches: FDMatch[]
    resultSet?: { count: number; competitions: string; first: string; last: string; played: number }
}

// ── Fetch helper ───────────────────────────────────────────────

async function apiFetch<T>(path: string, token: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { headers: getHeaders(token) })
    if (res.status === 429) throw new Error('Rate limit hit — wait 1 minute and try again')
    if (res.status === 401) throw new Error('Invalid API token — check your football-data.org token')
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
    return res.json() as Promise<T>
}

// ── Competition codes (free tier) ──────────────────────────────

export const TOP_COMPETITION_CODES = ['CL', 'PL', 'BL1', 'PD', 'SA', 'FL1'] as const
export type CompetitionCode = typeof TOP_COMPETITION_CODES[number]

// ── Exported API functions ─────────────────────────────────────

/**
 * GET /v4/matches
 * Returns today's matches across ALL subscribed competitions.
 * This is the most efficient single call for the live page.
 */
export async function getTodaysMatches(token: string): Promise<FDMatch[]> {
    const data = await apiFetch<FDMatchesResponse>('/matches', token)
    return data.matches ?? []
}

/**
 * GET /v4/matches?status=IN_PLAY
 * Returns only matches currently in play (live) across all subscribed competitions.
 */
export async function getLiveMatches(token: string): Promise<FDMatch[]> {
    const data = await apiFetch<FDMatchesResponse>('/matches?status=IN_PLAY', token)
    return data.matches ?? []
}

/**
 * GET /v4/competitions/{code}/matches?status=LIVE
 * Returns live matches for a specific competition.
 */
export async function getLiveMatchesByCompetition(token: string, code: CompetitionCode): Promise<FDMatch[]> {
    const data = await apiFetch<FDMatchesResponse>(
        `/competitions/${code}/matches?status=IN_PLAY`,
        token
    )
    return data.matches ?? []
}

/**
 * Fetch today's matches across all top competitions in parallel.
 * Falls back gracefully on individual competition errors.
 */
export async function getAllTodaysTopMatches(token: string): Promise<FDMatch[]> {
    const [todayMatches, liveMatches] = await Promise.all([
        getTodaysMatches(token).catch(() => [] as FDMatch[]),
        getLiveMatches(token).catch(() => [] as FDMatch[]),
    ])

    // Merge, deduplicate by match ID — live matches take precedence
    const map = new Map<number, FDMatch>()
    todayMatches.forEach(m => map.set(m.id, m))
    liveMatches.forEach(m => map.set(m.id, m))   // live wins

    return [...map.values()]
}

// ── Status helpers ─────────────────────────────────────────────

export function isLive(m: FDMatch): boolean {
    return m.status === 'IN_PLAY' || m.status === 'PAUSED'
}

export function isUpcoming(m: FDMatch): boolean {
    return m.status === 'TIMED' || m.status === 'SCHEDULED'
}

export function isFinished(m: FDMatch): boolean {
    return m.status === 'FINISHED' || m.status === 'AWARDED'
}

export function statusLabel(m: FDMatch): string {
    if (m.status === 'IN_PLAY') {
        if (m.minute != null) return `${m.minute + (m.injuryTime ?? 0)}'`
        return 'LIVE'
    }
    if (m.status === 'PAUSED') return 'HT'
    if (m.status === 'FINISHED') return 'FT'
    if (m.status === 'AWARDED') return 'AET'
    if (m.status === 'CANCELLED') return 'Cancelled'
    if (m.status === 'POSTPONED') return 'Postponed'
    // TIMED / SCHEDULED — show kickoff time in local time
    const d = new Date(m.utcDate)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── League metadata ────────────────────────────────────────────

export interface LeagueMeta {
    name: string
    color: string
    logo: string
    code: string
}

export const LEAGUE_META: Record<string, LeagueMeta> = {
    CL: { code: 'CL', name: 'UCL', color: '#1a56f0', logo: '⭐' },
    PL: { code: 'PL', name: 'Premier League', color: '#38003c', logo: '🦁' },
    BL1: { code: 'BL1', name: 'Bundesliga', color: '#d00027', logo: '🦅' },
    PD: { code: 'PD', name: 'La Liga', color: '#ee8307', logo: '🇪🇸' },
    SA: { code: 'SA', name: 'Serie A', color: '#00529f', logo: '🇮🇹' },
    FL1: { code: 'FL1', name: 'Ligue 1', color: '#1b3d78', logo: '🇫🇷' },
    WC: { code: 'WC', name: 'World Cup', color: '#c9a84c', logo: '🌍' },
    EC: { code: 'EC', name: 'Euro Championship', color: '#003399', logo: '🇪🇺' },
    ELC: { code: 'ELC', name: 'Championship', color: '#8b0000', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    PPL: { code: 'PPL', name: 'Primeira Liga', color: '#006600', logo: '🇵🇹' },
    DED: { code: 'DED', name: 'Eredivisie', color: '#ff6600', logo: '🇳🇱' },
    BSA: { code: 'BSA', name: 'Brasileirão', color: '#009c3b', logo: '🇧🇷' },
}

/** Get league meta from a competition code, with fallback */
export function getLeagueMeta(code: string): LeagueMeta {
    return LEAGUE_META[code] ?? { code, name: code, color: '#888', logo: '⚽' }
}

// ── Extended types for single-match endpoint ───────────────────

export interface FDGoal {
    minute: number
    injuryTime?: number | null
    type: 'NORMAL' | 'OWN' | 'PENALTY' | string
    team: { id: number; name: string }
    scorer: { id: number; name: string } | null
    assist: { id: number; name: string } | null
}

export interface FDBooking {
    minute: number
    team: { id: number; name: string }
    player: { id: number; name: string }
    card: 'YELLOW_CARD' | 'YELLOW_RED_CARD' | 'RED_CARD'
}

export interface FDSubstitution {
    minute: number
    team: { id: number; name: string }
    playerOut: { id: number; name: string }
    playerIn: { id: number; name: string }
}

export interface FDLineupPlayer {
    id: number
    name: string
    position: string
    shirtNumber: number
}

export interface FDLineup {
    id: number
    name: string
    formation: string | null
    startXI: Array<{ player: FDLineupPlayer }>
    bench: Array<{ player: FDLineupPlayer }>
}

export interface FDMatchDetail extends FDMatch {
    goals: FDGoal[]
    bookings: FDBooking[]
    substitutions: FDSubstitution[]
    lineups: FDLineup[]
}

export interface FDH2HResponse {
    matches: FDMatch[]
    resultSet: { count: number; competitions: string }
    aggregates: {
        numberOfMatches: number
        totalGoals: number
        homeTeam: { id: number; name: string; wins: number; draws: number; losses: number }
        awayTeam: { id: number; name: string; wins: number; draws: number; losses: number }
    }
}

// ── Single match + H2H API calls ──────────────────────────────

/** GET /v4/matches/{id} — full detail: events, lineups, referees */
export async function getMatchById(token: string, matchId: string | number): Promise<FDMatchDetail> {
    return apiFetch<FDMatchDetail>(`/matches/${matchId}`, token)
}

/** GET /v4/matches/{id}/head2head — last N meetings between the two teams */
export async function getMatchH2H(token: string, matchId: string | number, limit = 10): Promise<FDH2HResponse> {
    return apiFetch<FDH2HResponse>(`/matches/${matchId}/head2head?limit=${limit}`, token)
}
