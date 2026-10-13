import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import type { ClubSettings, UpdateSettingsPayload } from '../../types/settings';
import { Button } from '../common/Button';

export const ClubSettingsSection: React.FC = () => {
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable Form fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');

  const fetchSettings = async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await settingsService.getAdminSettings();
      if (res.success && res.data) {
        populateForm(res.data);
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to load club settings.' });
      }
    } catch (err: any) {
      const msg =
        err.response?.status === 503
          ? 'Database is currently offline. Showing fallback default values.'
          : err.response?.data?.error || 'Failed to connect to settings service.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = (data: ClubSettings) => {
    setSettings(data);
    setContactEmail(data.contactEmail || '');
    setContactPhone(data.contactPhone || '');
    setInstagram(data.socialLinks?.instagram || '');
    setLinkedin(data.socialLinks?.linkedin || '');
    setGithub(data.socialLinks?.github || '');
    setTwitter(data.socialLinks?.twitter || '');
    setYoutube(data.socialLinks?.youtube || '');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMessage(null);

    const payload: UpdateSettingsPayload = {
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || null,
      socialLinks: {
        instagram: instagram.trim() || null,
        linkedin: linkedin.trim() || null,
        github: github.trim() || null,
        twitter: twitter.trim() || null,
        youtube: youtube.trim() || null,
      },
    };

    try {
      const res = await settingsService.updateAdminSettings(payload);
      if (res.success && res.data) {
        populateForm(res.data);
        setFeedbackMessage({
          type: 'success',
          text: 'Club settings and contact information successfully updated.',
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to save settings changes.',
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.status === 503
          ? 'Database is currently offline. Configuration changes cannot be saved until MongoDB is connected.'
          : err.response?.data?.error || 'Error saving settings updates.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#0B132B]">Club Settings &amp; Contacts</h2>
        <p className="text-xs text-gray-500 mt-1">
          Manage official contact addresses, campus helpdesks, and social channels for Mohan Babu University Anveshana Club.
        </p>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="font-bold cursor-pointer hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Immutable University Charter & Brand Policy Notice */}
      <div className="bg-gradient-to-r from-[#0B132B] to-[#1C2541] rounded-2xl p-6 text-white border border-[#F5A623]/30 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623] animate-pulse" />
          <h3 className="font-serif text-base font-bold text-[#F5A623] uppercase tracking-wider">
            Protected University Charter &amp; Brand Standards
          </h3>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed max-w-4xl">
          Per Mohan Babu University specifications and the Anveshana Club constitution, organizational identity, 
          brand tokens, and the seven core wings are system-level constants and cannot be altered through the administrative dashboard.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-[#F5A623] font-semibold block">Club Name</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{settings?.clubName || 'Anveshana Club'}</span>
            <span className="text-[10px] text-gray-400 mt-1 inline-flex items-center gap-1">🔒 Immutable</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-[#F5A623] font-semibold block">University</span>
            <span className="text-sm font-bold text-white mt-0.5 block">Mohan Babu University</span>
            <span className="text-[10px] text-gray-400 mt-1 inline-flex items-center gap-1">🔒 Immutable</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-[#F5A623] font-semibold block">Tagline</span>
            <span className="text-sm font-medium text-gray-200 mt-0.5 block truncate" title={settings?.tagline || 'Explore · Build · Bring Ideas to Life'}>
              {settings?.tagline || 'Explore · Build · Bring Ideas to Life'}
            </span>
            <span className="text-[10px] text-gray-400 mt-1 inline-flex items-center gap-1">🔒 Immutable</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-[#F5A623] font-semibold block">Brand Palette</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0B132B] border border-white/30" title="Primary Navy #0B132B" />
              <span className="w-5 h-5 rounded-full bg-[#1C2541] border border-white/30" title="Secondary Navy #1C2541" />
              <span className="w-5 h-5 rounded-full bg-[#F5A623] border border-white/30" title="Accent Gold #F5A623" />
              <span className="w-5 h-5 rounded-full bg-[#FDFBF7] border border-white/30" title="Ivory #FDFBF7" />
            </div>
            <span className="text-[10px] text-gray-400 mt-1 inline-flex items-center gap-1">🔒 Immutable</span>
          </div>
        </div>
      </div>

      {/* Editable Contact & Social Links Form */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center text-xs text-gray-500">
          Loading club configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-8 shadow-xs">
          {/* Contact Coordinates */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#0B132B]">Official Contact Coordinates</h3>
              <p className="text-xs text-gray-500">
                These coordinates appear across public navigation, footer, registration confirmation emails, and helpdesk banners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Official Club Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="anveshana@mbu.asia"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:border-transparent transition-all"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Official club mailbox receiving student queries and portal notifications.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Helpdesk Contact Phone (Optional)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 (Tirupati Campus Desk)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:border-transparent transition-all"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Display contact number for active event coordination desks.
                </span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#0B132B]">Verified Social Channels</h3>
              <p className="text-xs text-gray-500">
                Official URLs linked in the public website header, footer, and community banners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/anveshanaclub_mbu"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/anveshana-club-mbu"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  GitHub Organization URL
                </label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/anveshana-club"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  X / Twitter URL
                </label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/anveshana_mbu"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@anveshanaclub"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              disabled={isSaving}
            >
              Reset Changes
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
