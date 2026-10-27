import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import type { ClubSettings } from '../../types/settings';
import { sanitizeUrl } from '../../utils/url';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<ClubSettings | null>(null);

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
        // Fallback gracefully to default contact info
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const socialLinks = settings?.socialLinks;
  const clubLogo = settings?.logos?.clubLogo;
  const universityLogo = settings?.logos?.universityLogo;
  const clubName = settings?.clubName || 'Anveshana Club';
  const universityName = settings?.universityName || 'Mohan Babu University';
  const tagline = settings?.tagline || 'Explore · Build · Bring Ideas to Life.';
  const aboutText =
    settings?.footer?.aboutText ||
    settings?.mission ||
    'The premier central university club bridging students from the School of Computing and the School of Engineering. We foster hands-on engineering, collaborative hackathons, and technical innovation.';
  const campusLocation = settings?.campusLocation || 'Sree Sainath Nagar, Tirupati, Andhra Pradesh 517102';
  const affiliatedSchools = settings?.affiliatedSchools || 'School of Computing & School of Engineering';
  const contactEmail = settings?.contactEmail || 'anveshana@mbu.edu.in';
  const contactPhone = settings?.contactPhone || '+91 877 223 6711';
  const copyrightText =
    settings?.footer?.copyrightText ||
    `© ${new Date().getFullYear()} ${clubName} · ${universityName}. All rights reserved.`;

  return (
    <footer className="bg-[#0B132B] text-[#F8FAFC] border-t border-[#1C2541]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {universityLogo?.url ? (
                <img
                  src={universityLogo.url}
                  alt={universityLogo.alt || 'Mohan Babu University Logo'}
                  className="h-9 w-auto max-w-[120px] object-contain rounded-sm"
                />
              ) : null}

              {clubLogo?.url ? (
                <img
                  src={clubLogo.url}
                  alt={clubLogo.alt || 'Anveshana Club Logo'}
                  className="h-9 w-auto max-w-[120px] object-contain rounded-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1C2541] border border-[#F5A623]/40 text-[#F5A623] flex items-center justify-center font-serif font-bold text-xl">
                  A
                </div>
              )}

              <div>
                <span className="font-serif text-xl font-bold tracking-wide text-white">
                  {clubName}
                </span>
                <p className="text-xs uppercase tracking-widest text-[#F5A623]">
                  {universityName}
                </p>
              </div>
            </div>

            <p className="text-xs font-serif italic text-gray-300">
              "{tagline}"
            </p>

            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              {aboutText}
            </p>

            {/* Social Links if configured */}
            {socialLinks && (
              <div className="flex items-center gap-4 pt-2 text-gray-400">
                {socialLinks.instagram && (
                  <a
                    href={sanitizeUrl(socialLinks.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={sanitizeUrl(socialLinks.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.github && (
                  <a
                    href={sanitizeUrl(socialLinks.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={sanitizeUrl(socialLinks.twitter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter / X"
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={sanitizeUrl(socialLinks.youtube)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Events &amp; Hackathons
                </Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-white transition-colors">
                  Core Team Directory
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-white transition-colors">
                  Feedback &amp; Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
              Campus Information
            </h4>
            <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
              <p className="text-gray-400">
                <strong className="text-gray-200">Institution:</strong> {universityName}
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-200">Location:</strong> {campusLocation}
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-200">Email:</strong> {contactEmail}
              </p>
              {contactPhone && (
                <p className="text-gray-400">
                  <strong className="text-gray-200">Phone:</strong> {contactPhone}
                </p>
              )}
              <p className="text-gray-400">
                <strong className="text-gray-200">Affiliation:</strong> {affiliatedSchools}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#1C2541] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            {copyrightText}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/events" className="hover:text-gray-400 transition-colors">
              Upcoming Events
            </Link>
            <Link to="/feedback" className="hover:text-gray-400 transition-colors">
              Submit Feedback
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
