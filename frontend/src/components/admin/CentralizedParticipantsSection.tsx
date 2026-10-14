import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { Button } from '../common/Button';
import type { ParticipantDetail } from '../../types/participant';

interface EventFilterOption {
  id: string;
  title: string;
  slug: string;
}

export const CentralizedParticipantsSection: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<EventFilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedFormVersion, setSelectedFormVersion] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [activeParticipant, setActiveParticipant] = useState<any | null>(null);
  const [detailData, setDetailData] = useState<ParticipantDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Export Loading States
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // Event Cleanup / Delete Participants State
  const [cleanupTargetEvent, setCleanupTargetEvent] = useState<EventFilterOption | null>(null);
  const [cleanupStep, setCleanupStep] = useState<1 | 2>(1);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const fetchParticipants = async (targetPage = page) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: any = {
        page: targetPage,
        limit: 15,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedEventId) params.eventId = selectedEventId;
      if (selectedFormVersion) params.formVersion = parseInt(selectedFormVersion, 10);
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await eventService.getAllParticipants(params);
      if (res.success && res.data) {
        setRegistrations(res.data.registrations || []);
        if (res.data.events) {
          setEventsList(res.data.events);
        }
        setTotalCount(res.data.pagination?.total || 0);
        setPage(res.data.pagination?.page || 1);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setErrorMessage(res.error || 'Failed to retrieve participants.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.status === 503
          ? 'Database service is currently unavailable.'
          : err.response?.data?.error || 'Failed to connect to participant records.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants(1);
  }, [selectedEventId, selectedFormVersion, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParticipants(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedEventId('');
    setSelectedFormVersion('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleOpenDetail = async (participant: any) => {
    setActiveParticipant(participant);
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const eventId =
        typeof participant.eventId === 'object' && participant.eventId?._id
          ? participant.eventId._id
          : participant.eventId;

      const res = await eventService.getRegistrationDetails(eventId, participant._id);
      if (res.success && res.data) {
        setDetailData(res.data);
      } else {
        setDetailError(res.error || 'Failed to load submitted answer details.');
      }
    } catch (err: any) {
      setDetailError(err.response?.data?.error || 'Failed to load details from server.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      if (format === 'csv') setIsExportingCsv(true);
      else setIsExportingXlsx(true);

      const blob = await eventService.exportAllParticipants(format, selectedEventId || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const eventName = selectedEventId
        ? (eventsList.find((e) => e.id === selectedEventId)?.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : 'all-events';
      a.download = `${eventName}-participants-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setActionNotice(`Successfully generated ${format.toUpperCase()} export report.`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || `Failed to generate ${format.toUpperCase()} export.`);
    } finally {
      setIsExportingCsv(false);
      setIsExportingXlsx(false);
    }
  };

  const handleConfirmCleanup = async () => {
    if (!cleanupTargetEvent) return;
    setIsCleaningUp(true);
    try {
      const res = await eventService.clearEventParticipants(cleanupTargetEvent.id);
      if (res.success) {
        setActionNotice(
          res.message || `Successfully cleared registrations for "${cleanupTargetEvent.title}".`
        );
        setCleanupTargetEvent(null);
        setCleanupStep(1);
        fetchParticipants(1);
      } else {
        setErrorMessage(res.error || 'Failed to clear event registrations.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to clear event registrations.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return '—';
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateInput);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg text-xs text-emerald-800 flex items-center justify-between animate-fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border-l-4 border-[#EF4444] rounded-lg text-xs text-red-700 flex items-center justify-between animate-fade-in">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B132B] text-[#F5A623] flex items-center justify-center font-bold text-lg">
              👥
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#0B132B]">
                Centralized Participant Management
              </h2>
              <p className="text-xs text-gray-500">
                Search, inspect, export, and manage student registrations across Mohan Babu University events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            isLoading={isExportingCsv}
            disabled={isExportingCsv || isExportingXlsx || totalCount === 0}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport('xlsx')}
            isLoading={isExportingXlsx}
            disabled={isExportingCsv || isExportingXlsx || totalCount === 0}
            className="bg-[#0B132B] hover:bg-[#1C2541] text-white"
          >
            Export Excel (.xlsx)
          </Button>

          {selectedEventId && (
            <button
              onClick={() => {
                const target = eventsList.find((e) => e.id === selectedEventId);
                if (target) {
                  setCleanupTargetEvent(target);
                  setCleanupStep(1);
                }
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Safely clear registrations for the selected event"
            >
              Clear Event Registrations
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search text */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Search Participant
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, email, student ID, ref #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>
          </div>

          {/* Event Filter */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Filter by Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            >
              <option value="">All Events & Workshops</option>
              {eventsList.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>

          {/* Form Version Filter */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Form Version
            </label>
            <select
              value={selectedFormVersion}
              onChange={(e) => setSelectedFormVersion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            >
              <option value="">All Versions</option>
              <option value="1">Version 1</option>
              <option value="2">Version 2</option>
              <option value="3">Version 3</option>
              <option value="4">Version 4+</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="md:col-span-3 flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 flex-wrap gap-2">
          <div>
            Showing <strong className="text-[#0B132B]">{registrations.length}</strong> of{' '}
            <strong className="text-[#0B132B]">{totalCount}</strong> total registration records
          </div>

          <div className="flex items-center gap-2">
            {(searchQuery || selectedEventId || selectedFormVersion || dateFrom || dateTo) && (
              <button
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-800 underline text-xs cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchParticipants(page)}>
              ↻ Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">
            Retrieving participant registrations from server...
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center font-bold text-xl">
              ∅
            </div>
            <p className="font-serif text-base font-semibold text-gray-700">
              No participant records found
            </p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery || selectedEventId
                ? 'Try clearing active filters to see all participants.'
                : 'Registrations will appear here when students register for events.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3.5 px-4 font-mono">Reference #</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Event Title</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-3 text-center">Version</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrations.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B132B]">
                      {p.referenceNumber || p._id}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {p.fullName || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                      {p.email || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-gray-700 font-mono">
                      {p.studentId || p.collegeId || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-gray-800 font-medium max-w-xs truncate">
                      {p.eventTitle || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      {formatDate(p.submittedAt || p.createdAt)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                        v{p.formVersion || 1}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        Confirmed
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="px-2.5 py-1.5 bg-[#0B132B] hover:bg-[#F5A623] hover:text-[#0B132B] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        View Answers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-[#F8FAFC] flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Page <strong className="text-gray-900">{page}</strong> of{' '}
              <strong className="text-gray-900">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchParticipants(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchParticipants(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Participant Detail / View Answers Modal */}
      {activeParticipant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between border-b border-[#1C2541]">
              <div>
                <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                  <span>Participant Details</span>
                  <span className="text-[#F5A623] font-mono text-xs">
                    #{activeParticipant.referenceNumber || activeParticipant._id}
                  </span>
                </h3>
                <p className="text-xs text-gray-300">
                  {activeParticipant.eventTitle}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveParticipant(null);
                  setDetailData(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {isDetailLoading ? (
                <div className="py-12 text-center text-gray-400">
                  Resolving submitted answers from schema snapshot...
                </div>
              ) : detailError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
                  {detailError}
                </div>
              ) : (
                <>
                  {/* Schema Info Badge */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-amber-900 text-xs">
                        Historical Schema Snapshot
                      </p>
                      <p className="text-[11px] text-amber-800">
                        Submitted against Form Version {detailData?.historicalFormVersion || activeParticipant.formVersion || 1}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded text-[10px]">
                      {detailData?.answers?.length || 0} Questions
                    </span>
                  </div>

                  {/* Core Participant Metadata */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Full Name</p>
                      <p className="font-semibold text-[#0B132B] text-sm">
                        {detailData?.fullName || activeParticipant.fullName || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Student ID / Roll No</p>
                      <p className="font-mono text-gray-800">
                        {detailData?.studentId || detailData?.collegeId || activeParticipant.studentId || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Email Address</p>
                      <p className="text-gray-700 font-mono text-[11px]">
                        {detailData?.email || activeParticipant.email || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Phone Number</p>
                      <p className="text-gray-700 font-mono">
                        {detailData?.phone || activeParticipant.phone || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Submission Timestamp</p>
                      <p className="text-gray-600">
                        {formatDate(activeParticipant.submittedAt || activeParticipant.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Registration Status</p>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">
                        Confirmed
                      </span>
                    </div>
                  </div>

                  {/* Form Responses List */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-serif font-bold text-[#0B132B] text-sm">
                      Form Responses ({detailData?.answers?.length || 0})
                    </h4>

                    {detailData?.answers && detailData.answers.length > 0 ? (
                      <div className="space-y-2">
                        {detailData.answers.map((ans, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-gray-200 rounded-xl space-y-1 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800 text-[11px]">
                                {ans.label || ans.fieldId}
                              </span>
                              {ans.type && (
                                <span className="px-1.5 py-0.2 bg-gray-100 text-gray-500 rounded text-[9px] uppercase font-mono">
                                  {ans.type}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-900 font-medium break-words text-xs pt-0.5">
                              {Array.isArray(ans.value) ? (
                                <span className="inline-flex flex-wrap gap-1">
                                  {ans.value.map((v, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[10px]"
                                    >
                                      {String(v)}
                                    </span>
                                  ))}
                                </span>
                              ) : typeof ans.value === 'boolean' ? (
                                <span className="font-semibold text-emerald-700">
                                  {ans.value ? 'Yes' : 'No'}
                                </span>
                              ) : (
                                <span>{String(ans.value || '—')}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic text-xs py-4 text-center">
                        No custom question responses recorded for this registration.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveParticipant(null);
                  setDetailData(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Safe Cleanup / Delete Participants Confirmation Modal */}
      {cleanupTargetEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">
                ⚠
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#0B132B]">
                  {cleanupStep === 1 ? 'Clear Event Registrations' : 'Final Destruction Confirmation'}
                </h3>
                <p className="text-xs text-gray-500">
                  Event: {cleanupTargetEvent.title}
                </p>
              </div>
            </div>

            {cleanupStep === 1 ? (
              <>
                <p className="text-xs text-gray-700 leading-relaxed">
                  You are preparing to delete all participant records for{' '}
                  <strong className="text-[#0B132B]">{cleanupTargetEvent.title}</strong>.
                </p>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold">Recommended Before Deletion:</p>
                  <p>
                    We strongly recommend downloading an Excel (.xlsx) or CSV export before proceeding so you have an offline archive.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('xlsx')}
                    className="flex-1"
                  >
                    Export Backup First
                  </Button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCleanupTargetEvent(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setCleanupStep(2)}
                  >
                    Proceed to Step 2 →
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                  <p className="font-bold">Irreversible Action Warning:</p>
                  <p>
                    All participant registrations for "{cleanupTargetEvent.title}" will be permanently removed. The event metadata and historical form snapshots will remain intact.
                  </p>
                </div>

                <p className="text-xs text-gray-600">
                  Confirm permanent removal of participant submissions?
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCleanupStep(1)}
                    disabled={isCleaningUp}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmCleanup}
                    isLoading={isCleaningUp}
                  >
                    Permanently Clear Records
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
