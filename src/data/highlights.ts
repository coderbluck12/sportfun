// ============================================================
// Sportfun — Highlights Data
// ============================================================

export interface Highlight {
    id: string;
    title: string;
    teams: string;
    league: string;
    leagueBadge: string;
    score: string;
    date: string;
    duration: string;
    views: string;
    thumbnail: string;
    youtubeId: string;
    featured?: boolean;
    isNew?: boolean;
    isHot?: boolean;
}

export const highlights: Highlight[] = [
    {
        id: '1',
        title: "Stunning Bicycle Kick from 30 Yards",
        teams: "Manchester City vs Real Madrid",
        league: "UCL",
        leagueBadge: "gold",
        score: "2 - 1",
        date: "Feb 18, 2026",
        duration: "3:42",
        views: "2.4M",
        thumbnail: "/thumb1.png",
        youtubeId: "dQw4w9WgXcQ",
        featured: true,
        isHot: true,
    },
    {
        id: '2',
        title: "Last-Minute Winner Sends Crowd Wild",
        teams: "Arsenal vs Liverpool",
        league: "EPL",
        leagueBadge: "red",
        score: "3 - 2",
        date: "Feb 15, 2026",
        duration: "5:10",
        views: "1.8M",
        thumbnail: "/thumb2.png",
        youtubeId: "dQw4w9WgXcQ",
        isNew: true,
    },
    {
        id: '3',
        title: "Goalkeeper Saves the Day — Incredible Triple Stop",
        teams: "Barcelona vs PSG",
        league: "UCL",
        leagueBadge: "gold",
        score: "1 - 0",
        date: "Feb 12, 2026",
        duration: "4:55",
        views: "3.1M",
        thumbnail: "/thumb3.png",
        youtubeId: "dQw4w9WgXcQ",
        isHot: true,
    },
    {
        id: '4',
        title: "Hat-Trick Hero Destroys the Defense",
        teams: "Bayern vs Dortmund",
        league: "Bundesliga",
        leagueBadge: "blue",
        score: "4 - 1",
        date: "Feb 10, 2026",
        duration: "6:30",
        views: "950K",
        thumbnail: "/thumb1.png",
        youtubeId: "dQw4w9WgXcQ",
    },
    {
        id: '5',
        title: "Nigeria Eagles Dominate AFCON Quarter Final",
        teams: "Nigeria vs Ivory Coast",
        league: "AFCON",
        leagueBadge: "green",
        score: "2 - 0",
        date: "Feb 8, 2026",
        duration: "4:15",
        views: "1.2M",
        thumbnail: "/thumb2.png",
        youtubeId: "dQw4w9WgXcQ",
        isNew: true,
    },
    {
        id: '6',
        title: "Mbappe Masterclass — Solo Run Goal",
        teams: "Real Madrid vs Valencia",
        league: "La Liga",
        leagueBadge: "purple",
        score: "3 - 0",
        date: "Feb 6, 2026",
        duration: "3:55",
        views: "4.7M",
        thumbnail: "/thumb3.png",
        youtubeId: "dQw4w9WgXcQ",
        isHot: true,
    },
];

export const leagues = ["All", "UCL", "EPL", "La Liga", "Bundesliga", "AFCON"];
