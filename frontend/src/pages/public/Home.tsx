import React from 'react';
import { Hero } from '../../components/home/Hero';
import { MissionSection } from '../../components/home/MissionSection';
import { EventHighlightsSection } from '../../components/home/EventHighlightsSection';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* 1. Cinematic Campus Sunset Hero */}
      <Hero />

      {/* 2. Mission & Multi-Disciplinary Pillars */}
      <MissionSection />

      {/* 3. Event Highlights Carousel / Grid */}
      <EventHighlightsSection />

      {/* 4. Bottom Community CTA */}
      <section className="py-16 bg-[#0B132B] text-white border-t border-[#1C2541] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623]">
            Mohan Babu University Community
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to Build Your Next Breakthrough?
          </h2>
          <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            Whether you want to lead an engineering team, compete in a national hackathon, or provide event feedback, Anveshana is here for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/events">
              <Button variant="primary" size="md">
                Browse All Events
              </Button>
            </Link>
            <Link to="/feedback">
              <Button variant="secondary" size="md" className="border border-gray-600">
                Share Your Feedback
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#F5A623]/10 blur-3xl pointer-events-none"></div>
      </section>
    </div>
  );
};
