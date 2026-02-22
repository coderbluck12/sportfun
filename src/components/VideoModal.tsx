import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Highlight } from '../data/highlights'
import './VideoModal.css'

interface Props {
    highlight: Highlight | null
    onClose: () => void
}

export default function VideoModal({ highlight, onClose }: Props) {
    // Close on Escape
    useEffect(() => {
        if (!highlight) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', handler)
            document.body.style.overflow = ''
        }
    }, [highlight, onClose])

    if (!highlight) return null

    return (
        <div className="modal__backdrop" onClick={onClose}>
            <div className="modal__content" onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                    <div className="modal__header-info">
                        <span className="modal__league">{highlight.league}</span>
                        <h2 className="modal__title">{highlight.title}</h2>
                        <p className="modal__teams">{highlight.teams} &nbsp;|&nbsp; <strong>{highlight.score}</strong></p>
                    </div>
                    <button className="modal__close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal__video">
                    <iframe
                        src={`https://www.youtube.com/embed/${highlight.youtubeId}?autoplay=1&rel=0`}
                        title={highlight.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="modal__footer">
                    <span>{highlight.date}</span>
                    <span>👁 {highlight.views} views</span>
                    <span>⏱ {highlight.duration}</span>
                </div>
            </div>
        </div>
    )
}
