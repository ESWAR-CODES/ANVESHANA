import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';

export const EventHighlightsSection: React.FC = () => {
  // Temporary structural placeholders for Phase 4 foundation (replaced with API data in Phase 5)
  const upcomingEventsPlaceholder = [
    {
      id: '1',
      title: 'Anveshana Hackathon 2026',
      slug: 'anveshana-hackathon-2026',
      date: 'November 20, 2026',
      time: '09:00 AM IST',
      venue: 'Auditorium Block A, MBU Campus',
      status: 'open',
      shortDescription:
        'The flagship 24-hour national hackathon bridging School of Computing and School of Engineering students.',
    },
    {
      id: '2',
      title: 'Full Stack Systems & Cloud Workshop',
      slug: 'full-stack-systems-cloud-workshop',
      date: 'December 05, 2026',
      time: '02:00 PM IST',
      venue: 'Lab 304, Computing Complex',
      status: 'upcoming',
      shortDescription:
        'Hands-on workshop covering modern web architecture, distributed state, and cloud container orchestration.',
    },
    {
      id: '3',
      title: 'IoT & Embedded Hardware Sprint',
      slug: 'iot-embedded-hardware-sprint',
      date: 'December 18, 2026',
      time: '10:00 AM IST',
      venue: 'Engineering Workshop Center',
      status: 'upcoming',
      shortDescription:
        'Rapid prototyping sprint connecting microcontroller sensors with real-time web dashboards.',
    },
  ];

  return (
    <section className="py-20 bg-[#F3F4F6] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3 py-1 rounded-full">
              Explore Opportunities
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B132B] mt-3">
              Upcoming Events & Hackathons
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">
              Discover workshops, hackathons, and symposiums hosted on campus. Native registration opens prior to each event.
            </p>
          </div>

          <Link to="/events" className="shrink-0">
            <Button variant="outline" size="sm">
              View Full Event Catalog →
            </Button>
          </Link>
        </div>

        {/* 3-Column Event Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {upcomingEventsPlaceholder.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Event Card Header with Gradient Thumbnail Placeholder */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#253257] p-5 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between z-10">
                  <StatusBadge status={event.status} />
                  <span className="text-[11px] font-semibold text-gray-300 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    {event.date}
                  </span>
                </div>

                {/* Motif watermarking */}
                <div className="absolute right-4 -bottom-6 font-serif font-black text-6xl text-white/5 select-none pointer-events-none">
                  MBU
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#0B132B] group-hover:text-[#F5A623] transition-colors leading-snug mb-2">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                    {event.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.venue}
                  </span>

                  <Link
                    to="/events"
                    className="font-semibold text-[#0B132B] group-hover:text-[#F5A623] transition-colors inline-flex items-center gap-1"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
