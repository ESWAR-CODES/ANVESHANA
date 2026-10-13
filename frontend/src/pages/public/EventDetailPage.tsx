import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import type { ClubEvent } from '../../types/event';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { DynamicFormRenderer } from '../../components/events/DynamicFormRenderer';
import type { FormFieldConfig } from '../../types/event';

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [formSchema, setFormSchema] = useState<FormFieldConfig[]>([]);
  const [formVersion, setFormVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!slug) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [eventRes, formRes] = await Promise.allSettled([
          eventService.getPublicEventBySlug(slug),
          eventService.getEventForm(slug),
        ]);

        if (eventRes.status === 'fulfilled' && eventRes.value.success && eventRes.value.data) {
          setEvent(eventRes.value.data);
        } else {
          const err = eventRes.status === 'rejected' ? eventRes.reason : null;
          const msg =
            err?.response?.status === 503
              ? 'Database service is currently offline. Please configure MongoDB Atlas.'
              : err?.response?.data?.error || 'Event could not be found.';
          setErrorMessage(msg);
          setIsLoading(false);
          return;
        }

        if (formRes.status === 'fulfilled' && formRes.value.success && formRes.value.data) {
          setFormSchema(formRes.value.data.formSchema || []);
          setFormVersion(formRes.value.data.formVersion || 1);
        }
      } catch (err: any) {
        const msg =
          err.response?.status === 503
            ? 'Database service is currently offline. Please configure MongoDB Atlas.'
            : err.response?.data?.error || 'Unable to retrieve event information from the server.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [slug]);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Skeleton className="w-48 h-6 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Skeleton className="w-full aspect-[4/5] rounded-xl" />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-3/4 h-10" />
            <Skeleton className="w-full h-32 rounded-xl" />
            <Skeleton className="w-full h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="py-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <div className="bg-white p-10 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-100 text-[#EF4444] mx-auto flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#0B132B]">
            Event Unavailable
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            {errorMessage || 'The requested event is not currently available or has been unpublished.'}
          </p>
          <div className="pt-2">
            <Link to="/events">
              <Button variant="primary" size="sm">
                ← Back to Event Catalog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const computedStatus = event.computedStatus || 'upcoming';
  const isOpen = computedStatus === 'open';
  const isFull = computedStatus === 'full';

  const scrollToRegister = () => {
    const el = document.getElementById('registration-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[#0B132B] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/events" className="hover:text-[#0B132B] transition-colors">
          Events
        </Link>
        <span>/</span>
        <span className="text-[#0B132B] font-semibold truncate max-w-xs sm:max-w-md">
          {event.title}
        </span>
      </nav>

      {/* Main 2-Column Event Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Event Poster / Banner */}
        <div className="lg:col-span-5">
          <div className="relative aspect-[3/4] sm:aspect-video lg:aspect-[4/5] bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#253257] rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-md flex items-center justify-center">
            {event.bannerMedia?.url && !imageError ? (
              <img
                src={event.bannerMedia.url}
                alt={event.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#1C2541] border-2 border-[#F5A623] text-[#F5A623] font-serif font-bold text-3xl flex items-center justify-center shadow-inner">
                  A
                </div>
                <div>
                  <p className="font-serif text-xl font-bold text-white tracking-wide">
                    {event.title}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#F5A623] mt-1">
                    Mohan Babu University
                  </p>
                </div>
              </div>
            )}

            {/* Category Tag Overlay */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#0B132B]/80 text-[#F5A623] border border-[#F5A623]/30 backdrop-blur-xs shadow-sm">
                {event.category || 'Event'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata, Description & Registration */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <StatusBadge status={computedStatus} />
              {event.maxParticipants && (
                <span className="text-xs text-gray-500 font-medium">
                  {event.registeredCount} / {event.maxParticipants} Registered
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B132B] leading-tight">
              {event.title}
            </h1>
          </div>

          {/* Quick Schedule & Location Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1C2541]/10 text-[#0B132B] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</p>
                <p className="text-xs font-bold text-[#0B132B] mt-0.5">{formatDate(event.eventDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1C2541]/10 text-[#0B132B] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Time</p>
                <p className="text-xs font-bold text-[#0B132B] mt-0.5">{event.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1C2541]/10 text-[#0B132B] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Venue</p>
                <p className="text-xs font-bold text-[#0B132B] mt-0.5">{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Registration CTA Action */}
          <div className="space-y-3">
            {isOpen ? (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={scrollToRegister}
                className="font-bold shadow-md shadow-[#F5A623]/20"
              >
                Register for Event ↓
              </Button>
            ) : isFull ? (
              <Button variant="secondary" size="lg" fullWidth disabled>
                Event Capacity Full
              </Button>
            ) : computedStatus === 'upcoming' ? (
              <Button variant="secondary" size="lg" fullWidth disabled>
                Registrations Opening Soon
              </Button>
            ) : (
              <Button variant="secondary" size="lg" fullWidth disabled>
                Registrations Closed
              </Button>
            )}
          </div>

          {/* Rich Description */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#0B132B]">
              About the Event
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
              <p className="text-sm font-medium text-gray-800 bg-[#F3F4F6] p-4 rounded-xl border border-[#E2E8F0]">
                {event.shortDescription}
              </p>
              <div
                className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: event.fullDescription }}
              />
            </div>
          </div>

          {/* Eligibility Card */}
          <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#E2E8F0]">
            <h4 className="font-serif text-lg font-bold text-[#0B132B] mb-2">
              Eligibility & Guidelines
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {event.eligibility || 'Open for all Mohan Babu University (School of Computing & School of Engineering) students. Please carry your university identification.'}
            </p>
          </div>

          {/* Native Dynamic Registration Section */}
          <div id="registration-section" className="pt-4 scroll-mt-28">
            {isOpen ? (
              formSchema.length > 0 ? (
                <DynamicFormRenderer
                  identifier={slug!}
                  eventTitle={event.title}
                  formSchema={formSchema}
                  formVersion={formVersion}
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-2">
                  <p className="font-serif text-lg font-bold text-[#0B132B]">Registration Opening Shortly</p>
                  <p className="text-xs text-gray-500">The registration questions are currently being configured by the club coordinators.</p>
                </div>
              )
            ) : (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center space-y-2">
                <p className="font-serif text-base font-bold text-[#0B132B]">
                  {isFull ? 'Event Reached Full Capacity' : computedStatus === 'upcoming' ? 'Registration Opens Soon' : 'Registration Closed'}
                </p>
                <p className="text-xs text-gray-500">
                  {isFull
                    ? 'All seats for this event have been reserved.'
                    : computedStatus === 'upcoming'
                    ? 'Check back once the registration window opens.'
                    : 'Registrations for this event have concluded.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
