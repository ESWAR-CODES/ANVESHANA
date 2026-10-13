import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired') === 'true') {
      setSessionExpiredNotice(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated) {
      const destination = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSessionExpiredNotice(false);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    } else {
      const destination = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden">
        {/* Header with Deep Navy Background */}
        <div className="bg-[#0B132B] px-8 py-8 text-center border-b border-[#1C2541]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1C2541] border border-[#F5A623]/30 text-[#F5A623] font-serif text-xl font-bold mb-3">
            A
          </div>
          <h1 className="text-2xl font-serif text-[#F8FAFC] tracking-wide font-semibold">
            Anveshana Club
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#F5A623] mt-1 font-medium">
            Administrative Portal
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          {sessionExpiredNotice && (
            <div className="mb-6 p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-xs text-amber-800">
              Your administrative session has expired. Please log in again to continue.
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-[#EF4444] rounded text-xs text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@anveshana-mbu.in"
                className="w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#F5A623] hover:bg-[#e0961b] active:bg-[#cc8715] text-[#0B132B] font-semibold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0B132B] border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E2E8F0] text-center">
            <p className="text-xs text-gray-400">
              Authorized Mohan Babu University personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
