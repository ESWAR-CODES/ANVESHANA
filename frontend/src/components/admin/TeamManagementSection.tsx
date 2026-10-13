import React, { useState, useEffect } from 'react';
import { teamService } from '../../services/teamService';
import type { TeamCategory, TeamMember } from '../../types/team';
import { Button } from '../common/Button';

export const TeamManagementSection: React.FC = () => {
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal create/edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalDesignation, setModalDesignation] = useState('');
  const [modalCategoryId, setModalCategoryId] = useState('');
  const [modalBio, setModalBio] = useState('');
  const [modalLinkedin, setModalLinkedin] = useState('');
  const [modalGithub, setModalGithub] = useState('');
  const [modalPortfolio, setModalPortfolio] = useState('');
  const [modalDisplayOrder, setModalDisplayOrder] = useState<number>(0);
  const [modalIsPublished, setModalIsPublished] = useState(true);
  const [modalPhotoFile, setModalPhotoFile] = useState<File | null>(null);
  const [modalPhotoPreview, setModalPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Soft-delete state
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategoriesAndMembers = async () => {
    setIsLoading(true);
    try {
      const [catRes, memRes] = await Promise.all([
        teamService.getAdminCategories(),
        teamService.getAdminMembers({ limit: 100 }),
      ]);

      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
      if (memRes.success && memRes.data) {
        setMembers(memRes.data.members || []);
      }
    } catch (err: any) {
      setNotification({
        text: err.response?.status === 503
          ? 'Database service is offline. Please configure MongoDB Atlas.'
          : 'Failed to retrieve team members.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndMembers();
  }, []);

  const openCreateModal = () => {
    setEditingMember(null);
    setModalName('');
    setModalDesignation('');
    setModalCategoryId(categories.length > 0 ? categories[0]._id : '');
    setModalBio('');
    setModalLinkedin('');
    setModalGithub('');
    setModalPortfolio('');
    setModalDisplayOrder(0);
    setModalIsPublished(true);
    setModalPhotoFile(null);
    setModalPhotoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setModalName(member.name);
    setModalDesignation(member.designation);
    const catId = typeof member.categoryId === 'object' ? (member.categoryId as any)._id : member.categoryId;
    setModalCategoryId(catId || (categories.length > 0 ? categories[0]._id : ''));
    setModalBio(member.biography || '');
    setModalLinkedin(member.linkedinUrl || '');
    setModalGithub(member.githubUrl || '');
    setModalPortfolio(member.portfolioUrl || '');
    setModalDisplayOrder(member.displayOrder || 0);
    setModalIsPublished(member.isPublished);
    setModalPhotoFile(null);
    setModalPhotoPreview(member.profileMedia?.url || null);
    setIsModalOpen(true);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setNotification({ text: 'Profile photo cannot exceed the 2MB limit.', type: 'error' });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotification({ text: 'Only JPEG, PNG, or WebP images are allowed.', type: 'error' });
      return;
    }

    setModalPhotoFile(file);
    setModalPhotoPreview(URL.createObjectURL(file));
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim() || !modalDesignation.trim() || !modalCategoryId) {
      setNotification({ text: 'Name, designation, and category are required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const formData = new FormData();
    formData.append('name', modalName.trim());
    formData.append('designation', modalDesignation.trim());
    formData.append('categoryId', modalCategoryId);
    if (modalBio.trim()) formData.append('biography', modalBio.trim());
    if (modalLinkedin.trim()) formData.append('linkedinUrl', modalLinkedin.trim());
    if (modalGithub.trim()) formData.append('githubUrl', modalGithub.trim());
    if (modalPortfolio.trim()) formData.append('portfolioUrl', modalPortfolio.trim());
    formData.append('displayOrder', String(modalDisplayOrder));
    formData.append('isPublished', String(modalIsPublished));
    if (modalPhotoFile) {
      formData.append('profileImage', modalPhotoFile);
    }

    try {
      if (editingMember) {
        const res = await teamService.updateMember(editingMember._id, formData);
        if (res.success) {
          setNotification({ text: `Updated "${modalName}".`, type: 'success' });
          setIsModalOpen(false);
          fetchCategoriesAndMembers();
        } else {
          setNotification({ text: res.error || 'Failed to update member.', type: 'error' });
        }
      } else {
        const res = await teamService.createMember(formData);
        if (res.success) {
          setNotification({ text: `Created team profile for "${modalName}".`, type: 'success' });
          setIsModalOpen(false);
          fetchCategoriesAndMembers();
        } else {
          setNotification({ text: res.error || 'Failed to create member.', type: 'error' });
        }
      }
    } catch (err: any) {
      setNotification({ text: err.response?.data?.error || 'Failed to save member profile.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (member: TeamMember) => {
    try {
      const res = await teamService.togglePublishMember(member._id);
      if (res.success) {
        setNotification({
          text: `"${member.name}" is now ${res.data?.isPublished ? 'published' : 'hidden'}.`,
          type: 'success',
        });
        fetchCategoriesAndMembers();
      }
    } catch (err: any) {
      setNotification({ text: err.response?.data?.error || 'Failed to toggle publication.', type: 'error' });
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await teamService.deleteMember(deleteTarget._id);
      if (res.success) {
        setNotification({ text: `Soft-archived profile for "${deleteTarget.name}".`, type: 'success' });
        setDeleteTarget(null);
        fetchCategoriesAndMembers();
      } else {
        setNotification({ text: res.error || 'Failed to delete member.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ text: err.response?.data?.error || 'Failed to delete member.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter members by category and search
  const filteredMembers = members.filter((m) => {
    const memberCatId = typeof m.categoryId === 'object' ? (m.categoryId as any)._id : m.categoryId;
    const matchesCategory = activeCategoryFilter === 'all' || memberCatId === activeCategoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
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

      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#0B132B]">
              Core Team Management
            </h2>
            <p className="text-xs text-gray-500">
              Manage student leadership profiles across the 7 predefined university club categories.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#0B132B]"
            />
            <Button variant="outline" size="sm" onClick={fetchCategoriesAndMembers}>
              ↻ Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              + Add Member
            </Button>
          </div>
        </div>

        {/* 7 Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-gray-100 pt-3">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-[#0B132B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 bg-gray-100'
            }`}
          >
            All Wings ({members.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategoryFilter(cat._id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategoryFilter === cat._id
                  ? 'bg-[#0B132B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading team directory...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
          <p className="font-serif text-base font-bold text-gray-700">No team members found</p>
          <p className="text-xs text-gray-500">
            Click "+ Add Member" to add a student leader to this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((m) => {
            const catName =
              typeof m.categoryId === 'object'
                ? (m.categoryId as any).name
                : categories.find((c) => c._id === m.categoryId)?.name || 'General';

            return (
              <div
                key={m._id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Profile Photo with Fallback Monogram */}
                  {m.profileMedia?.url ? (
                    <img
                      src={m.profileMedia.url}
                      alt={m.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#F5A623] shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#0B132B] text-[#F5A623] font-serif font-bold text-xl flex items-center justify-center shrink-0 border-2 border-[#F5A623]">
                      {m.name.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">
                        {catName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                          m.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {m.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-sm text-[#0B132B] truncate">{m.name}</h3>
                    <p className="text-xs font-semibold text-[#F5A623] truncate">{m.designation}</p>
                  </div>
                </div>

                {m.biography && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    "{m.biography}"
                  </p>
                )}

                {/* Social links indicators */}
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  {m.linkedinUrl && <span className="text-blue-600 font-semibold">LinkedIn ✓</span>}
                  {m.githubUrl && <span className="text-gray-700 font-semibold">GitHub ✓</span>}
                  {m.portfolioUrl && <span className="text-emerald-600 font-semibold">Portfolio ✓</span>}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(m)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-[#F5A623] hover:text-[#0B132B] rounded text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTogglePublish(m)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-600 transition-colors cursor-pointer"
                    >
                      {m.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>

                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    Archive
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif text-base font-bold text-[#0B132B]">
                {editingMember ? `Edit "${editingMember.name}"` : 'Add Core Team Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalDesignation}
                    onChange={(e) => setModalDesignation(e.target.value)}
                    placeholder="e.g. Technical Lead"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Team Category (Predefined Wing) *
                </label>
                <select
                  required
                  value={modalCategoryId}
                  onChange={(e) => setModalCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F5A623]"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Assigned strictly to one of the 7 predefined categories per specification rules.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Biography (Max 300 characters)
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={modalBio}
                  onChange={(e) => setModalBio(e.target.value)}
                  placeholder="Short bio describing expertise and contributions..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              {/* Profile Photo (2 MB Limit) */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Profile Photo (Max 2MB)
                </label>
                <div className="flex items-center gap-3">
                  {modalPhotoPreview && (
                    <img
                      src={modalPhotoPreview}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoFileChange}
                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0B132B] file:text-white hover:file:bg-[#F5A623] hover:file:text-[#0B132B] file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">LinkedIn URL</label>
                  <input
                    type="url"
                    value={modalLinkedin}
                    onChange={(e) => setModalLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">GitHub URL</label>
                  <input
                    type="url"
                    value={modalGithub}
                    onChange={(e) => setModalGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Portfolio URL</label>
                  <input
                    type="url"
                    value={modalPortfolio}
                    onChange={(e) => setModalPortfolio(e.target.value)}
                    placeholder="https://portfolio.dev/..."
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalIsPublished}
                    onChange={(e) => setModalIsPublished(e.target.checked)}
                    className="rounded text-[#F5A623] focus:ring-[#F5A623]"
                  />
                  <span className="font-semibold text-gray-700 text-xs">Publish on public Team page</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                    {editingMember ? 'Save Changes' : 'Create Profile'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft-Archive Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B132B]">
                Archive "{deleteTarget.name}"?
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                This will soft-archive the member profile (marking <code>isDeleted: true</code>). The profile will be removed from the public directory while maintaining historical records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmSoftDelete} isLoading={isDeleting}>
                Confirm Archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
