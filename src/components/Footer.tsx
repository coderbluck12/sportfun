import { Link } from 'react-router-dom'
import { Instagram, Youtube, Mail, ArrowUpRight } from 'lucide-react'
import './Footer.css'

const TikTokIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
)

const SnapchatIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.166 3C8.787 3 6.5 5.343 6.5 8.5v.7c-.4.1-.9.3-1.2.5-.5.3-.8.6-.8 1s.3.7.6.8c.1 0 .2.1.2.2-.1.3-.4.8-.8 1.3-.5.7-1 1.5-1 2.5 0 1.3.8 2.2 1.9 2.5l.1.4c.1.3.3.5.6.5.2 0 .4-.1.7-.2.4-.1.9-.3 1.5-.3.3 0 .7 0 1 .2.5.3 1 .9 1.9 1.4.5.3 1.1.4 1.7.4.6 0 1.2-.1 1.7-.4.9-.5 1.4-1.1 1.9-1.4.3-.2.7-.2 1-.2.6 0 1.1.2 1.5.3.3.1.5.2.7.2.3 0 .5-.2.6-.5l.1-.4c1.1-.3 1.9-1.2 1.9-2.5 0-1-.5-1.8-1-2.5-.4-.5-.7-1-.8-1.3 0-.1.1-.2.2-.2.3-.1.6-.4.6-.8s-.3-.7-.8-1c-.3-.2-.8-.4-1.2-.5v-.7C17.666 5.343 15.379 3 12 3z" />
    </svg>
)

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__glow" />
            <div className="container">
                <div className="footer__grid">
                    {/* Brand */}
                    <div className="footer__brand">
                        <Link to="/" className="footer__logo">
                            <span>SPORT</span><span className="footer__logo--green">FUN</span>
                        </Link>
                        <p className="footer__tagline">
                            Your #1 source for the best football highlight clips — goals, skills, drama &amp; pure magic.
                        </p>
                        <div className="footer__socials">
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer__social" title="Instagram"><Instagram size={18} /></a>
                            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="footer__social" title="TikTok"><TikTokIcon /></a>
                            <a href="https://snapchat.com" target="_blank" rel="noreferrer" className="footer__social footer__social--snap" title="Snapchat"><SnapchatIcon /></a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer__social footer__social--yt" title="YouTube"><Youtube size={18} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Quick Links</h4>
                        <ul className="footer__links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/highlights">Highlights</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact / Deals</Link></li>
                        </ul>
                    </div>

                    {/* Leagues */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Leagues</h4>
                        <ul className="footer__links">
                            <li><a href="#">UCL Champions League</a></li>
                            <li><a href="#">Premier League</a></li>
                            <li><a href="#">La Liga</a></li>
                            <li><a href="#">Bundesliga</a></li>
                            <li><a href="#">AFCON</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Stay Updated</h4>
                        <p className="footer__newsletter-text">Get the latest highlights in your inbox.</p>
                        <div className="footer__subscribe">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="footer__email-input"
                            />
                            <button className="footer__subscribe-btn">
                                <ArrowUpRight size={16} />
                            </button>
                        </div>
                        <div className="footer__contact">
                            <Mail size={14} />
                            <a href="mailto:hello@sportfun.com">hello@sportfun.com</a>
                        </div>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p className="footer__copy">© 2026 Sportfun. All rights reserved.</p>
                    <p className="footer__made">Made with ⚽ for the beautiful game</p>
                </div>
            </div>
        </footer>
    )
}
