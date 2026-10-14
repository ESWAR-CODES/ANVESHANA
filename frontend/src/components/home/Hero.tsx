import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { settingsService } from '../../services/settingsService';
import type { ClubSettings } from '../../types/settings';

interface HeroProps {
  settings?: ClubSettings | null;
}

export const Hero: React.FC<HeroProps> = ({ settings: propSettings }) => {
  const [settings, setSettings] = useState<ClubSettings | null>(propSettings || null);
  const [bgImageError, setBgImageError] = useState(false);

  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
      return;
    }

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
  }, [propSettings]);

  const heroData = settings?.hero;
  const statsList = settings?.stats && settings.stats.length > 0 ? settings.stats : [
    { value: '2', label: 'Premier Schools', description: 'Computing & Engineering' },
    { value: '7', label: 'Core Wings', description: 'Cross-functional operations' },
    { value: '100%', label: 'Hands-On Practice', description: 'Workshops & hackathons' },
    { value: 'Open', label: 'Student Access', description: 'Frictionless participation' },
  ];

  const eyebrowText = heroData?.eyebrow || 'Mohan Babu University · Tirupati';
  const headingText = heroData?.title || 'ANVESHANA';
  const taglineText = heroData?.tagline || 'Explore · Build · Bring Ideas to Life.';
  const descriptionText =
    heroData?.description ||
    'The premier central student club uniting the School of Computing and the School of Engineering. Fostering multidisciplinary hackathons, technological breakthroughs, and engineering leadership.';
  const primaryCtaText = heroData?.primaryCtaText || 'Explore Events';
  const primaryCtaLink = heroData?.primaryCtaLink || '/events';
  const secondaryCtaText = heroData?.secondaryCtaText || 'Meet the Core Team';
  const secondaryCtaLink = heroData?.secondaryCtaLink || '/team';

  return (
    <section className="relative overflow-hidden bg-[#0B132B] text-white pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
      {/* Hero Backdrop: Custom Admin Image OR Cinematic Sunset Gradient + Motifs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {heroData?.backgroundImage?.url && !bgImageError ? (
          <>
            {/* Custom Admin Hero Background Image */}
            <img
              src={heroData.backgroundImage.url}
              alt=""
              onError={() => setBgImageError(true)}
              className="w-full h-full object-cover object-center"
            />
            {/* Dark & warm contrast overlay ensuring all text, buttons, and stats are 100% legible */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B132B]/85 via-[#0B132B]/75 to-[#0B132B]/95" />
          </>
        ) : (
          <>
            {/* Multilayered dusk / sunset gradient: deep navy to warm amber and dusk indigo */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B132B] via-[#1C2541]/90 to-[#0B132B]" />
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#F5A623]/20 via-[#EF4444]/15 to-transparent blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#1C2541] via-[#F5A623]/10 to-transparent blur-2xl" />

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
            <div className="absolute inset-0 bg-[#0B132B]/60 backdrop-brightness-90" />
          </>
        )}
      </div>

      {/* Hero Content Container with Clear, Independent Document Flow */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* 1. Hero Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C2541]/90 border border-[#F5A623]/30 text-[#F5A623] text-xs font-semibold uppercase tracking-widest backdrop-blur-sm shadow-inner animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
          <span>{eyebrowText}</span>
        </div>

        {/* 2. Primary Serif Headline */}
        <h1 className="mt-6 font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#F8FAFC] leading-[1.08] drop-shadow-md">
          {headingText}
        </h1>

        {/* 3. Club Tagline */}
        <p className="mt-4 sm:mt-5 font-serif italic text-lg sm:text-2xl md:text-3xl text-[#F5A623] font-normal tracking-wide drop-shadow-sm max-w-3xl">
          {taglineText}
        </p>

        {/* 4. Subtitle Bridging SoC and SoE */}
        <p className="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
          {descriptionText}
        </p>

        {/* 5. Calls to Action Group (Adequately spaced, non-colliding) */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link to={primaryCtaLink} className="w-full sm:w-auto">
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
              {primaryCtaText}
            </Button>
          </Link>

          <Link to={secondaryCtaLink} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              className="border border-gray-600 hover:border-gray-400 bg-[#1C2541]/80 backdrop-blur-sm text-gray-200"
            >
              {secondaryCtaText}
            </Button>
          </Link>
        </div>

        {/* 6. Dedicated Statistics Row in its Own Clearly Separated Container */}
        <div className="mt-12 sm:mt-16 lg:mt-20 w-full max-w-4xl">
          <div className="bg-[#1C2541]/75 backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-7 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
              {statsList.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:border-[#F5A623]/30 transition-colors"
                >
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-[#F5A623] tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-200 mt-1">
                    {stat.label}
                  </p>
                  {stat.description && (
                    <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
                      {stat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
