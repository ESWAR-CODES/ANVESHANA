import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import type { ClubEvent } from '../../types/event';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { settingsService } from '../../services/settingsService';

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState({
    eyebrow: 'Events & Opportunities',
    title: 'Our Events',
    description:
      'Explore, Learn, Participate and Be a Part of Amazing Events bridging computing innovation and engineering leadership at Mohan Babu University.',
  });

  useEffect(() => {
    let isMounted = true;
    settingsService
      .getPublicSettings()
      .then((res) => {
        if (isMounted && res.success && res.data?.pagesContent?.events) {
          setPageContent({
            eyebrow: res.data.pagesContent.events.eyebrow || 'Events & Opportunities',
            title: res.data.pagesContent.events.title || 'Our Events',
            description:
              res.data.pagesContent.events.description ||
              'Explore, Learn, Participate and Be a Part of Amazing Events bridging computing innovation and engineering leadership at Mohan Babu University.',
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');

  const fetchEvents = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await eventService.getPublicEvents({
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchQuery.trim() || undefined,
        month: monthFilter || undefined,
        year: yearFilter || undefined,
        limit: 18,
      });

      if (res.success) {
        setEvents(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to fetch events.');
      }
    } catch (err: any) {
      const errorText =
        err.response?.status === 503
          ? 'Database service is currently offline. Please configure MongoDB Atlas in backend/.env.'
          : err.response?.data?.error || 'Unable to connect to the backend events service.';
      setErrorMessage(errorText);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, categoryFilter, monthFilter, yearFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

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

  const categories = ['Workshop', 'Hackathon', 'Tech Talk', 'Bootcamp', 'Competition'];
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const years = ['2025', '2026', '2027'];

  return (
    <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3.5 py-1 rounded-full shadow-inner">
          {pageContent.eyebrow}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B132B] mt-4 mb-3">
          {pageContent.title}
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          {pageContent.description}
        </p>
      </div>

      {/* Filter and Search Bar Controls (matching Website Overview reference) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm mb-10 space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-[#F3F4F6] rounded-xl border border-gray-200 w-full sm:w-auto">
            {(['all', 'upcoming', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer capitalize ${
                  statusFilter === tab
                    ? 'bg-[#0B132B] text-[#F5A623] shadow-xs'
                    : 'text-gray-600 hover:text-[#0B132B]'
                }`}
              >
                {tab === 'completed' ? 'Past Events' : tab}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-96">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event title, topic, or venue..."
                className="w-full pl-9 pr-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>
        </div>

        {/* Secondary Filters: Category, Month, Year */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
            Filter by:
          </span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
          >
            <option value="">Month</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {(categoryFilter !== 'all' || monthFilter || yearFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setMonthFilter('');
                setYearFilter('');
                setSearchQuery('');
              }}
              className="text-[11px] text-gray-500 hover:text-red-600 underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering: Loading, Error, Empty, or Data Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : errorMessage ? (
        <div className="bg-white p-10 rounded-2xl border border-red-200 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-[#EF4444] mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl font-bold text-[#0B132B]">
            Data Source Offline
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {errorMessage}
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={fetchEvents}>
              Retry Connection
            </Button>
          </div>
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No Events Found"
          description="There are currently no events matching your selected filter or search criteria."
          actionText="Show All Events"
          onAction={() => {
            setStatusFilter('all');
            setCategoryFilter('all');
            setMonthFilter('');
            setYearFilter('');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const computedStatus = event.computedStatus || 'upcoming';

            return (
              <div
                key={event._id}
                role="link"
                tabIndex={0}
                aria-label={`View details for ${event.title}`}
                onClick={() => navigate(`/events/${event.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/events/${event.slug}`);
                  }
                }}
                className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md hover:border-[#F5A623]/50 transition-all duration-200 flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              >
                {/* 16:9 Banner Image with Category Tag */}
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
                      {event.title}
                    </h3>

                    {/* Metadata Strip */}
                    <div className="space-y-1 mb-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(event.eventDate)} · {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                      {event.shortDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-400">
                      {event.registeredCount > 0 ? `${event.registeredCount} signed up` : 'Open'}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      className="font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.slug}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
