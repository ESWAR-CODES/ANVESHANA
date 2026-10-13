import React, { useState, useEffect } from 'react';
import { teamService } from '../../services/teamService';
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
    id: 'leads',
    name: 'Team Leads',
    description: 'Executive guidance, cross-department alignment, and faculty relations.',
    members: [
      {
        name: 'Club President',
        designation: 'Overall Lead',
        department: 'School of Computing',
        bio: 'Passionate about distributed systems and empowering student-led engineering.',
      },
      {
        name: 'Vice President',
        designation: 'Operations Lead',
        department: 'School of Engineering',
        bio: 'Focusing on IoT, embedded devices, and cross-campus event execution.',
      },
    ],
  },
  {
    id: 'tech',
    name: 'Technical Team',
    description: 'Software development, website architecture, and hackathon technical platforms.',
    members: [
      {
        name: 'Technical Secretary',
        designation: 'Full Stack Architect',
        department: 'School of Computing',
        bio: 'Architecting scalable web applications and open source tools for student cohorts.',
      },
    ],
  },
  {
    id: 'design',
    name: 'Design Team',
    description: 'Visual branding, UI/UX design, motion graphics, and print media.',
    members: [
      {
        name: 'Design Lead',
        designation: 'UI/UX Specialist',
        department: 'School of Computing',
        bio: 'Crafting editorial web design and cinematic visual collateral for MBU students.',
      },
    ],
  },
  {
    id: 'data',
    name: 'Data Management',
    description: 'Event registration databases, attendee verification, and analytics.',
    members: [
      {
        name: 'Data Lead',
        designation: 'Database Administrator',
        department: 'School of Computing',
        bio: 'Managing registration pipelines, automated exports, and participation statistics.',
      },
    ],
  },
  {
    id: 'infra',
    name: 'Infrastructure Team',
    description: 'Event venues, hardware workbenches, networking, and lab logistics.',
    members: [
      {
        name: 'Infra Lead',
        designation: 'Hardware & Logistics Lead',
        department: 'School of Engineering',
        bio: 'Coordinating high-power lab spaces, hardware development kits, and event audio-visual setups.',
      },
    ],
  },
  {
    id: 'social',
    name: 'Social Media Team',
    description: 'Digital storytelling, campus engagement, and creative announcements.',
    members: [
      {
        name: 'Social Lead',
        designation: 'Community Manager',
        department: 'School of Computing',
        bio: 'Amplifying student achievements and managing Anveshana broadcast channels.',
      },
    ],
  },
  {
    id: 'pr',
    name: 'Public Relations (PR)',
    description: 'Student outreach, inter-college partnerships, and sponsor relations.',
    members: [
      {
        name: 'PR Secretary',
        designation: 'Institutional Liaison',
        department: 'School of Engineering',
        bio: 'Building relationships across MBU departments and organizing campus outreach.',
      },
    ],
  },
];

export const TeamPage: React.FC = () => {
  const [categories, setCategories] = useState<DisplayCategory[]>(FALLBACK_CATEGORIES);
  const [openCategory, setOpenCategory] = useState<string>('leads');
  const [isLoading, setIsLoading] = useState(false);

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
          if (transformed.length > 0) {
            setOpenCategory(transformed[0].id);
          }
        }
      } catch {
        // Fall back gracefully to preset categories if offline or unseeded
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTeam();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleCategory = (id: string) => {
    setOpenCategory(openCategory === id ? '' : id);
  };

  return (
    <div className="py-28 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#F5A623] bg-[#0B132B] px-3 py-1 rounded-full">
          Leadership & Wings
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B132B] mt-4 mb-3">
          Core Team Directory
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Meet the dedicated students across the 7 specialized wings driving Anveshana Club at Mohan Babu University.
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-6 text-xs text-gray-500">
          Syncing team directory...
        </div>
      )}

      {/* 7 Category Accordion List */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {categories.map((cat) => {
          const isOpen = openCategory === cat.id;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F5A623]"
                aria-expanded={isOpen}
              >
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0B132B]">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                </div>

                <div
                  className={`w-8 h-8 rounded-full bg-[#1C2541]/5 text-[#0B132B] flex items-center justify-center transition-transform duration-200 shrink-0 ml-4 ${
                    isOpen ? 'rotate-180 bg-[#F5A623]/20 text-[#0B132B]' : ''
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-[#FDFBF7]/50">
                  {cat.members.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">
                      Roster for {cat.name} is currently being updated by club administration.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {cat.members.map((member, idx) => (
                        <div
                          key={member.id || idx}
                          className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs flex items-start gap-4"
                        >
                          {/* Photo or Monogram Avatar Fallback */}
                          {member.profileMedia?.url ? (
                            <img
                              src={member.profileMedia.url}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-[#F5A623] shrink-0 shadow-inner"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#0B132B] border-2 border-[#F5A623] text-[#F5A623] font-serif font-bold text-lg flex items-center justify-center shrink-0 shadow-inner">
                              {member.name.charAt(0)}
                            </div>
                          )}

                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="font-serif font-bold text-sm text-[#0B132B] truncate">
                              {member.name}
                            </h4>
                            <p className="text-xs font-medium text-[#F5A623] truncate">
                              {member.designation}
                            </p>
                            {member.department && (
                              <p className="text-[11px] text-gray-500 truncate">{member.department}</p>
                            )}
                            {member.bio && (
                              <p className="text-xs text-gray-600 pt-1 leading-relaxed line-clamp-3">
                                {member.bio}
                              </p>
                            )}

                            {/* Social / Portfolio Links */}
                            <div className="flex items-center gap-3 pt-2">
                              {member.linkedinUrl && (
                                <a
                                  href={member.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="LinkedIn Profile"
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
                                  className="text-gray-400 hover:text-[#0B132B] transition-colors"
                                  title="GitHub Profile"
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
                                  className="text-gray-400 hover:text-[#F5A623] transition-colors"
                                  title="Portfolio Website"
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
