import { Instagram, Youtube, Globe, Zap, Target, Heart } from 'lucide-react'
import SocialBanner from '../components/SocialBanner'
import './AboutPage.css'

const TikTokIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
)

const milestones = [
    { year: '2022', title: 'Sportfun is Born', desc: 'Started posting football highlights on Snapchat with a passion for the beautiful game.', icon: '⚽' },
    { year: '2023', title: '5K Followers', desc: 'Hit our first 5,000 followers milestone on Snapchat with viral highlight clips.', icon: '🚀' },
    { year: '2024', title: 'Expanding Reach', desc: 'Launched on YouTube and began building a catalog of 200+ premium highlight clips.', icon: '📺' },
    { year: '2025', title: 'Going Viral', desc: 'A Mbappe clip went viral with over 2M views in 48 hours. The brand takes off.', icon: '🔥' },
    { year: '2026', title: 'IG & TikTok Launch', desc: 'Official expansion to Instagram and TikTok. New website. New era for Sportfun.', icon: '🌍' },
]

const values = [
    {
        icon: <Zap size={24} />,
        title: 'Speed',
        desc: 'We post highlights within hours of the final whistle. You\'re always first.',
    },
    {
        icon: <Target size={24} />,
        title: 'Quality',
        desc: 'Only the best moments make the cut. No filler, just pure football magic.',
    },
    {
        icon: <Heart size={24} />,
        title: 'Passion',
        desc: 'Built by fans, for fans. We live and breathe football every single day.',
    },
    {
        icon: <Globe size={24} />,
        title: 'Global',
        desc: 'UCL, EPL, La Liga, AFCON — we cover the beautiful game worldwide.',
    },
]

export default function AboutPage() {
    return (
        <div className="about">
            {/* Hero */}
            <section className="about-hero">
                <div className="about-hero__glow" />
                <div className="container about-hero__content">
                    <div className="section-label">Our Story</div>
                    <h1 className="about-hero__title">
                        We Are<br />
                        <span className="about-hero__title--green">Sportfun.</span>
                    </h1>
                    <p className="about-hero__desc">
                        A community-first football highlight brand born out of pure love for the game.
                        From Snapchat roots to a full multi-platform media presence — we're just getting started.
                    </p>
                </div>
            </section>

            {/* Mission & Values */}
            <section className="about-values">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">What Drives Us</div>
                        <h2 className="section-title">Our Core Values</h2>
                        <div className="divider" />
                    </div>
                    <div className="values-grid">
                        {values.map(v => (
                            <div key={v.title} className="value-card glass-card">
                                <div className="value-card__icon">{v.icon}</div>
                                <h3 className="value-card__title">{v.title}</h3>
                                <p className="value-card__desc">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="about-timeline">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Our Journey</div>
                        <h2 className="section-title">The Sportfun Story</h2>
                        <div className="divider" />
                    </div>
                    <div className="timeline">
                        {milestones.map((m, i) => (
                            <div key={m.year} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                                <div className="timeline-item__content glass-card">
                                    <div className="timeline-item__emoji">{m.icon}</div>
                                    <div className="timeline-item__year">{m.year}</div>
                                    <h3 className="timeline-item__title">{m.title}</h3>
                                    <p className="timeline-item__desc">{m.desc}</p>
                                </div>
                                <div className="timeline-item__dot" />
                            </div>
                        ))}
                        <div className="timeline__line" />
                    </div>
                </div>
            </section>

            {/* Connect Section */}
            <section className="about-connect">
                <div className="container about-connect__inner">
                    <div className="section-header" style={{ marginBottom: 0 }}>
                        <div className="section-label">Connect With Us</div>
                        <h2 className="section-title">Find Sportfun</h2>
                        <p className="section-subtitle">
                            We're everywhere you are. Drop a follow and join 53K+ football fans.
                        </p>
                    </div>
                    <div className="connect-links">
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="connect-link connect-link--ig">
                            <Instagram size={22} />
                            <div>
                                <span className="connect-link__platform">Instagram</span>
                                <span className="connect-link__handle">@sportfun_ig</span>
                            </div>
                        </a>
                        <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="connect-link connect-link--tt">
                            <TikTokIcon />
                            <div>
                                <span className="connect-link__platform">TikTok</span>
                                <span className="connect-link__handle">@sportfun</span>
                            </div>
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="connect-link connect-link--yt">
                            <Youtube size={22} />
                            <div>
                                <span className="connect-link__platform">YouTube</span>
                                <span className="connect-link__handle">@Sportfun</span>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            <SocialBanner />
        </div>
    )
}
