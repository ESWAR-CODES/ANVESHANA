import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { feedbackService } from '../../services/feedbackService';
import type { FeedbackPublicItem } from '../../types/feedback';

export const FeedbackPage: React.FC = () => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [category, setCategory] = useState<'general' | 'event' | 'website' | 'other'>('general');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Public aggregate and verified feedbacks
  const [publicFeedbacks, setPublicFeedbacks] = useState<FeedbackPublicItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  const fetchPublicFeedback = async () => {
    setIsLoadingPublic(true);
    try {
      const res = await feedbackService.getPublicFeedback();
      if (res.success && res.data) {
        setPublicFeedbacks(res.data.feedbacks || []);
        if (res.data.stats) {
          setAverageRating(res.data.stats.averageRating || 5.0);
          setTotalCount(res.data.stats.totalCount || 0);
        }
      }
    } catch {
      // In offline/initial state, keep defaults
    } finally {
      setIsLoadingPublic(false);
    }
  };

  useEffect(() => {
    fetchPublicFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (comment.trim().length < 5) {
      setErrorMessage('Please share a comment of at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        comment: comment.trim(),
        category,
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
      };

      const res = await feedbackService.submitFeedback(payload);
      if (res.success) {
        setIsSubmitted(true);
        // Reset form fields
        setComment('');
        setName('');
        setEmail('');
        setRating(5);
        setCategory('general');
        fetchPublicFeedback();
      } else {
        setErrorMessage(res.error || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setErrorMessage('Too many feedback submissions from your IP. Please try again later.');
      } else if (err.response?.status === 503) {
        setErrorMessage('Database service is currently unavailable. Please try again later.');
      } else {
        setErrorMessage(err.response?.data?.error || 'Failed to submit feedback.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (score: number) => {
    const rounded = Math.round(score);
    return (
      <div className="flex items-center gap-0.5 text-[#F5A623]">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-base">
            {star <= rounded ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3.5 py-1 rounded-full border border-[#F5A623]/20">
          Continuous Improvement
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B132B] mt-4 mb-3">
          Contact & Community Feedback
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Share your ideas, suggest technology workshops, or reach out to the Anveshana executive committee.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 max-w-6xl mx-auto">
        {/* Left Column: Official Contact Info & Community Aggregate */}
        <div className="lg:col-span-5 space-y-6">
          {/* Institutional Contact Card */}
          <div className="bg-[#0B132B] text-white p-8 rounded-2xl border border-[#1C2541] shadow-md space-y-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#F5A623]">
                Institution & Campus
              </span>
              <h2 className="font-serif text-2xl font-bold mt-1 text-[#F8FAFC]">
                Mohan Babu University
              </h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Sree Sainath Nagar, Tirupati, Andhra Pradesh - 517102
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#1C2541]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1C2541] text-[#F5A623] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Club Inquiries</p>
                  <p className="text-xs font-semibold text-white">anveshana@mbu.edu.in</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1C2541] text-[#F5A623] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Affiliated Schools</p>
                  <p className="text-xs font-semibold text-white">School of Computing & School of Engineering</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#1C2541]/80 rounded-xl border border-white/5 text-xs text-gray-300">
              <p className="font-semibold text-[#F5A623] mb-1">Privacy Notice</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Submissions do not require student login. Verified reviews are moderated before being aggregated into public ratings.
              </p>
            </div>
          </div>

          {/* Aggregate Rating Scorecard */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Community Satisfaction Score
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl font-bold text-[#0B132B]">
                {averageRating.toFixed(1)}
              </span>
              <div>
                {renderStars(averageRating)}
                <span className="text-[11px] text-gray-500">
                  {totalCount > 0 ? `Based on ${totalCount} student reviews` : 'Awaiting campus feedback'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Feedback Form Shell */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-[#E2E8F0] shadow-sm">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#0B132B]">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                Your rating and review have been securely submitted to the Anveshana admin committee. All suggestions guide upcoming workshops and events.
              </p>
              <div className="pt-4">
                <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)}>
                  Submit Another Review
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Rating selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-2">
                  Rate Your Experience (1 - 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded-md hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-300'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-gray-500 ml-2">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="feedback-category"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-1.5"
                >
                  Feedback Topic / Category
                </label>
                <select
                  id="feedback-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#F5A623]"
                >
                  <option value="general">General Experience</option>
                  <option value="event">Workshop / Hackathon Event</option>
                  <option value="website">Club Portal & Usability</option>
                  <option value="other">Other / Suggestion</option>
                </select>
              </div>

              {/* Optional Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="feedback-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-1.5"
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., A. Sharma"
                    maxLength={100}
                    className="w-full px-3 py-2 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="feedback-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-1.5"
                  >
                    Email Address (Optional)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., student@mbu.edu.in"
                    maxLength={100}
                    className="w-full px-3 py-2 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label
                  htmlFor="feedback-comment"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-1.5"
                >
                  Suggestions & Feedback *
                </label>
                <textarea
                  id="feedback-comment"
                  rows={4}
                  maxLength={1000}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of what you enjoyed or what technologies you'd like Anveshana Club to feature in upcoming bootcamps..."
                  className="w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                />
                <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1">
                  <span>Min 5 characters, max 1000</span>
                  <span>{comment.length}/1000</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Submit Feedback
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Verified Student Feedback Carousel / Wall */}
      {isLoadingPublic ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading community feedback...</div>
      ) : publicFeedbacks.length > 0 ? (
        <div className="pt-8 border-t border-gray-100 max-w-5xl mx-auto space-y-6">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">
              Community Voices
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#0B132B] mt-1">
              Recent Reviewed Reviews
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publicFeedbacks.map((f) => (
              <div
                key={f._id}
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {renderStars(f.rating)}
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">
                      {f.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    "{f.comment}"
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-700">{f.name || 'Anonymous Student'}</span>
                  <span>{new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
