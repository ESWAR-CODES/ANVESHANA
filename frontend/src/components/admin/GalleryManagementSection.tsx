import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { galleryService } from '../../services/galleryService';
import type { ClubEvent } from '../../types/event';
import type { GalleryImage, EventGalleryWinner } from '../../types/gallery';
import { Button } from '../common/Button';

export const GalleryManagementSection: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'photos' | 'story'>('photos');

  // Gallery Images State
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Upload State
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPublicId, setDeletingPublicId] = useState<string | null>(null);

  // Story & Retrospective Details State
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDate, setStoryDate] = useState('');
  const [shortSummary, setShortSummary] = useState('');
  const [fullStory, setFullStory] = useState('');
  const [challenges, setChallenges] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [winners, setWinners] = useState<EventGalleryWinner[]>([
    { position: '1st Place', name: '', project: '' },
    { position: '2nd Place', name: '', project: '' },
    { position: '3rd Place', name: '', project: '' },
  ]);
  const [isSavingStory, setIsSavingStory] = useState(false);

  // Load events for selection
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const res = await eventService.getAdminEvents({ limit: 100 });
        if (res.success && res.data) {
          setEvents(res.data);
          if (res.data.length > 0) {
            setSelectedEventId(res.data[0]._id);
            setSelectedEventTitle(res.data[0].title);
          }
        }
      } catch {
        setNotification({
          text: 'Database service is offline. Please configure MongoDB Atlas.',
          type: 'error',
        });
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch gallery and story for currently selected event
  const fetchGallery = async (eventId: string) => {
    if (!eventId) return;
    setIsLoadingGallery(true);
    try {
      const res = await galleryService.getAdminGallery(eventId);
      if (res.success && res.data) {
        setImages(res.data.images || []);
        setStoryTitle(res.data.title || '');
        setStoryDate(res.data.eventDate || '');
        setShortSummary(res.data.shortSummary || '');
        setFullStory(res.data.fullStory || '');
        setChallenges(res.data.challenges || '');
        setHighlightsInput((res.data.highlights || []).join('\n'));
        if (res.data.winners && res.data.winners.length > 0) {
          setWinners(res.data.winners);
        } else {
          setWinners([
            { position: '1st Place', name: '', project: '' },
            { position: '2nd Place', name: '', project: '' },
            { position: '3rd Place', name: '', project: '' },
          ]);
        }
      } else {
        setImages([]);
      }
    } catch (err: any) {
      setImages([]);
      if (err.response?.status !== 404) {
        setNotification({
          text: err.response?.data?.error || 'Failed to load event gallery data.',
          type: 'error',
        });
      }
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchGallery(selectedEventId);
    }
  }, [selectedEventId]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const ev = events.find((e) => e._id === id);
    if (ev) setSelectedEventTitle(ev.title);
    setFileToUpload(null);
    setFilePreview(null);
    setCaption('');
    setAltText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        text: 'File size exceeds the 5MB gallery limit. Please select a smaller photo.',
        type: 'error',
      });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotification({
        text: 'Invalid format. Only JPEG, PNG, and WebP are allowed.',
        type: 'error',
      });
      return;
    }

    setFileToUpload(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !selectedEventId) return;

    setIsUploading(true);
    setNotification(null);

    const formData = new FormData();
    formData.append('image', fileToUpload);
    if (caption.trim()) formData.append('caption', caption.trim());
    if (altText.trim()) formData.append('altText', altText.trim());
    formData.append('displayOrder', String(images.length));

    try {
      const res = await galleryService.uploadGalleryPhoto(selectedEventId, formData);
      if (res.success) {
        setNotification({ text: 'Photo added to event gallery successfully.', type: 'success' });
        setFileToUpload(null);
        setFilePreview(null);
        setCaption('');
        setAltText('');
        fetchGallery(selectedEventId);
      } else {
        setNotification({ text: res.error || 'Failed to upload photo.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({
        text: err.response?.data?.error || 'Failed to upload gallery photo.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (publicId: string) => {
    if (!selectedEventId || !publicId) return;
    setDeletingPublicId(publicId);
    try {
      const res = await galleryService.deleteGalleryPhoto(selectedEventId, publicId);
      if (res.success) {
        setNotification({ text: 'Photo removed from gallery.', type: 'success' });
        fetchGallery(selectedEventId);
      } else {
        setNotification({ text: res.error || 'Failed to remove photo.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ text: err.response?.data?.error || 'Failed to remove photo.', type: 'error' });
    } finally {
      setDeletingPublicId(null);
    }
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    setIsSavingStory(true);
    setNotification(null);

    const parsedHighlights = highlightsInput
      .split('\n')
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    const validWinners = winners.filter((w) => w.name.trim().length > 0);

    try {
      const res = await galleryService.updateGalleryStory(selectedEventId, {
        title: storyTitle.trim() || selectedEventTitle,
        eventDate: storyDate.trim(),
        shortSummary: shortSummary.trim(),
        fullStory: fullStory.trim(),
        challenges: challenges.trim(),
        highlights: parsedHighlights,
        winners: validWinners,
      });

      if (res.success) {
        setNotification({
          text: 'Event retrospective story saved and published successfully.',
          type: 'success',
        });
      } else {
        setNotification({ text: res.error || 'Failed to save story.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({
        text: err.response?.data?.error || 'Failed to save event story.',
        type: 'error',
      });
    } finally {
      setIsSavingStory(false);
    }
  };

  const addWinnerRow = () => {
    setWinners((prev) => [
      ...prev,
      { position: `${prev.length + 1}th Place`, name: '', project: '' },
    ]);
  };

  const removeWinnerRow = (index: number) => {
    setWinners((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWinnerField = (index: number, field: keyof EventGalleryWinner, val: string) => {
    setWinners((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
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

      {/* Header card with event selector */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#0B132B]">
              Event Retrospectives &amp; Gallery
            </h2>
            <p className="text-xs text-gray-500">
              Manage retrospective photography (5MB per photo) and publish rich event retrospective stories.
            </p>
          </div>

          {events.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="eventSelect" className="text-xs font-semibold text-gray-700">
                Target Event:
              </label>
              <select
                id="eventSelect"
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:ring-2 focus:ring-[#F5A623] outline-none max-w-xs"
              >
                {events.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Switcher: Photos vs Story */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-[#0B132B] text-[#F5A623] shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-[#0B132B]'
            }`}
          >
            📷 Photo Gallery ({images.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'story'
                ? 'bg-[#0B132B] text-[#F5A623] shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-[#0B132B]'
            }`}
          >
            📝 Retrospective Story &amp; Winners
          </button>
        </div>
      </div>

      {isLoadingEvents ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
          <p className="font-serif text-base font-bold text-gray-700">No events found in database</p>
          <p className="text-xs text-gray-500">Create an event under Events Management before adding gallery photos.</p>
        </div>
      ) : activeTab === 'photos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload New Photo (5 MB Limit) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4 h-fit">
            <h3 className="font-serif text-sm font-bold text-[#0B132B]">
              Upload Photo for "{selectedEventTitle}"
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Select Photograph (Max 5MB) *
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#F5A623] transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {filePreview ? (
                    <div className="space-y-2">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-36 object-cover rounded-lg mx-auto border border-gray-200"
                      />
                      <p className="text-[11px] text-emerald-600 font-semibold">{fileToUpload?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-4">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-[#F5A623] mx-auto flex items-center justify-center font-bold">
                        📷
                      </div>
                      <p className="font-medium text-gray-700">Click or drag image to upload</p>
                      <p className="text-[10px] text-gray-400">JPEG, PNG, or WebP up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="gallery-caption" className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Caption (Optional)
                </label>
                <input
                  id="gallery-caption"
                  type="text"
                  maxLength={200}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Participants pitching during finals"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <div>
                <label htmlFor="gallery-alt" className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Alt Text for Accessibility (Optional)
                </label>
                <input
                  id="gallery-alt"
                  type="text"
                  maxLength={200}
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. Three students presenting a hardware prototype on stage"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isUploading}
                disabled={!fileToUpload || isUploading}
              >
                Upload to Gallery
              </Button>
            </form>
          </div>

          {/* Right Column: Existing Photos Grid */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif text-sm font-bold text-[#0B132B]">
                  Gallery Photos ({images.length})
                </h3>
                <p className="text-[11px] text-gray-400">
                  Attached retrospective photographs for {selectedEventTitle}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchGallery(selectedEventId)}
                disabled={isLoadingGallery}
              >
                ↻ Refresh
              </Button>
            </div>

            {isLoadingGallery ? (
              <div className="p-12 text-center text-xs text-gray-400">Loading gallery photos...</div>
            ) : images.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="font-serif text-sm font-semibold text-gray-700">No gallery photos uploaded yet</p>
                <p className="text-xs text-gray-500">
                  Use the upload tool on the left to add your first photo from this workshop or hackathon.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div
                    key={img.publicId}
                    className="group relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
                      <img
                        src={img.url}
                        alt={img.altText || img.caption || 'Event photograph'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => handleDeletePhoto(img.publicId)}
                        disabled={deletingPublicId === img.publicId}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm text-xs"
                        title="Remove photo"
                      >
                        {deletingPublicId === img.publicId ? '...' : '✕'}
                      </button>
                    </div>

                    <div className="p-2.5 bg-white border-t border-gray-100 space-y-0.5">
                      <p className="text-[11px] text-gray-700 truncate font-medium">
                        {img.caption || 'Untitled photo'}
                      </p>
                      {img.altText && (
                        <p className="text-[10px] text-gray-400 truncate italic">
                          Alt: {img.altText}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Story & Retrospective Details Tab */
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-serif text-lg font-bold text-[#0B132B]">
              Retrospective Story Editor
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Document the outcomes, challenges, winning teams, and milestones for {selectedEventTitle}.
            </p>
          </div>

          <form onSubmit={handleSaveStory} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Retrospective Headline / Title
                </label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="e.g. Anveshana Hackathon 2026: 36 Hours of Student Innovation"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Event Concluded Date
                </label>
                <input
                  type="text"
                  value={storyDate}
                  onChange={(e) => setStoryDate(e.target.value)}
                  placeholder="e.g. October 15, 2026"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Executive Short Summary
              </label>
              <textarea
                rows={2}
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                placeholder="High-level overview of event achievements and student turnout..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Retrospective Story
              </label>
              <textarea
                rows={5}
                value={fullStory}
                onChange={(e) => setFullStory(e.target.value)}
                placeholder="Detailed narrative describing the keynote speeches, coding rounds, project presentations, and atmosphere..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Technical Challenges Faced &amp; Solved
                </label>
                <textarea
                  rows={4}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Describe unique engineering challenges, API rate limits, hardware debugging hurdles..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Key Highlights / Takeaways (One per line)
                </label>
                <textarea
                  rows={4}
                  value={highlightsInput}
                  onChange={(e) => setHighlightsInput(e.target.value)}
                  placeholder="120+ Student participants across 2 Schools&#10;14 Working prototypes submitted&#10;Industry mentorship from top alumni"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>
            </div>

            {/* Winners / Podium Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#0B132B]">
                    Winners &amp; Recognition Podium
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Document the award winners and standout projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addWinnerRow}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Add Position
                </button>
              </div>

              <div className="space-y-2">
                {winners.map((winner, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={winner.position}
                      onChange={(e) => updateWinnerField(idx, 'position', e.target.value)}
                      placeholder="e.g. 1st Place"
                      className="w-32 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                    />
                    <input
                      type="text"
                      value={winner.name}
                      onChange={(e) => updateWinnerField(idx, 'name', e.target.value)}
                      placeholder="Team / Student Name"
                      className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                    />
                    <input
                      type="text"
                      value={winner.project || ''}
                      onChange={(e) => updateWinnerField(idx, 'project', e.target.value)}
                      placeholder="Project Name / Description (Optional)"
                      className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#F5A623]"
                    />
                    <button
                      type="button"
                      onClick={() => removeWinnerRow(idx)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center text-xs cursor-pointer"
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingStory}
                disabled={isSavingStory}
              >
                Save Retrospective Story
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
