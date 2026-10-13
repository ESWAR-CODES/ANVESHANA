import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import type { ClubEvent } from '../../types/event';
import { Button } from '../common/Button';

interface EventModalProps {
  isOpen: boolean;
  event: ClubEvent | null; // null for Create, ClubEvent for Edit
  onClose: () => void;
  onSuccess: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Workshop');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM - 04:00 PM');
  const [venue, setVenue] = useState('Auditorium Block A, MBU Campus');
  const [eligibility, setEligibility] = useState('Open for all MBU Students');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [isPublished, setIsPublished] = useState(false);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setCategory(event.category || 'Workshop');
      setDate(event.eventDate ? event.eventDate.split('T')[0] : '');
      setTime(event.time || '');
      setVenue(event.venue || '');
      setEligibility(event.eligibility || '');
      setShortDescription(event.shortDescription || '');
      setFullDescription(event.fullDescription || '');
      setMaxParticipants(event.maxParticipants ? String(event.maxParticipants) : '');
      setIsPublished(event.isPublished ?? false);
      setBannerPreview(event.bannerMedia?.url || null);
      setBannerFile(null);
    } else {
      // Default reset for creation
      setTitle('');
      setCategory('Workshop');
      setDate('');
      setTime('10:00 AM - 04:00 PM');
      setVenue('Auditorium Block A, MBU Campus');
      setEligibility('Open for all MBU Students');
      setShortDescription('');
      setFullDescription('');
      setMaxParticipants('');
      setIsPublished(false);
      setBannerFile(null);
      setBannerPreview(null);
    }
    setErrorMessage(null);
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image exceeds the strict 2MB limit. Please choose a smaller file.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Invalid image format. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    setBannerFile(file);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !date || !time.trim() || !venue.trim() || !shortDescription.trim() || !fullDescription.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!event && !bannerFile) {
      setErrorMessage('Please upload a banner image for the event (Max 2MB).');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('eventDate', new Date(date).toISOString());
      formData.append('time', time.trim());
      formData.append('venue', venue.trim());
      formData.append('eligibility', eligibility.trim());
      formData.append('shortDescription', shortDescription.trim());
      formData.append('fullDescription', fullDescription.trim());
      formData.append('isPublished', String(isPublished));
      formData.append('status', isPublished ? 'published' : 'draft');
      if (maxParticipants.trim()) {
        formData.append('maxParticipants', maxParticipants.trim());
      }

      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      let res;
      if (event) {
        res = await eventService.updateAdminEvent(event._id, formData);
      } else {
        res = await eventService.createAdminEvent(formData);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to save event.');
      }
    } catch (err: any) {
      const errorText =
        err.response?.status === 503
          ? 'Database or Cloudinary service is currently unavailable. Please check your configuration.'
          : err.response?.data?.error || 'An error occurred while saving the event.';
      setErrorMessage(errorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="bg-[#0B132B] px-6 py-4 flex items-center justify-between text-white border-b border-[#1C2541]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]"></span>
            <h3 className="font-serif text-lg font-bold">
              {event ? 'Edit Event' : 'Create New Event'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border-l-4 border-[#EF4444] rounded-lg text-xs text-red-700 flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Anveshana National Hackathon 2026"
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              >
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Tech Talk">Tech Talk</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Competition">Competition</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Time *
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="10:00 AM - 04:00 PM"
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Venue Location *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Auditorium Block A, MBU Campus"
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Eligibility
              </label>
              <input
                type="text"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="Open for all MBU Students"
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Short Description (max 200 chars) *
            </label>
            <textarea
              required
              maxLength={200}
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary appearing on event cards..."
              className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            />
            <p className="text-[10px] text-gray-400 text-right">{shortDescription.length}/200</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Full Event Description *
            </label>
            <textarea
              required
              rows={5}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed schedule, rules, guidelines, problem statement..."
              className="w-full px-3 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            />
          </div>

          {/* Banner Image Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Event Banner Image {event ? '(Leave blank to preserve current)' : '*'} (Max 2MB)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1C2541] file:text-[#F5A623] hover:file:bg-[#0B132B] cursor-pointer"
              />
              {bannerPreview && (
                <div className="w-16 h-10 rounded border border-gray-200 overflow-hidden shrink-0">
                  <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Publication Status Toggle */}
          <div className="pt-2 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <span className="text-xs font-medium text-gray-700">
              {isPublished ? 'Published (Visible on Public Website)' : 'Draft (Saved as Private Draft)'}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {event ? 'Update Event' : 'Publish Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
