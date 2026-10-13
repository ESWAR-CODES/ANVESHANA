import React, { useState, useEffect } from 'react';
import { feedbackService } from '../../services/feedbackService';
import type { FeedbackItem, FeedbackStatus, FeedbackAdminMetrics } from '../../types/feedback';
import { Button } from '../common/Button';

export const FeedbackModerationSection: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<FeedbackAdminMetrics>({
    total: 0,
    pending: 0,
    reviewed: 0,
    archived: 0,
    averageRating: 0,
  });
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Soft deletion confirmation state
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFeedback = async (targetPage = page) => {
    setIsLoading(true);
    try {
      const params: any = {
        page: targetPage,
        limit: 15,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await feedbackService.getAdminFeedback(params);
      if (res.success && res.data) {
        setFeedbacks(res.data.feedbacks || []);
        setMetrics(res.data.metrics || { total: 0, pending: 0, reviewed: 0, archived: 0, averageRating: 0 });
        setPage(res.data.pagination?.page || 1);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setNotification({ text: res.error || 'Failed to fetch feedback records.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({
        text: err.response?.status === 503
          ? 'Database service is offline. Please configure MongoDB Atlas.'
          : err.response?.data?.error || 'Failed to fetch feedback records.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback(1);
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedback(1);
  };

  const handleUpdateStatus = async (item: FeedbackItem, newStatus: FeedbackStatus) => {
    try {
      const res = await feedbackService.moderateFeedbackStatus(item._id, newStatus);
      if (res.success) {
        setNotification({ text: `Feedback marked as "${newStatus}".`, type: 'success' });
        fetchFeedback(page);
      } else {
        setNotification({ text: res.error || 'Failed to update status.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ text: err.response?.data?.error || 'Failed to update status.', type: 'error' });
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await feedbackService.softDeleteFeedback(deleteTarget._id);
      if (res.success) {
        setNotification({ text: 'Feedback soft-deleted successfully.', type: 'success' });
        setDeleteTarget(null);
        fetchFeedback(page);
      } else {
        setNotification({ text: res.error || 'Failed to soft delete feedback.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ text: err.response?.data?.error || 'Failed to soft delete feedback.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-[#F5A623]">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-sm">
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
        <span className="ml-1 text-[11px] font-bold text-gray-700">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border-l-4 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
              : 'bg-red-50 text-red-800 border-red-500'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Total Submissions</p>
          <p className="text-3xl font-serif font-bold text-[#0B132B] mt-1">{metrics.total}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Pending Review</p>
          <p className="text-3xl font-serif font-bold text-amber-700 mt-1">{metrics.pending}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Approved / Reviewed</p>
          <p className="text-3xl font-serif font-bold text-emerald-700 mt-1">{metrics.reviewed}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Archived</p>
          <p className="text-3xl font-serif font-bold text-gray-600 mt-1">{metrics.archived}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs col-span-2 lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Avg Rating</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-serif font-bold text-[#0B132B]">{metrics.averageRating}</span>
            <span className="text-xs text-gray-400 font-bold">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Main Moderation Table Container */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#0B132B]">
                Feedback & Review Moderation
              </h2>
              <p className="text-xs text-gray-500">
                Moderate public campus feedback. Approved items contribute to the public aggregate score.
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={() => fetchFeedback(page)}>
              ↻ Refresh
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              {(['all', 'pending', 'reviewed', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white text-[#0B132B] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Category and Search */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none"
              >
                <option value="">All Categories</option>
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </select>

              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  placeholder="Search comments, names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Search
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-500">
            Loading feedback records...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-serif text-sm font-semibold text-gray-700">No feedback submissions found</p>
            <p className="text-xs text-gray-500">
              {statusFilter === 'all'
                ? 'No feedback has been submitted yet.'
                : `No feedback currently matching status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50/70 transition-colors space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      {renderStars(item.rating)}
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">
                        {item.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          item.status === 'reviewed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-900">{item.name || 'Anonymous Student'}</span>
                      {item.email && <span>({item.email})</span>}
                      <span>•</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex items-center gap-2">
                    {item.status !== 'reviewed' && (
                      <button
                        onClick={() => handleUpdateStatus(item, 'reviewed')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    )}

                    {item.status !== 'archived' && (
                      <button
                        onClick={() => handleUpdateStatus(item, 'archived')}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        Archive
                      </button>
                    )}

                    {item.status !== 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(item, 'pending')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        Pending
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Feedback Comment */}
                <p className="text-xs text-gray-800 leading-relaxed bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                  "{item.comment}"
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
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
                fetchFeedback(prev);
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
                fetchFeedback(next);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Soft-Delete Dialog */}
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
                Delete Feedback Record?
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                This will soft-delete the feedback (marking <code>isDeleted: true</code>) to preserve historical data auditability while removing it from both public display and admin moderation metrics.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmSoftDelete} isLoading={isDeleting}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
