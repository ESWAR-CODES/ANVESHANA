import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { InteractiveParticleBackground } from '../common/InteractiveParticleBackground';

export const PublicLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#FDFBF7] text-[#0F172A] selection:bg-[#F5A623]/30 selection:text-[#0B132B]">
      {/* Dynamic Subtle Interactive Particle Backdrop */}
      <InteractiveParticleBackground />

      <Navbar />
      <main className="flex-1 relative z-10">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};
