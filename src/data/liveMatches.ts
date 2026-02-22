// ============================================================
// Sportfun — Live Matches Data
// ============================================================
// 
// HOW STREAMS WORK:
//   Each match has a `streamUrl` field. Set it to either:
//   - An HLS .m3u8 URL   → plays natively in the video player
//   - An iframe embed URL → displayed via <iframe> (prefix with "embed:")
//
// Example:
//   streamUrl: "https://your-cdn.com/stream/match123.m3u8"
//   streamUrl: "embed:https://your-stream-partner.com/embed/match123"
//
// ============================================================

export interface LiveMatch {
    id: string
    status: 'LIVE' | 'UPCOMING' | 'FINISHED'
    league: string
    leagueLogo: string      // emoji or URL
    leagueColor: string
    homeName: string
    homeShort: string
    homeLogo: string        // emoji flag or team badge URL
    awayName: string
    awayShort: string
    awayLogo: string
    homeScore: number
    awayScore: number
    minute: number | null   // null if upcoming
    kickoffTime: string
    venue: string
    events: MatchEvent[]
    streamUrl: string       // m3u8 or "embed:https://..." 
    broadcasters: string[]  // fallback broadcaster names
}

export interface MatchEvent {
    minute: number
    type: 'GOAL' | 'YELLOW' | 'RED' | 'SUBSTITUTION'
    team: 'home' | 'away'
    player: string
    assist?: string
}

// ── MOCK DATA ────────────────────────────────────────────────
// Replace each `streamUrl` with your actual licensed stream URL.
// To use an HLS stream: "https://cdn.example.com/live/match.m3u8"
// To use an iframe embed: "embed:https://player.example.com/embed/123"

export const liveMatches: LiveMatch[] = [
    {
        id: 'ucl-1',
        status: 'LIVE',
        league: 'UEFA Champions League',
        leagueLogo: '⭐',
        leagueColor: '#1a56f0',
        homeName: 'Real Madrid',
        homeShort: 'MAD',
        homeLogo: '⚽',
        awayName: 'Manchester City',
        awayShort: 'MCI',
        awayLogo: '🔵',
        homeScore: 2,
        awayScore: 1,
        minute: 67,
        kickoffTime: '20:00',
        venue: 'Santiago Bernabéu',
        events: [
            { minute: 23, type: 'GOAL', team: 'home', player: 'Vinicius Jr.' },
            { minute: 41, type: 'GOAL', team: 'away', player: 'Haaland', assist: 'De Bruyne' },
            { minute: 55, type: 'GOAL', team: 'home', player: 'Bellingham' },
            { minute: 60, type: 'YELLOW', team: 'away', player: 'Rodri' },
        ],
        // 🔴 REPLACE with your licensed HLS stream URL
        streamUrl: 'embed:https://www.youtube.com/embed/live_stream?channel=UCL',
        broadcasters: ['CBS Sports (US)', 'BT Sport (UK)', 'DAZN'],
    },
    {
        id: 'pl-1',
        status: 'LIVE',
        league: 'Premier League',
        leagueLogo: '🦁',
        leagueColor: '#38003c',
        homeName: 'Arsenal',
        homeShort: 'ARS',
        homeLogo: '🔴',
        awayName: 'Liverpool',
        awayShort: 'LIV',
        awayLogo: '🔴',
        homeScore: 1,
        awayScore: 1,
        minute: 34,
        kickoffTime: '17:30',
        venue: 'Emirates Stadium',
        events: [
            { minute: 12, type: 'GOAL', team: 'home', player: 'Saka', assist: 'Martinelli' },
            { minute: 29, type: 'GOAL', team: 'away', player: 'Salah' },
        ],
        streamUrl: 'embed:https://www.youtube.com/embed/live_stream?channel=PL',
        broadcasters: ['Sky Sports (UK)', 'NBC Sports (US)', 'Optus Sport (AU)'],
    },
    {
        id: 'll-1',
        status: 'LIVE',
        league: 'La Liga',
        leagueLogo: '🇪🇸',
        leagueColor: '#ee8307',
        homeName: 'Barcelona',
        homeShort: 'BAR',
        homeLogo: '🔵',
        awayName: 'Atlético Madrid',
        awayShort: 'ATM',
        awayLogo: '🔴',
        homeScore: 3,
        awayScore: 0,
        minute: 82,
        kickoffTime: '21:00',
        venue: 'Camp Nou',
        events: [
            { minute: 8, type: 'GOAL', team: 'home', player: 'Yamal', assist: 'Dani Olmo' },
            { minute: 35, type: 'GOAL', team: 'home', player: 'Raphinha' },
            { minute: 71, type: 'GOAL', team: 'home', player: 'Lewandowski' },
            { minute: 78, type: 'RED', team: 'away', player: 'Griezmann' },
        ],
        streamUrl: 'embed:https://www.youtube.com/embed/live_stream?channel=LaLiga',
        broadcasters: ['DAZN (UK)', 'ESPN+ (US)', 'Premier Sports'],
    },
    {
        id: 'sa-1',
        status: 'UPCOMING',
        league: 'Serie A',
        leagueLogo: '🇮🇹',
        leagueColor: '#00529f',
        homeName: 'Inter Milan',
        homeShort: 'INT',
        homeLogo: '⚫',
        awayName: 'Juventus',
        awayShort: 'JUV',
        awayLogo: '⚪',
        homeScore: 0,
        awayScore: 0,
        minute: null,
        kickoffTime: '22:45',
        venue: 'San Siro',
        events: [],
        streamUrl: 'embed:https://www.youtube.com/embed/live_stream?channel=SerieA',
        broadcasters: ['Sky Italia', 'DAZN Italia', 'BT Sport'],
    },
    {
        id: 'bl-1',
        status: 'UPCOMING',
        league: 'Bundesliga',
        leagueLogo: '🦅',
        leagueColor: '#d00027',
        homeName: 'Bayern Munich',
        homeShort: 'BAY',
        homeLogo: '🔴',
        awayName: 'Borussia Dortmund',
        awayShort: 'BVB',
        awayLogo: '🟡',
        homeScore: 0,
        awayScore: 0,
        minute: null,
        kickoffTime: '23:30',
        venue: 'Allianz Arena',
        events: [],
        streamUrl: 'embed:https://www.youtube.com/embed/live_stream?channel=Bundesliga',
        broadcasters: ['Sky Sport (DE)', 'ESPN+ (US)', 'DAZN'],
    },
    {
        id: 'afcon-1',
        status: 'FINISHED',
        league: 'AFCON 2026',
        leagueLogo: '🌍',
        leagueColor: '#009a44',
        homeName: 'Nigeria',
        homeShort: 'NGA',
        homeLogo: '🇳🇬',
        awayName: 'Senegal',
        awayShort: 'SEN',
        awayLogo: '🇸🇳',
        homeScore: 2,
        awayScore: 1,
        minute: 90,
        kickoffTime: '18:00',
        venue: 'Stade Olympique',
        events: [
            { minute: 33, type: 'GOAL', team: 'home', player: 'Osimhen' },
            { minute: 61, type: 'GOAL', team: 'away', player: 'Dia' },
            { minute: 88, type: 'GOAL', team: 'home', player: 'Lookman' },
        ],
        streamUrl: 'embed:https://www.youtube.com/embed/live_stream?channel=AFCON',
        broadcasters: ['beIN Sports', 'SuperSport Africa', 'CAF TV'],
    },
]

export const liveLeagues = ['All', 'UCL', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'AFCON']
