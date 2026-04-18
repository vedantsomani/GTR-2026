import React, { useState, useEffect } from 'react'

/**
 * Navbar — Glassmorphism navigation bar with mobile hamburger menu.
 * Links trigger overlay panels (FAQ, Rule Book) or external registration.
 */
export default function Navbar({ onOpenFAQ, onOpenRuleBook, scrollProgress = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Add background opacity when user has scrolled
  useEffect(() => {
    setScrolled(scrollProgress > 0.05)
  }, [scrollProgress])

  const handleNavClick = (action) => {
    setMobileOpen(false)
    action?.()
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} id="main-navbar">
        {/* Logo */}
        <div className="nav-brand" id="site-logo">
          <img src="/orange-logo.png" alt="GTR Logo" className="nav-brand-img" />
          <span className="nav-brand-gtr">GTR</span>
          <span className="nav-brand-year">2026</span>
        </div>

        {/* Desktop Links */}
        <div className="nav-links">
          <button
            className="nav-link"
            id="nav-faq"
            onClick={() => handleNavClick(onOpenFAQ)}
          >
            FAQ
          </button>
          <button
            className="nav-link"
            id="nav-rulebook"
            onClick={() => handleNavClick(onOpenRuleBook)}
          >
            Rule Book
          </button>
          <a
            className="nav-link nav-link-register"
            id="nav-register"
            href="https://unstop.com/o/1mBACUO?lb=PTE7q0Dz&utm_medium=Share&utm_source=ctazqbso53950&utm_campaign=Competitions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Register
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`nav-hamburger ${mobileOpen ? 'open' : ''}`}
          id="nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div className={`nav-drawer ${mobileOpen ? 'nav-drawer-open' : ''}`}>
        <div className="nav-drawer-backdrop" onClick={() => setMobileOpen(false)} />
        <div className="nav-drawer-panel">
          <button
            className="nav-drawer-link"
            onClick={() => handleNavClick(onOpenFAQ)}
          >
            <span className="nav-drawer-icon">❓</span>
            FAQ
          </button>
          <button
            className="nav-drawer-link"
            onClick={() => handleNavClick(onOpenRuleBook)}
          >
            <span className="nav-drawer-icon">📖</span>
            Rule Book
          </button>
          <a
            className="nav-drawer-link nav-drawer-register"
            href="https://unstop.com/o/1mBACUO?lb=PTE7q0Dz&utm_medium=Share&utm_source=ctazqbso53950&utm_campaign=Competitions"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
          >
            <span className="nav-drawer-icon">🏁</span>
            Register Now
          </a>
        </div>
      </div>
    </>
  )
}
