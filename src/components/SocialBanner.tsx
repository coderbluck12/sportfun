import { Instagram, Youtube, ExternalLink } from 'lucide-react'
import './SocialBanner.css'

const TikTokIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
)

const SnapchatIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.166 3C8.787 3 6.5 5.343 6.5 8.5v.7c-.4.1-.9.3-1.2.5-.5.3-.8.6-.8 1s.3.7.6.8c.1 0 .2.1.2.2-.1.3-.4.8-.8 1.3-.5.7-1 1.5-1 2.5 0 1.3.8 2.2 1.9 2.5l.1.4c.1.3.3.5.6.5.2 0 .4-.1.7-.2.4-.1.9-.3 1.5-.3.3 0 .7 0 1 .2.5.3 1 .9 1.9 1.4.5.3 1.1.4 1.7.4.6 0 1.2-.1 1.7-.4.9-.5 1.4-1.1 1.9-1.4.3-.2.7-.2 1-.2.6 0 1.1.2 1.5.3.3.1.5.2.7.2.3 0 .5-.2.6-.5l.1-.4c1.1-.3 1.9-1.2 1.9-2.5 0-1-.5-1.8-1-2.5-.4-.5-.7-1-.8-1.3 0-.1.1-.2.2-.2.3-.1.6-.4.6-.8s-.3-.7-.8-1c-.3-.2-.8-.4-1.2-.5v-.7C17.666 5.343 15.379 3 12 3z" />
    </svg>
)

const platforms = [
    {
        name: 'Instagram',
        handle: '@sportfun_ig',
        href: 'https://instagram.com',
        icon: <Instagram size={28} />,
        color: '#E1306C',
        gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
        followers: '12K',
    },
    {
        name: 'TikTok',
        handle: '@sportfun',
        href: 'https://tiktok.com',
        icon: <TikTokIcon />,
        color: '#69C9D0',
        gradient: 'linear-gradient(135deg, #010101, #69C9D0)',
        followers: '28K',
    },
    {
        name: 'Snapchat',
        handle: '@sportfun',
        href: 'https://snapchat.com',
        icon: <SnapchatIcon />,
        color: '#FFD700',
        gradient: 'linear-gradient(135deg, #444, #FFD700)',
        followers: '140K+',
    },
    {
        name: 'YouTube',
        handle: '@Sportfun',
        href: 'https://youtube.com',
        icon: <Youtube size={28} />,
        color: '#FF0000',
        gradient: 'linear-gradient(135deg, #1a1a1a, #FF0000)',
        followers: '8K',
    },
]

export default function SocialBanner() {
    return (
        <section className="social-banner">
            <div className="container">
                <div className="social-banner__header">
                    <div className="section-label">Join The Community</div>
                    <h2 className="section-title">Follow Sportfun Everywhere</h2>
                    <p className="section-subtitle">
                        Get the latest football highlights, behind-the-scenes content, and match reactions —
                        follow us on all platforms.
                    </p>
                </div>

                <div className="social-banner__grid">
                    {platforms.map(platform => (
                        <a
                            key={platform.name}
                            href={platform.href}
                            target="_blank"
                            rel="noreferrer"
                            className="social-card"
                            style={{ '--platform-color': platform.color, '--platform-gradient': platform.gradient } as React.CSSProperties}
                        >
                            <div className="social-card__glow" />
                            <div className="social-card__icon">{platform.icon}</div>
                            <div className="social-card__info">
                                <span className="social-card__name">{platform.name}</span>
                                <span className="social-card__handle">{platform.handle}</span>
                                <span className="social-card__followers">{platform.followers} Followers</span>
                            </div>
                            <ExternalLink size={16} className="social-card__arrow" />
                        </a>
                    ))}
                </div>
            </div>
        </section>
    )
}
