import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import type { ClubSettings } from '../../types/settings';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [clubLogoError, setClubLogoError] = useState(false);
  const [univLogoError, setUnivLogoError] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    let isMounted = true;
    settingsService
      .getPublicSettings()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Navbar background logic: Transparent on top of homepage; solid navy on scroll or sub-pages
  const navBackgroundClass =
    isScrolled || !isHomePage
      ? 'bg-[#0B132B]/95 backdrop-blur-md border-b border-[#1C2541] shadow-md py-3'
      : 'bg-transparent border-b border-transparent py-4 sm:py-5';

  const defaultNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Team', path: '/team' },
    { name: 'Feedback', path: '/feedback' },
  ];

  const configuredLinks = settings?.navbar?.links?.filter((l) => l.isVisible !== false);
  const navLinks = configuredLinks && configuredLinks.length > 0 ? configuredLinks : defaultNavLinks;

  const ctaText = settings?.navbar?.ctaText || 'Explore Events';
  const ctaLink = settings?.navbar?.ctaLink || '/events';

  const clubLogo = settings?.logos?.clubLogo;
  const universityLogo = settings?.logos?.universityLogo;

  const clubName = settings?.clubName || 'Anveshana';
  const universityName = settings?.universityName || 'Mohan Babu University';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${navBackgroundClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between" aria-label="Main Navigation">
          {/* Brand Identity / Dual Logos */}
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F5A623] rounded-lg p-1"
            aria-label={`${clubName} Homepage`}
          >
            {/* University Logo if present */}
            {universityLogo?.url && !univLogoError ? (
              <img
                src={universityLogo.url}
                alt={universityLogo.alt || 'Mohan Babu University Logo'}
                onError={() => setUnivLogoError(true)}
                className="h-8 sm:h-9 w-auto max-w-[120px] object-contain rounded-sm"
              />
            ) : null}

            {/* Subtle vertical separator if university logo is shown */}
            {universityLogo?.url && !univLogoError && (
              <span className="hidden sm:inline-block w-px h-6 bg-white/20" />
            )}

            {/* Club Logo if present, otherwise stylized crest */}
            {clubLogo?.url && !clubLogoError ? (
              <img
                src={clubLogo.url}
                alt={clubLogo.alt || 'Anveshana Club Logo'}
                onError={() => setClubLogoError(true)}
                className="h-8 sm:h-9 w-auto max-w-[120px] object-contain rounded-sm"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1C2541] border border-[#F5A623]/40 text-[#F5A623] flex items-center justify-center font-serif font-bold text-base sm:text-lg shadow-inner group-hover:border-[#F5A623] transition-colors">
                A
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg font-bold tracking-wide text-[#F8FAFC] group-hover:text-[#F5A623] transition-colors leading-tight">
                {clubName}
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-gray-300">
                {universityName}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                    isActive
                      ? 'text-[#F5A623] bg-[#1C2541]/70 font-semibold shadow-xs'
                      : 'text-gray-200 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {/* Quick Action Button */}
            <Link
              to={ctaLink}
              className="ml-3 px-4 py-2 bg-[#F5A623] hover:bg-[#e0961b] active:bg-[#cc8715] text-[#0B132B] font-semibold text-xs tracking-wider uppercase rounded-lg shadow-sm transition-all hover:shadow focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F5A623]"
            >
              {ctaText}
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F5A623] cursor-pointer"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[56px] sm:top-[64px] z-40 bg-[#0B132B]/98 backdrop-blur-xl border-t border-[#1C2541] px-6 py-8 flex flex-col justify-between">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-base font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'bg-[#1C2541] text-[#F5A623] font-semibold border-l-4 border-[#F5A623]'
                      : 'text-gray-200 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          <div className="pt-6 border-t border-[#1C2541] space-y-4">
            <Link
              to={ctaLink}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full py-3 px-4 bg-[#F5A623] text-[#0B132B] font-semibold text-center rounded-xl shadow-sm text-sm"
            >
              {ctaText}
            </Link>
            <p className="text-center text-xs text-gray-400">
              {universityName} · {settings?.affiliatedSchools || 'School of Computing & Engineering'}
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
