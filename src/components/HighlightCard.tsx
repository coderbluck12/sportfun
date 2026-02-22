import { Play, Eye, Clock, Flame, Sparkles } from 'lucide-react'
import type { Highlight } from '../data/highlights'
import './HighlightCard.css'

interface Props {
    highlight: Highlight
    onPlay: (highlight: Highlight) => void
    large?: boolean
}

const badgeClass: Record<string, string> = {
    gold: 'badge-gold',
    red: 'badge-red',
    green: 'badge-green',
    blue: 'badge-blue',
    purple: 'badge-purple',
}

export default function HighlightCard({ highlight, onPlay, large = false }: Props) {
    return (
        <div
            className={`hcard ${large ? 'hcard--large' : ''}`}
            onClick={() => onPlay(highlight)}
        >
            {/* Thumbnail */}
            <div className="hcard__thumb">
                <img src={highlight.thumbnail} alt={highlight.title} loading="lazy" />
                <div className="hcard__overlay">
                    <div className="hcard__play">
                        <Play size={large ? 28 : 22} fill="currentColor" />
                    </div>
                </div>
                <div className="hcard__duration">
                    <Clock size={10} />
                    {highlight.duration}
                </div>
                {/* Badges */}
                <div className="hcard__badges">
                    <span className={`badge ${badgeClass[highlight.leagueBadge] || 'badge-green'}`}>
                        {highlight.league}
                    </span>
                    {highlight.isHot && (
                        <span className="badge badge-red">
                            <Flame size={10} /> Hot
                        </span>
                    )}
                    {highlight.isNew && (
                        <span className="badge badge-green">
                            <Sparkles size={10} /> New
                        </span>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="hcard__info">
                <p className="hcard__teams">{highlight.teams}</p>
                <h3 className="hcard__title">{highlight.title}</h3>
                <div className="hcard__meta">
                    <div className="hcard__score">{highlight.score}</div>
                    <div className="hcard__stats">
                        <span><Eye size={12} /> {highlight.views}</span>
                        <span>{highlight.date}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
