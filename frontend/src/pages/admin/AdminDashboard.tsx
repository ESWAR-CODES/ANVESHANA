import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#0B132B] text-white border-b border-[#1C2541] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1C2541] border border-[#F5A623]/40 text-[#F5A623] flex items-center justify-center font-serif font-bold text-lg">
            A
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold tracking-wide text-[#F8FAFC]">
              Anveshana Club
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-[#F5A623]">
              Admin Control Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-[#F8FAFC]">{admin?.email}</p>
            <span className="inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C2541] text-[#F5A623] font-semibold border border-[#F5A623]/20">
              {admin?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-[#1C2541] hover:bg-red-900/40 text-gray-200 hover:text-red-300 border border-gray-700 hover:border-red-500/50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-serif font-semibold text-[#0B132B]">
                Welcome back, {admin?.email}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Your administrative session is verified by the backend via secure HttpOnly cookie.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Session Active
            </div>
          </div>
        </div>

        {/* Phase 3 Scope Notice */}
        <div className="bg-[#FDFBF7] border border-[#E2E8F0] rounded-xl p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0B132B] mb-2">
            Phase 3 Status: Authentication & Security Complete
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            Administrative authentication, session verification, rate limiting, and route protection are fully operational. Event management, dynamic form builder, participant management, and gallery modules will be connected in subsequent phases as authorized.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Phase 4 Next</p>
              <p className="text-sm font-medium text-[#0B132B] mt-1">Public UI & Brand Layouts</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Phase 5 & 6</p>
              <p className="text-sm font-medium text-[#0B132B] mt-1">Events & Dynamic Form Builder</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Phase 7 & 9</p>
              <p className="text-sm font-medium text-[#0B132B] mt-1">Participants & Team Directory</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
