import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-[#0B132B] text-white pt-20 pb-16">
      {/* Cinematic Sunset Campus Backdrop (Gradient + Motifs) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Multilayered dusk / sunset gradient: deep navy to warm amber and dusk indigo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B132B] via-[#1C2541]/90 to-[#0B132B]"></div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#F5A623]/20 via-[#EF4444]/15 to-transparent blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#1C2541] via-[#F5A623]/10 to-transparent blur-2xl"></div>

        {/* Subtle Architectural & Circuit Grid Line Motifs */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#F5A623" strokeWidth="0.75" />
              <circle cx="0" cy="0" r="1.5" fill="#F5A623" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Ambient Dark Overlay to Guarantee Contrast */}
        <div className="absolute inset-0 bg-[#0B132B]/60 backdrop-brightness-90"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* University Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C2541]/90 border border-[#F5A623]/30 text-[#F5A623] text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm shadow-inner animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse"></span>
          Mohan Babu University · Tirupati
        </div>

        {/* Primary Serif Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#F8FAFC] leading-[1.08] mb-6 drop-shadow-md">
          ANVESHANA
        </h1>

        {/* Club Tagline */}
        <p className="font-serif italic text-lg sm:text-2xl md:text-3xl text-[#F5A623] font-normal mb-6 tracking-wide drop-shadow-sm max-w-3xl">
          Explore · Build · Bring Ideas to Life.
        </p>

        {/* Subtitle Bridging SoC and SoE */}
        <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          The premier central student club uniting the <span className="text-white font-medium">School of Computing</span> and the <span className="text-white font-medium">School of Engineering</span>. Fostering multidisciplinary hackathons, technological breakthroughs, and engineering leadership.
        </p>

        {/* Calls to Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link to="/events" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="text-[#0B132B] font-bold shadow-lg shadow-[#F5A623]/20"
              rightIcon={
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              }
            >
              Explore Events
            </Button>
          </Link>

          <Link to="/team" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              className="border border-gray-600 hover:border-gray-400 bg-[#1C2541]/80 backdrop-blur-sm text-gray-200"
            >
              Meet the Core Team
            </Button>
          </Link>
        </div>

        {/* Quick Attribute Pills */}
        <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center w-full max-w-3xl">
          <div>
            <p className="font-serif text-2xl font-bold text-[#F5A623]">2</p>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mt-0.5">Premier Schools</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-[#F5A623]">7</p>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mt-0.5">Core Wings</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-[#F5A623]">100%</p>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mt-0.5">Hands-On Practice</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-[#F5A623]">Open</p>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mt-0.5">Student Access</p>
          </div>
        </div>
      </div>
    </section>
  );
};
