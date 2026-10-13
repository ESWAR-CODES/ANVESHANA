import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export const FeedbackPage: React.FC = () => {
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3 py-1 rounded-full">
          Continuous Improvement
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B132B] mt-4 mb-3">
          Contact & Feedback
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Share your experience with our hackathons and workshops, or reach out to the Anveshana executive committee.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 max-w-5xl mx-auto">
        {/* Left Column: Official Contact Info */}
        <div className="lg:col-span-5 bg-[#0B132B] text-white p-8 rounded-2xl border border-[#1C2541] shadow-md space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
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
          </div>

          <div className="p-4 bg-[#1C2541]/80 rounded-xl border border-white/5 text-xs text-gray-300">
            <p className="font-semibold text-[#F5A623] mb-1">Privacy Notice</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Submissions do not require login. Your feedback is reviewed directly by club leads to improve future hackathons.
            </p>
          </div>
        </div>

        {/* Right Column: Feedback Form Shell */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-[#E2E8F0] shadow-sm">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#0B132B]">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                Your rating and review have been noted. The core team reviews all student comments to guide upcoming semester workshops.
              </p>
              <div className="pt-4">
                <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)}>
                  Submit Another Review
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-2">
                  Rate Your Experience (1 - 5 Stars)
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

              <div>
                <label
                  htmlFor="feedback-comment"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-2"
                >
                  Suggestions & Feedback (Optional)
                </label>
                <textarea
                  id="feedback-comment"
                  rows={4}
                  maxLength={500}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you liked about our events or what new technology topics you want us to cover..."
                  className="w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent transition-all"
                />
                <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1">
                  <span>Max 500 characters</span>
                  <span>{feedbackText.length}/500</span>
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" fullWidth>
                Submit Feedback
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
