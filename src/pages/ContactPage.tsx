import { useState } from 'react'
import { Mail, MessageSquare, User, Building2, DollarSign, Send, CheckCircle, Instagram, Youtube, Phone } from 'lucide-react'
import './ContactPage.css'

const TikTokIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
)

const SnapchatIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.166 3C8.787 3 6.5 5.343 6.5 8.5v.7c-.4.1-.9.3-1.2.5-.5.3-.8.6-.8 1s.3.7.6.8c.1 0 .2.1.2.2-.1.3-.4.8-.8 1.3-.5.7-1 1.5-1 2.5 0 1.3.8 2.2 1.9 2.5l.1.4c.1.3.3.5.6.5.2 0 .4-.1.7-.2.4-.1.9-.3 1.5-.3.3 0 .7 0 1 .2.5.3 1 .9 1.9 1.4.5.3 1.1.4 1.7.4.6 0 1.2-.1 1.7-.4.9-.5 1.4-1.1 1.9-1.4.3-.2.7-.2 1-.2.6 0 1.1.2 1.5.3.3.1.5.2.7.2.3 0 .5-.2.6-.5l.1-.4c1.1-.3 1.9-1.2 1.9-2.5 0-1-.5-1.8-1-2.5-.4-.5-.7-1-.8-1.3 0-.1.1-.2.2-.2.3-.1.6-.4.6-.8s-.3-.7-.8-1c-.3-.2-.8-.4-1.2-.5v-.7C17.666 5.343 15.379 3 12 3z" />
    </svg>
)

const dealTypes = [
    'Brand Promotion',
    'Sponsored Post',
    'Ads Placement',
    'Story Feature',
    'Video Integration',
    'Other',
]

const reachStats = [
    { platform: 'Snapchat', icon: <SnapchatIcon />, followers: '140K+', color: '#FFD700' },
    { platform: 'TikTok', icon: <TikTokIcon />, followers: '28K+', color: '#69C9D0' },
    { platform: 'Instagram', icon: <Instagram size={20} />, followers: '12K+', color: '#E1306C' },
    { platform: 'YouTube', icon: <Youtube size={20} />, followers: '8K+', color: '#FF0000' },
]

export default function ContactPage() {
    const [form, setForm] = useState({
        name: '', company: '', email: '', phone: '', dealType: '', budget: '', message: '',
    })
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <div className="contact-page">
            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="contact-hero">
                <div className="contact-hero__glow" />
                <div className="container">
                    <div className="section-label">Partnership & Deals</div>
                    <h1 className="contact-hero__title">
                        Work With<br />
                        <span className="contact-hero__green">Sportfun.</span>
                    </h1>
                    <p className="contact-hero__sub">
                        Tap into a passionate football audience of <strong>180K+ followers</strong> across
                        platforms. Reach your audience where they already live — football content they love.
                    </p>
                </div>
            </section>

            {/* ── REACH STATS ─────────────────────────────────────── */}
            <section className="reach-section">
                <div className="container">
                    <div className="reach-grid">
                        {reachStats.map(stat => (
                            <div
                                key={stat.platform}
                                className="reach-card glass-card"
                                style={{ '--reach-color': stat.color } as React.CSSProperties}
                            >
                                <div className="reach-card__icon">{stat.icon}</div>
                                <div className="reach-card__info">
                                    <div className="reach-card__followers">{stat.followers}</div>
                                    <div className="reach-card__platform">{stat.platform}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="reach-perks">
                        <div className="perk">
                            <span className="perk__icon">⚡</span>
                            <div><strong>Fast Delivery</strong><p>Posts go live within 24 hours of approval</p></div>
                        </div>
                        <div className="perk">
                            <span className="perk__icon">🎯</span>
                            <div><strong>Targeted Reach</strong><p>Engaged football audience aged 16–34</p></div>
                        </div>
                        <div className="perk">
                            <span className="perk__icon">📊</span>
                            <div><strong>Analytics Shared</strong><p>Full post analytics report delivered after campaign</p></div>
                        </div>
                        <div className="perk">
                            <span className="perk__icon">🤝</span>
                            <div><strong>Flexible Deals</strong><p>One-off posts to long-term brand partnerships</p></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT ─────────────────────────────────────── */}
            <section className="contact-main">
                <div className="container contact-main__grid">

                    {/* Info Panel */}
                    <div className="contact-info">
                        <h2 className="contact-info__title">Get in Touch</h2>
                        <p className="contact-info__desc">
                            Interested in featuring your brand, product, or service to our passionate
                            football community? Fill out the form and we'll get back to you within 24 hours.
                        </p>

                        <div className="contact-info__channels">
                            <a href="mailto:hello@sportfun.com" className="contact-channel">
                                <div className="contact-channel__icon contact-channel__icon--mail">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <span className="contact-channel__label">Email Us</span>
                                    <span className="contact-channel__value">hello@sportfun.com</span>
                                </div>
                            </a>
                            <a href="https://snapchat.com" target="_blank" rel="noreferrer" className="contact-channel">
                                <div className="contact-channel__icon contact-channel__icon--snap">
                                    <SnapchatIcon />
                                </div>
                                <div>
                                    <span className="contact-channel__label">Snapchat DM</span>
                                    <span className="contact-channel__value">@sportfun</span>
                                </div>
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="contact-channel">
                                <div className="contact-channel__icon contact-channel__icon--ig">
                                    <Instagram size={20} />
                                </div>
                                <div>
                                    <span className="contact-channel__label">Instagram DM</span>
                                    <span className="contact-channel__value">@sportfun_ig</span>
                                </div>
                            </a>
                            <a href="tel:+234000000000" className="contact-channel">
                                <div className="contact-channel__icon contact-channel__icon--phone">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <span className="contact-channel__label">WhatsApp / Call</span>
                                    <span className="contact-channel__value">Available on request</span>
                                </div>
                            </a>
                        </div>

                        <div className="contact-info__note">
                            <span>⏱</span>
                            <p>Average response time: <strong>under 12 hours</strong></p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="contact-form-wrap glass-card">
                        {submitted ? (
                            <div className="contact-success">
                                <div className="contact-success__icon">
                                    <CheckCircle size={48} />
                                </div>
                                <h3>Message Sent! 🎉</h3>
                                <p>
                                    Thanks for reaching out. We'll review your enquiry and get back to you
                                    within 24 hours.
                                </p>
                                <button className="btn btn-outline" onClick={() => setSubmitted(false)}>
                                    Send Another
                                </button>
                            </div>
                        ) : (
                            <form className="contact-form" onSubmit={handleSubmit} noValidate>
                                <div className="contact-form__header">
                                    <h3>Partnership Enquiry</h3>
                                    <p>All fields marked * are required</p>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label htmlFor="name">
                                            <User size={14} /> Full Name *
                                        </label>
                                        <input
                                            id="name" name="name" type="text" required
                                            placeholder="Your name"
                                            value={form.name} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="company">
                                            <Building2 size={14} /> Company / Brand
                                        </label>
                                        <input
                                            id="company" name="company" type="text"
                                            placeholder="Brand or company (optional)"
                                            value={form.company} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label htmlFor="email">
                                            <Mail size={14} /> Email Address *
                                        </label>
                                        <input
                                            id="email" name="email" type="email" required
                                            placeholder="your@email.com"
                                            value={form.email} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="phone">
                                            <Phone size={14} /> Phone / WhatsApp
                                        </label>
                                        <input
                                            id="phone" name="phone" type="tel"
                                            placeholder="+234 000 0000 000"
                                            value={form.phone} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label htmlFor="dealType">
                                            <MessageSquare size={14} /> Deal Type *
                                        </label>
                                        <select
                                            id="dealType" name="dealType" required
                                            value={form.dealType} onChange={handleChange}
                                        >
                                            <option value="" disabled>Select deal type...</option>
                                            {dealTypes.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="budget">
                                            <DollarSign size={14} /> Budget Range
                                        </label>
                                        <select
                                            id="budget" name="budget"
                                            value={form.budget} onChange={handleChange}
                                        >
                                            <option value="" disabled>Select budget range...</option>
                                            <option>Under $100</option>
                                            <option>$100 – $500</option>
                                            <option>$500 – $1,000</option>
                                            <option>$1,000 – $5,000</option>
                                            <option>$5,000+</option>
                                            <option>Let's discuss</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="message">
                                        <MessageSquare size={14} /> Tell Us About Your Campaign *
                                    </label>
                                    <textarea
                                        id="message" name="message" required rows={5}
                                        placeholder="Describe your brand, what you'd like to promote, and any specific requirements..."
                                        value={form.message} onChange={handleChange}
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary contact-form__submit">
                                    <Send size={16} /> Send Enquiry
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </section>
        </div>
    )
}
