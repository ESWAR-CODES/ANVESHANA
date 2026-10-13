import React, { useState } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';

export const EventsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const filterTabs = [
    { id: 'all', label: 'All Events' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ] as const;

  return (
    <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3 py-1 rounded-full">
          Event Index
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B132B] mt-4 mb-3">
          Explore Club Activities
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          From hands-on software workshops to national hackathons, explore upcoming schedules or review past completed milestones.
        </p>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-center mb-12">
        <div className="inline-flex p-1 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#0B132B] text-[#F5A623] font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-[#0B132B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Baseline Event Shell Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="aspect-video bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#253257] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <StatusBadge status="open" />
              <span className="text-xs text-gray-300">Nov 20, 2026</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">Auditorium Block A</div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0B132B] mb-2">
                Anveshana Hackathon 2026
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                24-hour national hackathon uniting Computing and Engineering students. Cash prizes, mentor sessions, and industry review.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Native Registration</span>
              <Button variant="primary" size="sm">
                View Details
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="aspect-video bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#253257] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <StatusBadge status="upcoming" />
              <span className="text-xs text-gray-300">Dec 05, 2026</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">Lab 304, Computing Complex</div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0B132B] mb-2">
                Full Stack Systems & Cloud Workshop
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Comprehensive training session on deploying containerized microservices and building high-performance APIs.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Opening Soon</span>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="aspect-video bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#253257] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <StatusBadge status="completed" />
              <span className="text-xs text-gray-300">Oct 02, 2026</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">Campus Amphitheater</div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0B132B] mb-2">
                Inaugural Code & Hardware Jam
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Semester launch event welcoming 200+ first-year students to collaborative university engineering projects.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Photo Gallery Available</span>
              <Button variant="ghost" size="sm">
                View Gallery
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
