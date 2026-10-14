import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import type { ClubSettings } from '../../types/settings';

interface MissionSectionProps {
  settings?: ClubSettings | null;
}

export const MissionSection: React.FC<MissionSectionProps> = ({ settings: propSettings }) => {
  const [settings, setSettings] = useState<ClubSettings | null>(propSettings || null);

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

  const aboutData = settings?.about;
  const eyebrow = aboutData?.eyebrow || 'Our Central Mission';
  const heading = aboutData?.heading || 'Bridging Computing and Engineering.';
  const description =
    aboutData?.description ||
    'At Mohan Babu University, innovation does not happen in silos. Anveshana acts as the central catalyst connecting coders, makers, researchers, and designers across disciplines.';
  const subDescription =
    aboutData?.subDescription ||
    'Whether you are optimizing cloud infrastructure, soldering embedded sensors, or designing intuitive user experiences, Anveshana is your playground to explore ideas and bring them to life.';
  const calloutTitle = aboutData?.calloutTitle || 'Frictionless Student Access';
  const calloutText =
    aboutData?.calloutText ||
    'No accounts or login barriers required. Every student at MBU has immediate access to discover upcoming events, explore team leads, view hackathon galleries, and register natively.';

  const defaultPillars = [
    {
      title: 'Curiosity & Discovery',
      description:
        'Encouraging students to question conventional patterns, explore modern tech stacks, and investigate emerging challenges in computing.',
    },
    {
      title: 'Engineering Rigor',
      description:
        'Bridging high-level software architectures with low-level systems engineering, IoT, and embedded technologies from the School of Engineering.',
    },
    {
      title: 'Real-World Prototyping',
      description:
        'Moving beyond theoretical lectures into production code, tangible hardware prototypes, and deployed student-led applications.',
    },
    {
      title: 'Peer Collaboration',
      description:
        'A vibrant community of designers, backend engineers, systems architects, and project leads working together with zero hierarchy.',
    },
  ];

  const pillars = aboutData?.pillars && aboutData.pillars.length > 0 ? aboutData.pillars : defaultPillars;

  return (
    <section id="mission" className="py-20 lg:py-28 bg-[#FDFBF7] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Mission Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#1C2541] px-3 py-1 rounded-full">
              {eyebrow}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B132B] leading-tight">
              {heading}
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              {description}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {subDescription}
            </p>

            <div className="p-6 bg-white rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
              <h4 className="font-serif font-semibold text-[#0B132B] text-base">
                {calloutTitle}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {calloutText}
              </p>
            </div>
          </div>

          {/* Right Column: 4 Core Pillars Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#0B132B] flex items-center justify-center mb-4 shadow-inner text-[#F5A623]">
                    {idx === 0 && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    {idx === 1 && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {idx === 2 && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                    {idx >= 3 && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#0B132B] mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
