import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import type { ClubEvent } from '../../types/event';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { CardSkeleton } from '../common/Skeleton';

interface EventHighlightsSectionProps {
  settings?: any;
}

export const EventHighlightsSection: React.FC<EventHighlightsSectionProps> = ({ settings: propSettings }) => {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sectionData, setSectionData] = useState<any>(propSettings?.homeEventsSection || null);

  useEffect(() => {
    if (propSettings?.homeEventsSection) {
      setSectionData(propSettings.homeEventsSection);
    }
  }, [propSettings]);

  useEffect(() => {
    const loadHighlights = async () => {
      try {
        const res = await eventService.getPublicEvents({ limit: 3, status: 'upcoming' });
        if (res.success && res.data.length > 0) {
          setEvents(res.data);
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHighlights();
  }, []);

  const eyebrow = sectionData?.eyebrow || 'Explore Opportunities';
  const heading = sectionData?.heading || 'Upcoming Events & Hackathons';
  const description =
    sectionData?.description ||
    'Discover workshops, hackathons, and symposiums hosted on campus. Native registration opens prior to each event.';
  const ctaText = sectionData?.ctaText || 'View Full Event Catalog →';

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section className="py-20 bg-[#F3F4F6] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3 py-1 rounded-full">
              {eyebrow}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B132B] mt-3">
              {heading}
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">
              {description}
            </p>
          </div>

          <Link to="/events" className="shrink-0">
            <Button variant="outline" size="sm">
              {ctaText}
            </Button>
          </Link>
        </div>

        {/* Dynamic 3-Column Highlights Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-[#E2E8F0] text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#1C2541]/10 text-[#0B132B] mx-auto flex items-center justify-center font-serif text-xl font-bold">
              A
            </div>
            <h3 className="font-serif text-lg font-bold text-[#0B132B]">
              New Events Coming Soon
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our core team is preparing new workshops and hackathons for the upcoming semester. Check back shortly or browse the event catalog.
            </p>
            <div className="pt-2">
              <Link to="/events">
                <Button variant="primary" size="sm">
                  View Full Event Catalog
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {events.map((event) => {
              const computedStatus = event.computedStatus || 'upcoming';

              return (
                <div
                  key={event._id}
                  className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  {/* Card Header with Banner */}
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#253257] overflow-hidden">
                    {event.bannerMedia?.url ? (
                      <img
                        src={event.bannerMedia.url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif text-3xl font-bold text-[#F5A623]">
                        A
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#0B132B]/85 text-[#F5A623] border border-[#F5A623]/30 backdrop-blur-xs">
                        {event.category || 'Event'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <StatusBadge status={computedStatus} />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#0B132B] group-hover:text-[#F5A623] transition-colors leading-snug mb-2 line-clamp-2">
                        <Link to={`/events/${event.slug}`}>
                          {event.title}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(event.eventDate)} · {event.time}</span>
                      </div>
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
                        <span className="truncate">{event.venue}</span>
                      </span>

                      <Link
                        to={`/events/${event.slug}`}
                        className="font-semibold text-[#0B132B] group-hover:text-[#F5A623] transition-colors inline-flex items-center gap-1"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
