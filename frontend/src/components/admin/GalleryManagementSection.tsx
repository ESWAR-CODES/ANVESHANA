import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { galleryService } from '../../services/galleryService';
import type { ClubEvent } from '../../types/event';
import type { GalleryImage } from '../../types/gallery';
import { Button } from '../common/Button';

export const GalleryManagementSection: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Upload state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Delete state
  const [deletingPublicId, setDeletingPublicId] = useState<string | null>(null);

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

  // Fetch gallery for currently selected event
  const fetchGallery = async (eventId: string) => {
    if (!eventId) return;
    setIsLoadingGallery(true);
    try {
      const res = await galleryService.getAdminGallery(eventId);
      if (res.success && res.data) {
        setImages(res.data.images || []);
      } else {
        setImages([]);
      }
    } catch (err: any) {
      setImages([]);
      if (err.response?.status !== 404) {
        setNotification({
          text: err.response?.data?.error || 'Failed to load event gallery photos.',
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
    formData.append('displayOrder', String(images.length));

    try {
      const res = await galleryService.uploadGalleryPhoto(selectedEventId, formData);
      if (res.success) {
        setNotification({ text: 'Photo added to event gallery successfully.', type: 'success' });
        setFileToUpload(null);
        setFilePreview(null);
        setCaption('');
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
              Event Retrospective Galleries
            </h2>
            <p className="text-xs text-gray-500">
              Upload event retrospective photography (up to 5MB per photo). Photos are displayed on the public event page.
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
      </div>

      {isLoadingEvents ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
          <p className="font-serif text-base font-bold text-gray-700">No events found in database</p>
          <p className="text-xs text-gray-500">Create an event under Events Management before adding gallery photos.</p>
        </div>
      ) : (
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
                  Caption / Description (Optional)
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
                        alt={img.caption || 'Event photograph'}
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

                    <div className="p-2.5 bg-white border-t border-gray-100">
                      <p className="text-[11px] text-gray-700 truncate font-medium">
                        {img.caption || 'Untitled photo'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
