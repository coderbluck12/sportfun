import { Play, Clock, MapPin, Zap } from 'lucide-react'
import type { LiveMatch } from '../data/liveMatches'
import './LiveMatchCard.css'

interface Props {
    match: LiveMatch
    onWatch: (match: LiveMatch) => void
}

const eventIcons: Record<string, string> = {
    GOAL: '⚽',
    YELLOW: '🟨',
    RED: '🟥',
    SUBSTITUTION: '🔄',
}

export default function LiveMatchCard({ match, onWatch }: Props) {
    const isLive = match.status === 'LIVE'
    const isUpcoming = match.status === 'UPCOMING'
    const isFinished = match.status === 'FINISHED'

    const recentEvents = [...match.events].slice(-3).reverse()

    return (
        <div
            className={`lmc ${isLive ? 'lmc--live' : ''} ${isFinished ? 'lmc--finished' : ''}`}
            style={{ '--league-color': match.leagueColor } as React.CSSProperties}
        >
            {/* League header */}
            <div className="lmc__league">
                <span className="lmc__league-logo">{match.leagueLogo}</span>
                <span className="lmc__league-name">{match.league}</span>
                {isLive && (
                    <span className="lmc__live-badge">
                        <span className="lmc__live-dot" /> LIVE
                    </span>
                )}
                {isUpcoming && (
                    <span className="lmc__upcoming-badge">
                        <Clock size={10} /> {match.kickoffTime}
                    </span>
                )}
                {isFinished && <span className="lmc__finished-badge">FT</span>}
            </div>

            {/* Score Row */}
            <div className="lmc__score-row">
                {/* Home */}
                <div className="lmc__team lmc__team--home">
                    <span className="lmc__team-logo">{match.homeLogo}</span>
                    <span className="lmc__team-name">{match.homeName}</span>
                </div>

                {/* Score / VS */}
                <div className="lmc__score-center">
                    {isUpcoming ? (
                        <div className="lmc__vs">VS</div>
                    ) : (
                        <>
                            <div className="lmc__score">
                                <span>{match.homeScore}</span>
                                <span className="lmc__score-sep">:</span>
                                <span>{match.awayScore}</span>
                            </div>
                            {isLive && (
                                <div className="lmc__minute">
                                    {match.minute}<span className="lmc__minute-tick">'</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Away */}
                <div className="lmc__team lmc__team--away">
                    <span className="lmc__team-name">{match.awayName}</span>
                    <span className="lmc__team-logo">{match.awayLogo}</span>
                </div>
            </div>

            {/* Venue */}
            <div className="lmc__venue">
                <MapPin size={11} />
                {match.venue}
            </div>

            {/* Events */}
            {recentEvents.length > 0 && (
                <div className="lmc__events">
                    {recentEvents.map((ev, i) => (
                        <div key={i} className={`lmc__event lmc__event--${ev.team}`}>
                            <span>{eventIcons[ev.type]}</span>
                            <span className="lmc__event-text">
                                {ev.minute}' {ev.player}
                                {ev.assist && <span className="lmc__event-assist"> (A: {ev.assist})</span>}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Watch Button */}
            <div className="lmc__footer">
                {(isLive || isFinished) && (
                    <button className="lmc__watch-btn" onClick={() => onWatch(match)}>
                        <Play size={13} fill="currentColor" />
                        {isLive ? 'Watch Live' : 'Watch Replay'}
                    </button>
                )}
                {isUpcoming && (
                    <button className="lmc__notify-btn" onClick={() => onWatch(match)}>
                        <Zap size={13} />
                        Set Reminder
                    </button>
                )}
                <div className="lmc__broadcasters">
                    {match.broadcasters.slice(0, 2).map(b => (
                        <span key={b} className="lmc__broadcaster">{b}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}
