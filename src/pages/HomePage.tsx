import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, ChevronRight, TrendingUp, Users, Film, Globe } from 'lucide-react'
import HighlightCard from '../components/HighlightCard'
import VideoModal from '../components/VideoModal'
import SocialBanner from '../components/SocialBanner'
import { highlights, type Highlight } from '../data/highlights'
import './HomePage.css'

const stats = [
    { icon: <Users size={20} />, value: '188K+', label: 'Total Followers' },
    { icon: <Film size={20} />, value: '200+', label: 'Clips Posted' },
    { icon: <TrendingUp size={20} />, value: '15M+', label: 'Total Views' },
    { icon: <Globe size={20} />, value: '4', label: 'Platforms' },
]

export default function HomePage() {
    const [activeVideo, setActiveVideo] = useState<Highlight | null>(null)

    const featured = highlights.find(h => h.featured)!
    const latest = highlights.filter(h => !h.featured).slice(0, 5)

    return (
        <div className="home">
            {/* ── HERO ─────────────────────────────────────────────────── */}
            <section className="hero">
                <div className="hero__bg">
                    <img src="/hero_banner.png" alt="Football stadium" className="hero__img" />
                    <div className="hero__overlay" />
                </div>

                <div className="container hero__content">
                    <div className="hero__badge">
                        <span className="live-dot" /> LIVE HIGHLIGHTS
                    </div>
                    <h1 className="hero__headline">
                        Feel Every<br />
                        <span className="hero__headline--green">Goal.</span>{' '}
                        Every<br />
                        <span className="hero__headline--outline">Moment.</span>
                    </h1>
                    <p className="hero__sub">
                        The best football highlight clips from UCL, Premier League, La Liga,
                        AFCON &amp; more — delivered daily.
                    </p>
                    <div className="hero__actions">
                        <Link to="/highlights" className="btn btn-primary hero__btn-primary">
                            <Play size={16} fill="currentColor" /> Watch Highlights
                        </Link>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="btn btn-outline">
                            Follow on IG
                        </a>
                    </div>

                    {/* Stat Pills */}
                    <div className="hero__stats">
                        {stats.map(s => (
                            <div key={s.label} className="hero__stat">
                                <span className="hero__stat-icon">{s.icon}</span>
                                <div>
                                    <div className="hero__stat-val">{s.value}</div>
                                    <div className="hero__stat-label">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hero__scroll-hint">
                    <div className="hero__scroll-line" />
                    <span>Scroll</span>
                </div>
            </section>

            {/* ── FEATURED ─────────────────────────────────────────────── */}
            <section className="section featured-section">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'left', marginBottom: 'var(--space-8)' }}>
                        <div className="section-label">Editor's Pick</div>
                        <h2 className="section-title" style={{ textAlign: 'left' }}>Featured Highlight</h2>
                    </div>
                    <div className="featured-grid">
                        <HighlightCard highlight={featured} onPlay={setActiveVideo} large />
                        <div className="featured-text">
                            <div className="badge badge-gold" style={{ marginBottom: 'var(--space-4)' }}>
                                🏆 Match of the Week
                            </div>
                            <h3 className="featured-text__title">{featured.title}</h3>
                            <p className="featured-text__teams">{featured.teams}</p>
                            <p className="featured-text__desc">
                                An absolute spectacle from {featured.date}. This is the kind of magic that
                                reminds you why football is the beautiful game. Don't miss a second.
                            </p>
                            <div className="featured-text__score">
                                Final Score: <strong>{featured.score}</strong>
                            </div>
                            <button className="btn btn-primary" onClick={() => setActiveVideo(featured)}>
                                <Play size={15} fill="currentColor" /> Watch Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── LATEST HIGHLIGHTS ───────────────────────────────────── */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">🔥 Fresh Drops</div>
                        <h2 className="section-title">Latest Highlights</h2>
                        <p className="section-subtitle">
                            Daily updated match clips from across the world's biggest leagues.
                        </p>
                    </div>

                    <div className="highlights-grid">
                        {latest.map(h => (
                            <HighlightCard key={h.id} highlight={h} onPlay={setActiveVideo} />
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
                        <Link to="/highlights" className="btn btn-outline">
                            View All Highlights <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── SOCIAL BANNER ────────────────────────────────────────── */}
            <SocialBanner />

            {/* ── VIDEO MODAL ──────────────────────────────────────────── */}
            <VideoModal highlight={activeVideo} onClose={() => setActiveVideo(null)} />
        </div>
    )
}
