import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import type { ParticipantSummary, ParticipantDetail } from '../../types/participant';
import { Button } from '../common/Button';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}) => {
  const [registrations, setRegistrations] = useState<ParticipantSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formVersions, setFormVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected participant for detail view
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ParticipantDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Export loading states
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const fetchRegistrations = async (targetPage = page) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: any = {
        page: targetPage,
        limit: 15,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedVersion) {
        params.formVersion = parseInt(selectedVersion, 10);
      }

      const res = await eventService.getEventRegistrations(eventId, params);
      if (res.success && res.data) {
        setRegistrations(res.data.registrations || []);
        setTotalCount(res.data.pagination?.total || 0);
        setPage(res.data.pagination?.page || 1);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setFormVersions(res.data.formVersions || []);
      } else {
        setErrorMessage(res.error || 'Failed to fetch participant records.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.status === 503
          ? 'Database service is currently unavailable.'
          : err.response?.data?.error || 'Failed to fetch participants.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      setPage(1);
      fetchRegistrations(1);
    } else {
      setActiveParticipantId(null);
      setDetailData(null);
    }
  }, [isOpen, eventId, selectedVersion]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRegistrations(1);
  };

  const handleOpenDetail = async (participantId: string) => {
    setActiveParticipantId(participantId);
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const res = await eventService.getRegistrationDetails(eventId, participantId);
      if (res.success && res.data) {
        setDetailData(res.data);
      } else {
        setDetailError(res.error || 'Failed to load participant registration details.');
      }
    } catch (err: any) {
      setDetailError(err.response?.data?.error || 'Failed to load details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      if (format === 'csv') setIsExportingCsv(true);
      else setIsExportingXlsx(true);

      const blob = await eventService.exportEventRegistrations(eventId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = `${sanitizedTitle}-participants-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || `Failed to export ${format.toUpperCase()} report.`);
    } finally {
      setIsExportingCsv(false);
      setIsExportingXlsx(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between border-b border-[#1C2541]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#F5A623] text-[#0B132B] text-[10px] font-bold uppercase tracking-wider rounded">
                Participants
              </span>
              <h2 className="font-serif text-lg font-bold text-white truncate max-w-xl">
                {eventTitle}
              </h2>
            </div>
            <p className="text-xs text-gray-300">
              {totalCount} total participant{totalCount === 1 ? '' : 's'} registered. Historical form schema mapping enabled.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={isExportingCsv || totalCount === 0}
              className="px-3 py-1.5 bg-white/10 hover:bg-[#F5A623] hover:text-[#0B132B] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => handleExport('xlsx')}
              disabled={isExportingXlsx || totalCount === 0}
              className="px-3 py-1.5 bg-[#107C41] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isExportingXlsx ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by name, email, college ID, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#F5A623] focus:border-transparent outline-none"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-2.5 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <label htmlFor="formVersionFilter" className="font-medium">
                Version Filter:
              </label>
              <select
                id="formVersionFilter"
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-[#F5A623] outline-none"
              >
                <option value="">All Form Versions</option>
                {formVersions.map((v) => (
                  <option key={v} value={v}>
                    Version {v}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedVersion('');
                fetchRegistrations(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Feedback message */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Main Table */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-gray-500">
                Loading participants...
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="font-serif text-sm font-semibold text-gray-700">No participants registered yet</p>
                <p className="text-xs text-gray-500">
                  When students submit the registration form, their records will appear here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 sticky top-0 z-10">
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-3">College ID</th>
                    <th className="py-3 px-3">Form V#</th>
                    <th className="py-3 px-3">Registered At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations.map((p) => {
                    const isSelected = activeParticipantId === p._id;
                    return (
                      <tr
                        key={p._id}
                        className={`transition-colors hover:bg-gray-50/80 ${
                          isSelected ? 'bg-amber-50/70 border-l-4 border-[#F5A623]' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-[#0B132B]">
                          {p.referenceNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {p.fullName}
                        </td>
                        <td className="py-3 px-4 text-gray-600 truncate max-w-[180px]">
                          {p.email}
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-mono">
                          {p.collegeId || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            v{p.formVersion}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenDetail(p._id)}
                            className="px-2.5 py-1 bg-[#1C2541] hover:bg-[#F5A623] hover:text-[#0B132B] text-white rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            View Answers
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Drawer: Participant Historical Detail */}
          {activeParticipantId && (
            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-gray-200 bg-white overflow-y-auto flex flex-col p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-serif text-sm font-bold text-[#0B132B]">
                  Participant Submission
                </h3>
                <button
                  onClick={() => {
                    setActiveParticipantId(null);
                    setDetailData(null);
                  }}
                  className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {isDetailLoading ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  Resolving historical schema snapshot...
                </div>
              ) : detailError ? (
                <div className="py-8 text-center text-xs text-red-600">
                  {detailError}
                </div>
              ) : detailData ? (
                <div className="space-y-4 pt-3 text-xs">
                  {/* Schema Snapshot Info Banner */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900">Form Snapshot</span>
                      <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded font-bold text-[10px]">
                        Version {detailData.historicalFormVersion}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Answered using schema snapshot with {detailData.historicalFieldsCount} configured fields.
                    </p>
                  </div>

                  {/* Core Details */}
                  <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Reference Number</p>
                      <p className="font-mono font-bold text-[#0B132B]">{detailData.referenceNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Full Name</p>
                      <p className="font-semibold text-gray-800">{detailData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Email Address</p>
                      <p className="text-gray-700">{detailData.email}</p>
                    </div>
                    {detailData.phone && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Phone</p>
                        <p className="text-gray-700 font-mono">{detailData.phone}</p>
                      </div>
                    )}
                    {detailData.collegeId && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">College / Student ID</p>
                        <p className="text-gray-700 font-mono">{detailData.collegeId}</p>
                      </div>
                    )}
                  </div>

                  {/* Custom Form Answers */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                      Form Responses ({detailData.answers?.length || 0})
                    </h4>

                    {detailData.answers && detailData.answers.length > 0 ? (
                      <div className="space-y-2.5">
                        {detailData.answers.map((ans, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-gray-200 rounded-xl space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-800 text-[11px]">
                                {ans.label || ans.fieldId}
                              </span>
                              {ans.type && (
                                <span className="px-1.5 py-0.2 bg-gray-100 text-gray-500 rounded text-[9px] uppercase font-mono">
                                  {ans.type}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-900 font-medium break-words">
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
                      <p className="text-gray-400 italic text-[11px]">No custom form fields answered.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <p className="text-gray-500">
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => {
                const prev = page - 1;
                setPage(prev);
                fetchRegistrations(prev);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchRegistrations(next);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
