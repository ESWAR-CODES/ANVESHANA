import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import type { ClubEvent } from '../../types/event';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { EventModal } from '../../components/admin/EventModal';
import { FormBuilderModal } from '../../components/admin/FormBuilderModal';
import { ParticipantModal } from '../../components/admin/ParticipantModal';
import { FeedbackModerationSection } from '../../components/admin/FeedbackModerationSection';
import { GalleryManagementSection } from '../../components/admin/GalleryManagementSection';
import { TeamManagementSection } from '../../components/admin/TeamManagementSection';
import { ClubSettingsSection } from '../../components/admin/ClubSettingsSection';

export const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation tab in Admin
  const [activeTab, setActiveTab] = useState<'events' | 'gallery' | 'team' | 'feedback' | 'settings'>('events');

  // Events management states
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form Builder modal state
  const [formBuilderEvent, setFormBuilderEvent] = useState<ClubEvent | null>(null);
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false);

  // Participant Management modal state
  const [participantEvent, setParticipantEvent] = useState<ClubEvent | null>(null);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<ClubEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await eventService.getAdminEvents({ limit: 50 });
      if (res.success) {
        setEvents(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to fetch events');
      }
    } catch (err: any) {
      const msg =
        err.response?.status === 503
          ? 'Database service is currently offline. Please configure MongoDB Atlas.'
          : err.response?.data?.error || 'Failed to connect to administrative events service.';
      setErrorMessage(msg);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const handleOpenCreateModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: ClubEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleOpenFormBuilder = (event: ClubEvent) => {
    setFormBuilderEvent(event);
    setIsFormBuilderOpen(true);
  };

  const handleOpenParticipants = (event: ClubEvent) => {
    setParticipantEvent(event);
    setIsParticipantModalOpen(true);
  };

  const handleTogglePublish = async (event: ClubEvent) => {
    try {
      await eventService.togglePublishEvent(event._id);
      setActionNotice(`Updated publication status for "${event.title}".`);
      fetchEvents();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to toggle publication status.');
    }
  };

  const handleArchive = async (event: ClubEvent) => {
    try {
      await eventService.archiveAdminEvent(event._id);
      setActionNotice(`Archived "${event.title}". It is now hidden from public listings.`);
      fetchEvents();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to archive event.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await eventService.deleteAdminEvent(deleteTarget._id);
      setActionNotice(res.data?.message || `Removed "${deleteTarget.title}".`);
      setDeleteTarget(null);
      fetchEvents();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => new Date(e.eventDate) >= new Date() && e.isPublished).length;
  const pastCount = events.filter((e) => new Date(e.eventDate) < new Date()).length;
  const draftsCount = events.filter((e) => !e.isPublished).length;

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
    <div className="min-h-screen bg-[#F3F4F6] flex">
      {/* 1. Left Dark Sidebar (per Overview reference) */}
      <aside className="w-64 bg-[#0B132B] text-white flex flex-col justify-between shrink-0 hidden md:flex border-r border-[#1C2541]">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-[#1C2541] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1C2541] border border-[#F5A623]/40 text-[#F5A623] flex items-center justify-center font-serif font-bold text-lg">
              A
            </div>
            <div>
              <h2 className="font-serif font-bold text-base tracking-wide text-white">
                ANVESHANA
              </h2>
              <p className="text-[10px] tracking-widest uppercase text-[#F5A623]">
                Admin Control
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="Admin Navigation">
            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'events'
                  ? 'bg-[#1C2541] text-[#F5A623] border border-[#F5A623]/30 shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Events Management</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'gallery'
                  ? 'bg-[#1C2541] text-[#F5A623] border border-[#F5A623]/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Event Gallery</span>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'team'
                  ? 'bg-[#1C2541] text-[#F5A623] border border-[#F5A623]/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Core Team</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'feedback'
                  ? 'bg-[#1C2541] text-[#F5A623] border border-[#F5A623]/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Feedback Review</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'settings'
                  ? 'bg-[#1C2541] text-[#F5A623] border border-[#F5A623]/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Club Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-[#1C2541] space-y-3">
          <div className="px-2">
            <p className="text-xs font-medium text-white truncate">{admin?.email}</p>
            <p className="text-[10px] text-[#F5A623] uppercase tracking-wider font-semibold">
              Role: {admin?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Dashboard Work Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div>
            <h1 className="font-serif text-lg font-bold text-[#0B132B]">
              Welcome, Administrator
            </h1>
            <p className="text-xs text-gray-500">
              Manage Mohan Babu University Anveshana Club content and activities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              + Create New Event
            </Button>
            <button
              onClick={handleLogout}
              className="md:hidden px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Body content */}
        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Notifications */}
          {actionNotice && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg text-xs text-emerald-800 flex items-center justify-between animate-fade-in">
              <span>{actionNotice}</span>
              <button onClick={() => setActionNotice(null)} className="font-bold cursor-pointer">✕</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border-l-4 border-[#EF4444] rounded-lg text-xs text-red-700 flex items-center justify-between animate-fade-in">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="font-bold cursor-pointer">✕</button>
            </div>
          )}

          {/* Events Management Tab */}
          {activeTab === 'events' && (
            <>
              {/* 4 Colored Metric Cards (per Overview reference image) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Total Events</p>
                  <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{totalEvents}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Upcoming Events</p>
                  <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{upcomingCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">Past Events</p>
                  <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{pastCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Drafts / Private</p>
                  <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{draftsCount}</p>
                </div>
              </div>

              {/* Events Data Table Section */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#0B132B]">
                      All Events & Workshops
                    </h2>
                    <p className="text-xs text-gray-500">
                      Manage publication lifecycle, dates, and banner visuals.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchEvents}>
                      ↻ Refresh
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                      + Add Event
                    </Button>
                  </div>
                </div>

                {/* Table Area */}
                {isLoading ? (
                  <div className="p-12 text-center text-xs text-gray-400">
                    Loading events from server...
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <p className="font-serif text-base font-semibold text-gray-700">No events found in database</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Click "+ Create New Event" to publish your first club event or workshop.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F3F4F6] text-gray-600 font-semibold border-b border-gray-200">
                          <th className="py-3.5 px-6">Event Title</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4">Date</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Registrations</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {events.map((event) => (
                          <tr key={event._id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-4 px-6 font-medium text-gray-900">
                              <div className="flex items-center gap-3">
                                {event.bannerMedia?.url ? (
                                  <img
                                    src={event.bannerMedia.url}
                                    alt=""
                                    className="w-10 h-8 rounded object-cover border border-gray-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-8 rounded bg-gray-200 text-gray-500 font-serif font-bold text-xs flex items-center justify-center shrink-0">
                                    A
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-[#0B132B] truncate max-w-xs">{event.title}</p>
                                  <p className="text-[11px] text-gray-400 truncate max-w-xs">{event.venue}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-gray-600">
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">
                                {event.category || 'General'}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-gray-600">
                              {formatDate(event.eventDate)}
                            </td>

                            <td className="py-4 px-4">
                              <StatusBadge status={event.isPublished ? 'open' : 'archived'} />
                            </td>

                            <td className="py-4 px-4 text-gray-600 font-mono">
                              {event.registeredCount || 0}
                              {event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
                            </td>

                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                onClick={() => handleOpenParticipants(event)}
                                className="px-2.5 py-1 bg-[#F5A623] hover:bg-[#d98f16] text-[#0B132B] rounded text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Participants ({event.registeredCount || 0})
                              </button>

                              <button
                                onClick={() => handleOpenFormBuilder(event)}
                                className="px-2.5 py-1 bg-[#0B132B] hover:bg-[#F5A623] hover:text-[#0B132B] text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Form Builder
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(event)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-[#F5A623] hover:text-[#0B132B] rounded text-gray-700 font-medium transition-colors cursor-pointer"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleTogglePublish(event)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium transition-colors cursor-pointer"
                              >
                                {event.isPublished ? 'Unpublish' : 'Publish'}
                              </button>

                              <button
                                onClick={() => handleArchive(event)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-amber-100 hover:text-amber-800 rounded text-gray-700 font-medium transition-colors cursor-pointer"
                              >
                                Archive
                              </button>

                              <button
                                onClick={() => setDeleteTarget(event)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-red-100 hover:text-red-700 rounded text-gray-700 font-medium transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Feedback Moderation Tab */}
          {activeTab === 'feedback' && <FeedbackModerationSection />}

          {/* Event Gallery Management Tab */}
          {activeTab === 'gallery' && <GalleryManagementSection />}

          {/* Core Team Management Tab */}
          {activeTab === 'team' && <TeamManagementSection />}

          {/* Club Settings Tab */}
          {activeTab === 'settings' && <ClubSettingsSection />}
        </main>
      </div>

      {/* Event Create / Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        event={selectedEvent}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setActionNotice('Event changes successfully saved to the database.');
          fetchEvents();
        }}
      />

      {/* Dynamic Form Builder Modal */}
      {formBuilderEvent && (
        <FormBuilderModal
          isOpen={isFormBuilderOpen}
          onClose={() => {
            setIsFormBuilderOpen(false);
            setFormBuilderEvent(null);
          }}
          eventId={formBuilderEvent._id}
          eventTitle={formBuilderEvent.title}
          initialSchema={formBuilderEvent.formSchema || []}
          initialVersion={formBuilderEvent.formVersion || 1}
          onSaved={(newVersion) => {
            setActionNotice(`Form schema updated to Version ${newVersion} for "${formBuilderEvent.title}".`);
            fetchEvents();
          }}
        />
      )}

      {/* Participant Management Modal */}
      {participantEvent && (
        <ParticipantModal
          isOpen={isParticipantModalOpen}
          onClose={() => {
            setIsParticipantModalOpen(false);
            setParticipantEvent(null);
          }}
          eventId={participantEvent._id}
          eventTitle={participantEvent.title}
        />
      )}

      {/* Delete / Soft-Archive Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#EF4444] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B132B]">
                Delete "{deleteTarget.title}"?
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                If this event contains existing student registrations, the system will automatically <strong>soft-archive</strong> it to prevent data loss. If no registrations exist, the event document and Cloudinary banner asset will be removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={confirmDelete} isLoading={isDeleting}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
