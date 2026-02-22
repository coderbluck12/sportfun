import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Instagram, Youtube } from 'lucide-react'
import './Navbar.css'

// TikTok icon (lucide doesn't have one, so SVG inline)
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

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const toggleMenu = () => setMenuOpen(prev => !prev)
    const closeMenu = () => setMenuOpen(false)

    return (
        <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="container navbar__inner">

                {/* Logo */}
                <Link to="/" className="navbar__logo" onClick={closeMenu}>
                    <span className="navbar__logo-sport">SPORT</span>
                    <span className="navbar__logo-fun">FUN</span>
                    <span className="navbar__logo-dot"></span>
                </Link>

                {/* Desktop Nav Links */}
                <nav className="navbar__links">
                    <NavLink to="/" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`} end>
                        Home
                    </NavLink>
                    <NavLink to="/highlights" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
                        Highlights
                    </NavLink>
                    <NavLink to="/live" className={({ isActive }) => `navbar__link navbar__link--live ${isActive ? 'active' : ''}`}>
                        🔴 Live
                    </NavLink>
                    <NavLink to="/about" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
                        About
                    </NavLink>
                    <NavLink to="/contact" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>
                        Contact
                    </NavLink>
                </nav>

                {/* Social Icons */}
                <div className="navbar__socials">
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="navbar__social-icon" title="Instagram">
                        <Instagram size={18} />
                    </a>
                    <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="navbar__social-icon" title="TikTok">
                        <TikTokIcon />
                    </a>
                    <a href="https://snapchat.com" target="_blank" rel="noreferrer" className="navbar__social-icon navbar__social-icon--snap" title="Snapchat">
                        <SnapchatIcon />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noreferrer" className="navbar__social-icon navbar__social-icon--yt" title="YouTube">
                        <Youtube size={18} />
                    </a>
                    <Link to="/live" className="btn btn-primary navbar__cta">
                        🔴 Watch Live
                    </Link>
                </div>

                {/* Hamburger */}
                <button className="navbar__hamburger" onClick={toggleMenu} aria-label="Toggle menu">
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`navbar__mobile ${menuOpen ? 'open' : ''}`}>
                <NavLink to="/" onClick={closeMenu} className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`} end>Home</NavLink>
                <NavLink to="/highlights" onClick={closeMenu} className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}>Highlights</NavLink>
                <NavLink to="/live" onClick={closeMenu} className={({ isActive }) => `navbar__mobile-link navbar__mobile-link--live ${isActive ? 'active' : ''}`}>🔴 Live</NavLink>
                <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}>About</NavLink>
                <NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}>Contact</NavLink>
                <div className="navbar__mobile-socials">
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="navbar__social-icon"><Instagram size={20} /></a>
                    <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="navbar__social-icon"><TikTokIcon /></a>
                    <a href="https://snapchat.com" target="_blank" rel="noreferrer" className="navbar__social-icon navbar__social-icon--snap"><SnapchatIcon /></a>
                    <a href="https://youtube.com" target="_blank" rel="noreferrer" className="navbar__social-icon navbar__social-icon--yt"><Youtube size={20} /></a>
                </div>
                <Link to="/live" className="btn btn-primary" onClick={closeMenu} style={{ width: '100%', justifyContent: 'center' }}>
                    🔴 Watch Live
                </Link>
            </div>
        </header>
    )
}
