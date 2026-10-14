import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import type { ClubEvent, FormFieldConfig } from '../../types/event';
import { Button } from '../common/Button';
import { FormBuilderModal } from './FormBuilderModal';

export const RegistrationFormsSection: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'no_form' | 'closed'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Builder modal state
  const [selectedEventForBuilder, setSelectedEventForBuilder] = useState<ClubEvent | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Duplicate modal state
  const [duplicateTargetEvent, setDuplicateTargetEvent] = useState<ClubEvent | null>(null);
  const [sourceEventId, setSourceEventId] = useState<string>('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Remove form confirmation state
  const [removeTargetEvent, setRemoveTargetEvent] = useState<ClubEvent | null>(null);
  const [isRemovingForm, setIsRemovingForm] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await eventService.getAdminEvents({ limit: 50 });
      if (res.success) {
        setEvents(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to retrieve event registration forms.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Database service is currently unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenBuilder = (event: ClubEvent) => {
    setSelectedEventForBuilder(event);
    setIsBuilderOpen(true);
  };

  const handleDuplicateForm = async () => {
    if (!duplicateTargetEvent || !sourceEventId) return;

    const source = events.find((e) => e._id === sourceEventId);
    if (!source || !source.formSchema || source.formSchema.length === 0) {
      setErrorMessage('The selected source event does not contain any form questions.');
      return;
    }

    setIsDuplicating(true);
    try {
      // Clone schema with regenerated stable IDs
      const clonedSchema: FormFieldConfig[] = source.formSchema.map((field, idx) => ({
        ...field,
        id: `field_${Math.random().toString(36).substring(2, 9)}_${Date.now()}_${idx}`,
        order: idx,
      }));

      const res = await eventService.updateEventFormSchema(duplicateTargetEvent._id, clonedSchema, {
        formTitle: `${duplicateTargetEvent.title} Registration`,
        formDescription: source.formDescription || '',
      });

      if (res.success) {
        setActionNotice(
          `Successfully duplicated ${clonedSchema.length} questions from "${source.title}" into "${duplicateTargetEvent.title}".`
        );
        setDuplicateTargetEvent(null);
        setSourceEventId('');
        fetchEvents();
      } else {
        setErrorMessage(res.error || 'Failed to duplicate form questions.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to duplicate form questions.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleCloseRegistration = async (event: ClubEvent) => {
    try {
      const res = await eventService.closeEventRegistration(event._id);
      if (res.success) {
        setActionNotice(`Registration successfully closed for "${event.title}".`);
        fetchEvents();
      } else {
        setErrorMessage(res.error || 'Failed to close registration.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to close registration.');
    }
  };

  const handleReopenRegistration = async (event: ClubEvent) => {
    try {
      const res = await eventService.reopenEventRegistration(event._id);
      if (res.success) {
        setActionNotice(`Registration successfully reopened for "${event.title}".`);
        fetchEvents();
      } else {
        setErrorMessage(res.error || 'Failed to reopen registration.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to reopen registration.');
    }
  };

  const handleConfirmRemoveForm = async () => {
    if (!removeTargetEvent) return;
    setIsRemovingForm(true);
    try {
      const res = await eventService.removeEventForm(removeTargetEvent._id);
      if (res.success) {
        setActionNotice(res.message || `Form configuration removed for "${removeTargetEvent.title}".`);
        setRemoveTargetEvent(null);
        fetchEvents();
      } else {
        setErrorMessage(res.error || 'Failed to remove form configuration.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to remove form configuration.');
    } finally {
      setIsRemovingForm(false);
    }
  };

  // Helper to compute registration form status: 'no_form' | 'draft' | 'published' | 'closed'
  const computeEventFormStatus = (event: ClubEvent): 'no_form' | 'draft' | 'published' | 'closed' => {
    if (event.formStatus) return event.formStatus;
    if (event.status === 'closed' || event.status === 'archived' || event.isArchived) {
      if (event.formSchema && event.formSchema.length > 0) return 'closed';
    }
    const now = new Date();
    if (event.eventDate && new Date(event.eventDate) < now) {
      if (event.formSchema && event.formSchema.length > 0) return 'closed';
    }
    if (event.maxParticipants && event.registeredCount >= event.maxParticipants) {
      if (event.formSchema && event.formSchema.length > 0) return 'closed';
    }
    if (event.formSchema && event.formSchema.length > 0) {
      if (event.isPublished && event.status !== 'closed' && event.status !== 'draft') {
        return 'published';
      }
      return 'closed';
    }
    if (event.formDraft && event.formDraft.length > 0) {
      return 'draft';
    }
    return 'no_form';
  };

  // Metrics
  const totalEvents = events.length;
  const publishedCount = events.filter((e) => computeEventFormStatus(e) === 'published').length;
  const draftCount = events.filter((e) => computeEventFormStatus(e) === 'draft').length;
  const noFormCount = events.filter((e) => computeEventFormStatus(e) === 'no_form').length;
  const closedCount = events.filter((e) => computeEventFormStatus(e) === 'closed').length;
  const totalRegistrations = events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);

  // Filtered list
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const status = computeEventFormStatus(e);
    if (filterStatus === 'published') return status === 'published';
    if (filterStatus === 'draft') return status === 'draft';
    if (filterStatus === 'no_form') return status === 'no_form';
    if (filterStatus === 'closed') return status === 'closed';

    return true;
  });

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
    <div className="space-y-6 animate-fade-in">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0B132B] flex items-center gap-2.5">
            <svg className="w-6 h-6 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Registration Forms & Questionnaires
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Build student questionnaires, save working drafts, publish immutable versions, and monitor capacity.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchEvents} isLoading={isLoading}>
          ↻ Refresh List
        </Button>
      </div>

      {/* Action Notice & Error Alerts */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg text-xs text-emerald-800 flex items-center justify-between animate-fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs text-red-700 flex items-center justify-between animate-fade-in">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* 4 Form Status Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Total Events</p>
          <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{totalEvents}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{totalRegistrations} total submissions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Published Forms</p>
          <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{publishedCount}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Live student registration active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Drafts in Progress</p>
          <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{draftCount}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Unpublished working questionnaires</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">No Form Configured</p>
          <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{noFormCount}</p>
          <p className="text-[11px] text-rose-500 mt-0.5">Awaiting form creation</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search events by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: `All Events (${totalEvents})` },
            { id: 'published', label: `Published (${publishedCount})` },
            { id: 'draft', label: `Drafts (${draftCount})` },
            { id: 'no_form', label: `No Form (${noFormCount})` },
            { id: 'closed', label: `Closed (${closedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterStatus === tab.id
                  ? 'bg-[#0B132B] text-[#F5A623]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading registration forms...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-serif text-base font-semibold text-gray-700">No events matched your filter</p>
            <p className="text-xs text-gray-400">Try modifying your search or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F3F4F6] text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3.5 px-6">Event & Category</th>
                  <th className="py-3.5 px-4">Event Date</th>
                  <th className="py-3.5 px-4">Form Status</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Registrations</th>
                  <th className="py-3.5 px-6 text-right">Form Builder Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.map((event) => {
                  const formStatus = computeEventFormStatus(event);
                  const questionCount =
                    formStatus === 'draft' && event.formDraft
                      ? event.formDraft.length
                      : event.formSchema
                      ? event.formSchema.length
                      : 0;

                  return (
                    <tr key={event._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">
                        <p className="font-semibold text-[#0B132B] text-sm truncate max-w-xs">{event.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{event.category || 'General'}</p>
                      </td>

                      <td className="py-4 px-4 text-gray-600">
                        <p className="font-medium text-gray-800">{formatDate(event.eventDate)}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{event.venue}</p>
                      </td>

                      <td className="py-4 px-4">
                        {formStatus === 'published' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Published (v{event.formVersion || 1})
                          </span>
                        )}

                        {formStatus === 'draft' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Draft Saved
                          </span>
                        )}

                        {formStatus === 'closed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            Registration Closed
                          </span>
                        )}

                        {formStatus === 'no_form' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                            No Form
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono font-medium text-gray-700">
                        {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <span className="font-bold text-[#0B132B]">{event.registeredCount || 0}</span>
                        <span className="text-gray-400 text-[11px]">
                          {event.maxParticipants ? ` / ${event.maxParticipants}` : ' (Unlimited)'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        {formStatus === 'no_form' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenBuilder(event)}
                            className="bg-[#0B132B] hover:bg-[#F5A623] hover:text-[#0B132B] font-bold"
                          >
                            + Create Registration Form
                          </Button>
                        ) : formStatus === 'draft' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenBuilder(event)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                          >
                            Resume Draft
                          </Button>
                        ) : formStatus === 'published' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenBuilder(event)}
                          >
                            Edit Form (v{event.formVersion || 1})
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenBuilder(event)}
                          >
                            View / Edit Form
                          </Button>
                        )}

                        <button
                          onClick={() => {
                            setDuplicateTargetEvent(event);
                            setSourceEventId('');
                          }}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-[#F5A623] hover:text-[#0B132B] text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Duplicate form questions from another event"
                        >
                          Copy From...
                        </button>

                        {formStatus === 'published' && (
                          <button
                            onClick={() => handleCloseRegistration(event)}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Halt new student registrations for this event"
                          >
                            Close Registration
                          </button>
                        )}

                        {formStatus === 'closed' && (
                          <button
                            onClick={() => handleReopenRegistration(event)}
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Reactivate registration for this event"
                          >
                            Reopen Registration
                          </button>
                        )}

                        {formStatus !== 'no_form' && (
                          <button
                            onClick={() => setRemoveTargetEvent(event)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-500 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Remove form configuration (preserves past submissions)"
                          >
                            Remove Form
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Builder Modal */}
      {selectedEventForBuilder && (
        <FormBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setSelectedEventForBuilder(null);
          }}
          eventId={selectedEventForBuilder._id}
          eventTitle={selectedEventForBuilder.title}
          initialSchema={selectedEventForBuilder.formSchema || []}
          initialVersion={selectedEventForBuilder.formVersion || 1}
          initialTitle={selectedEventForBuilder.formTitle}
          initialDescription={selectedEventForBuilder.formDescription}
          initialDraft={selectedEventForBuilder.formDraft}
          initialDraftTitle={selectedEventForBuilder.formDraftTitle}
          initialDraftDescription={selectedEventForBuilder.formDraftDescription}
          registeredCount={selectedEventForBuilder.registeredCount || 0}
          maxParticipants={selectedEventForBuilder.maxParticipants}
          isRegistrationOpen={selectedEventForBuilder.isRegistrationOpen}
          onSaved={(newVersion) => {
            setActionNotice(
              `Registration form updated and published as Version ${newVersion} for "${selectedEventForBuilder.title}".`
            );
            fetchEvents();
          }}
        />
      )}

      {/* Duplicate Form Dialog */}
      {duplicateTargetEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 text-[#0B132B] flex items-center justify-center font-bold">
                ⧉
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#0B132B]">
                  Copy Form Structure
                </h3>
                <p className="text-xs text-gray-500">
                  Target: {duplicateTargetEvent.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Select an existing event that has configured registration questions to duplicate its schema. Stable field UUIDs will be automatically regenerated.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Choose Source Event
              </label>
              <select
                value={sourceEventId}
                onChange={(e) => setSourceEventId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              >
                <option value="">-- Select Event with Published Form --</option>
                {events
                  .filter((e) => e._id !== duplicateTargetEvent._id && e.formSchema && e.formSchema.length > 0)
                  .map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.title} ({e.formSchema?.length} questions, v{e.formVersion || 1})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDuplicateTargetEvent(null)}
                disabled={isDuplicating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDuplicateForm}
                isLoading={isDuplicating}
                disabled={!sourceEventId}
              >
                Duplicate Form
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Form Configuration Dialog */}
      {removeTargetEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">
                ⚠
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#0B132B]">
                  Remove Form Configuration
                </h3>
                <p className="text-xs text-gray-500">
                  Target Event: {removeTargetEvent.title}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold">Important Protection Notice:</p>
              <p>
                Removing this form configuration disables new student registrations.
                {removeTargetEvent.registeredCount > 0 ? (
                  <span className="font-semibold">
                    {' '}All {removeTargetEvent.registeredCount} existing participant submission records and version snapshots will remain safely preserved in the database.
                  </span>
                ) : (
                  ' No registrations exist yet for this event.'
                )}
              </p>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to remove the form configuration for this event?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoveTargetEvent(null)}
                disabled={isRemovingForm}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmRemoveForm}
                isLoading={isRemovingForm}
              >
                Confirm Remove Form
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
