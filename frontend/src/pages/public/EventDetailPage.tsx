import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { galleryService } from '../../services/galleryService';
import type { ClubEvent } from '../../types/event';
import type { GalleryImage, EventGalleryData } from '../../types/gallery';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { RegistrationModal } from '../../components/events/RegistrationModal';
import type { FormFieldConfig } from '../../types/event';

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [formSchema, setFormSchema] = useState<FormFieldConfig[]>([]);
  const [formVersion, setFormVersion] = useState<number>(1);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryStory, setGalleryStory] = useState<EventGalleryData | null>(null);
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!slug) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [eventRes, formRes, galleryRes] = await Promise.allSettled([
          eventService.getPublicEventBySlug(slug),
          eventService.getEventForm(slug),
          galleryService.getPublicGallery(slug),
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

        if (galleryRes.status === 'fulfilled' && galleryRes.value.success && galleryRes.value.data) {
          setGalleryImages(galleryRes.value.data.images || []);
          setGalleryStory(galleryRes.value.data);
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
              formSchema.length > 0 ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setIsRegistrationModalOpen(true)}
                  className="font-bold shadow-md shadow-[#F5A623]/20"
                >
                  Register Now →
                </Button>
              ) : (
                <Button variant="secondary" size="lg" fullWidth disabled>
                  Registration Opening Soon
                </Button>
              )
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

          {/* Registration Section Card */}
          <div id="registration-section" className="pt-2">
            {isOpen ? (
              formSchema.length > 0 ? (
                <div className="bg-gradient-to-br from-[#0B132B] to-[#1C2541] text-white p-6 sm:p-8 rounded-2xl border border-[#F5A623]/30 shadow-lg relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider">
                        Registrations Open
                      </span>
                    </div>
                    <h4 className="font-serif text-xl sm:text-2xl font-bold text-white">
                      Ready to Participate?
                    </h4>
                    <p className="text-xs text-gray-300 max-w-lg leading-relaxed">
                      Seats are allocated on a first-come, first-served basis. Secure your spot now by completing the registration form.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsRegistrationModalOpen(true)}
                        className="font-bold text-[#0B132B] w-full sm:w-auto"
                      >
                        Register Now
                      </Button>
                      {event.maxParticipants && (
                        <span className="text-xs text-gray-300 font-mono">
                          {Math.max(0, event.maxParticipants - (event.registeredCount || 0))} spots remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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

      {/* Retrospective Event Story & Gallery (Rendered when event story or photos exist) */}
      {(galleryImages.length > 0 || galleryStory?.shortSummary || galleryStory?.fullStory || (galleryStory?.winners && galleryStory.winners.length > 0)) && (
        <section className="mt-16 pt-12 border-t border-[#E2E8F0] space-y-10">
          <div className="border-b border-gray-100 pb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623] bg-[#0B132B] px-3 py-1 rounded-full shadow-inner">
              Event Retrospective
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B132B] mt-3">
              {galleryStory?.title || `${event.title} Retrospective & Highlights`}
            </h2>
            {galleryStory?.eventDate && (
              <p className="text-xs text-[#F5A623] font-semibold mt-1">
                Concluded: {galleryStory.eventDate}
              </p>
            )}
            {galleryStory?.shortSummary && (
              <p className="text-sm text-gray-700 font-medium bg-[#FDFBF7] p-4 rounded-xl border border-[#E2E8F0] mt-4 leading-relaxed">
                {galleryStory.shortSummary}
              </p>
            )}
          </div>

          {/* Full Story Narrative if present */}
          {galleryStory?.fullStory && (
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-bold text-[#0B132B]">
                The Story Behind the Event
              </h3>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                {galleryStory.fullStory}
              </div>
            </div>
          )}

          {/* Challenges & Key Highlights Grid */}
          {(galleryStory?.challenges || (galleryStory?.highlights && galleryStory.highlights.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {galleryStory.challenges && (
                <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">⚡</span>
                    <h4 className="font-serif text-base font-bold text-[#0B132B]">
                      Challenges Tackled
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                    {galleryStory.challenges}
                  </p>
                </div>
              )}

              {galleryStory.highlights && galleryStory.highlights.length > 0 && (
                <div className="bg-[#0B132B] text-white p-6 rounded-2xl border border-[#F5A623]/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5A623] font-bold">★</span>
                    <h4 className="font-serif text-base font-bold text-white">
                      Key Highlights &amp; Milestones
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-300">
                    {galleryStory.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#F5A623] font-bold shrink-0">✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Winners & Standout Projects Podium */}
          {galleryStory?.winners && galleryStory.winners.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[#F5A623] text-lg">🏆</span>
                <h3 className="font-serif text-xl font-bold text-[#0B132B]">
                  Winners &amp; Standout Projects
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleryStory.winners.map((winner, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs space-y-1 hover:border-[#F5A623] transition-colors"
                  >
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-[#d98f16] border border-amber-200">
                      {winner.position}
                    </span>
                    <h5 className="font-serif font-bold text-base text-[#0B132B] pt-1">
                      {winner.name}
                    </h5>
                    {winner.project && (
                      <p className="text-xs text-gray-600 italic">
                        "{winner.project}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retrospective Photography Grid */}
          {galleryImages.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#0B132B]">
                    Retrospective Photography
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Moments and presentations captured during {event.title}.
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  {galleryImages.length} {galleryImages.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                  <div
                    key={img.publicId || idx}
                    onClick={() => setPreviewImage(img)}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.altText || img.caption || `${event.title} photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {img.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-white text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate font-medium">{img.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Gallery Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#0B132B] rounded-2xl overflow-hidden shadow-2xl border border-white/20 p-2 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center text-sm font-bold cursor-pointer"
              aria-label="Close photo preview"
            >
              ✕
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.altText || previewImage.caption || 'Event photo preview'}
              className="max-h-[75vh] w-auto object-contain rounded-lg"
            />
            {previewImage.caption && (
              <p className="text-white text-xs mt-3 px-4 py-1 text-center font-medium">
                {previewImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Registration Modal Dialog */}
      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        eventSlug={slug!}
        eventTitle={event.title}
        eventDate={event.eventDate}
        venue={event.venue}
        formSchema={formSchema}
        formVersion={formVersion}
        onSuccess={() => {
          setEvent((prev) =>
            prev ? { ...prev, registeredCount: (prev.registeredCount || 0) + 1 } : null
          );
        }}
      />
    </div>
  );
};
