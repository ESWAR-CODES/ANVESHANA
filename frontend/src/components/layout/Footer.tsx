import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B132B] text-[#F8FAFC] border-t border-[#1C2541]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1C2541] border border-[#F5A623]/40 text-[#F5A623] flex items-center justify-center font-serif font-bold text-xl">
                A
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-wide text-white">
                  Anveshana Club
                </span>
                <p className="text-xs uppercase tracking-widest text-[#F5A623]">
                  Mohan Babu University
                </p>
              </div>
            </div>

            <p className="text-xs font-serif italic text-gray-300">
              "Explore · Build · Bring Ideas to Life."
            </p>

            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              The premier central university club bridging students from the School of Computing and the School of Engineering. We foster hands-on engineering, collaborative hackathons, and technical innovation.
            </p>
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
                  Events & Hackathons
                </Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-white transition-colors">
                  Core Team Directory
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-white transition-colors">
                  Feedback & Reviews
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
                <strong className="text-gray-200">Institution:</strong> Mohan Babu University (MBU)
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-200">Location:</strong> Sree Sainath Nagar, Tirupati, Andhra Pradesh 517102
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-200">Email:</strong> anveshana@mbu.edu.in
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-200">Affiliation:</strong> School of Computing & School of Engineering
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#1C2541] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} Anveshana Club · Mohan Babu University. All rights reserved.
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
