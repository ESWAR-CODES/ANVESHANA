import React, { useState, useEffect } from 'react';
import { teamService } from '../../services/teamService';
import { settingsService } from '../../services/settingsService';
import type { PublicTeamCategoryGroup, TeamMember } from '../../types/team';

interface DisplayCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  members: Array<{
    id?: string;
    name: string;
    designation: string;
    department?: string;
    bio?: string | null;
    profileMedia?: { url: string; publicId: string } | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
  }>;
}

const FALLBACK_CATEGORIES: DisplayCategory[] = [
  {
    id: 'team-leads',
    name: 'Team Leads',
    slug: 'team-leads',
    description: 'Executive student leadership guiding club vision, strategy, cross-department coordination, and university liaison.',
    members: [
      {
        name: 'Club President',
        designation: 'President & Overall Lead',
        department: 'School of Computing',
        bio: 'Passionate about distributed systems, student innovation, and engineering leadership at Mohan Babu University.',
      },
      {
        name: 'Vice President',
        designation: 'Vice President & Operations',
        department: 'School of Engineering',
        bio: 'Focusing on IoT, embedded platforms, hackathon execution, and cross-campus coordination.',
      },
    ],
  },
  {
    id: 'champions',
    name: 'Champions',
    slug: 'champions',
    description: 'Specialist leads and contributors driving technical innovation, design, events, infrastructure, public relations, and club initiatives.',
    members: [
      {
        name: 'Technical Champion',
        designation: 'Full Stack & DevOps Lead',
        department: 'School of Computing',
        bio: 'Architecting high-scale web platforms, automated data pipelines, and developer tooling for university cohorts.',
      },
      {
        name: 'Creative Champion',
        designation: 'UI/UX & Design Lead',
        department: 'School of Computing',
        bio: 'Crafting editorial visual branding, digital campaigns, and intuitive interfaces for campus initiatives.',
      },
      {
        name: 'Outreach Champion',
        designation: 'Public Relations & Events Lead',
        department: 'School of Engineering',
        bio: 'Facilitating student outreach, industry liaisons, and engaging campus workshops.',
      },
    ],
  },
];

export const TeamPage: React.FC = () => {
  const [categories, setCategories] = useState<DisplayCategory[]>(FALLBACK_CATEGORIES);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [headerContent, setHeaderContent] = useState({
    eyebrow: 'Leadership & Champions',
    title: 'Core Team Directory',
    description: 'Meet the executive leads and specialized champions driving innovation at Anveshana Club, Mohan Babu University.',
  });

  useEffect(() => {
    let isMounted = true;
    settingsService
      .getPublicSettings()
      .then((res) => {
        if (isMounted && res.success && res.data?.pagesContent?.team) {
          setHeaderContent({
            eyebrow: res.data.pagesContent.team.eyebrow || 'Leadership & Champions',
            title: res.data.pagesContent.team.title || 'Core Team Directory',
            description:
              res.data.pagesContent.team.description ||
              'Meet the executive leads and specialized champions driving innovation at Anveshana Club, Mohan Babu University.',
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTeam = async () => {
      setIsLoading(true);
      try {
        const res = await teamService.getPublicTeam();
        if (isMounted && res.success && res.data && res.data.categories?.length > 0) {
          const transformed: DisplayCategory[] = res.data.categories.map((c: PublicTeamCategoryGroup) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || undefined,
            members: c.members.map((m: TeamMember) => ({
              id: m.id || m._id,
              name: m.name,
              designation: m.designation,
              bio: m.biography,
              profileMedia: m.profileMedia,
              linkedinUrl: m.linkedinUrl,
              githubUrl: m.githubUrl,
              portfolioUrl: m.portfolioUrl,
            })),
          }));

          setCategories(transformed);
        }
      } catch {
        // Fall back gracefully to preset categories
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTeam();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedCategories =
    activeCategoryFilter === 'all'
      ? categories
      : categories.filter((c) => c.id === activeCategoryFilter || c.slug === activeCategoryFilter);

  const totalMembersCount = categories.reduce((acc, cat) => acc + cat.members.length, 0);

  return (
    <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3.5 py-1 rounded-full shadow-inner">
          {headerContent.eyebrow}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B132B] mt-4 mb-3">
          {headerContent.title}
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          {headerContent.description}
        </p>
      </div>

      {/* 2-Category Tab Switcher Strip */}
      <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
            activeCategoryFilter === 'all'
              ? 'bg-[#0B132B] text-[#F5A623] shadow-md'
              : 'bg-white text-gray-600 hover:text-[#0B132B] border border-gray-200'
          }`}
        >
          All Members ({totalMembersCount})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategoryFilter(cat.id)}
            className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeCategoryFilter === cat.id
                ? 'bg-[#0B132B] text-[#F5A623] shadow-md'
                : 'bg-white text-gray-600 hover:text-[#0B132B] border border-gray-200'
            }`}
          >
            {cat.name} ({cat.members.length})
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-4 text-xs text-gray-500 animate-pulse">
          Synchronizing core team directory...
        </div>
      )}

      {/* Categories & 4:5 Portrait Profile Cards */}
      <div className="space-y-16">
        {displayedCategories.map((cat) => (
          <section key={cat.id} className="space-y-6">
            {/* Category Header */}
            <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#F5A623]"></span>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[#F5A623] font-mono">
                    Wing
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B132B]">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs text-gray-500 max-w-2xl mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>
              <span className="text-xs font-mono text-gray-400">
                {cat.members.length} {cat.members.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            {/* 4:5 Portrait Profile Cards Grid */}
            {cat.members.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center space-y-2">
                <p className="font-serif text-base font-bold text-[#0B132B]">
                  Roster In Preparation
                </p>
                <p className="text-xs text-gray-500">
                  Members for {cat.name} are currently being onboarded by club administrators.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {cat.members.map((member, idx) => (
                  <div
                    key={member.id || idx}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs hover:shadow-xl hover:border-[#F5A623]/60 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* 4:5 Portrait Image Container */}
                    <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#253257] overflow-hidden">
                      {member.profileMedia?.url ? (
                        <img
                          src={member.profileMedia.url}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-20 h-20 rounded-full bg-[#1C2541] border-2 border-[#F5A623] text-[#F5A623] font-serif font-bold text-3xl flex items-center justify-center shadow-inner">
                            {member.name.charAt(0)}
                          </div>
                          <p className="text-[10px] font-mono text-[#F5A623]/80 mt-3 uppercase tracking-widest">
                            Anveshana Club
                          </p>
                        </div>
                      )}

                      {/* Gradient Vignette at Bottom of Photo */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B132B]/85 to-transparent pointer-events-none" />

                      {/* Wing Tag Overlay */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#0B132B]/85 text-[#F5A623] border border-[#F5A623]/30 backdrop-blur-xs">
                          {cat.name}
                        </span>
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between bg-white space-y-3">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-[#0B132B] group-hover:text-[#F5A623] transition-colors line-clamp-1">
                          {member.name}
                        </h3>
                        <p className="text-xs font-semibold text-[#F5A623] mt-0.5 line-clamp-1">
                          {member.designation}
                        </p>
                        {member.department && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {member.department}
                          </p>
                        )}
                        {member.bio && (
                          <p className="text-xs text-gray-600 pt-2 leading-relaxed line-clamp-3">
                            {member.bio}
                          </p>
                        )}
                      </div>

                      {/* Social & Portfolio Links Strip */}
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors border border-gray-200"
                            title="LinkedIn Profile"
                            aria-label={`${member.name} LinkedIn`}
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                          </a>
                        )}
                        {member.githubUrl && (
                          <a
                            href={member.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-[#0B132B]/10 text-gray-400 hover:text-[#0B132B] flex items-center justify-center transition-colors border border-gray-200"
                            title="GitHub Profile"
                            aria-label={`${member.name} GitHub`}
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                          </a>
                        )}
                        {member.portfolioUrl && (
                          <a
                            href={member.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-[#F5A623]/20 text-gray-400 hover:text-[#d98f16] flex items-center justify-center transition-colors border border-gray-200"
                            title="Portfolio Website"
                            aria-label={`${member.name} Portfolio`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
