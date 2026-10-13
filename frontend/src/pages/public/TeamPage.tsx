import React, { useState } from 'react';

export const TeamPage: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<string>('leads');

  const categories = [
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
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {cat.members.map((member, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs flex items-start gap-4"
                      >
                        {/* Monogram Avatar Fallback */}
                        <div className="w-12 h-12 rounded-full bg-[#0B132B] border-2 border-[#F5A623] text-[#F5A623] font-serif font-bold text-lg flex items-center justify-center shrink-0 shadow-inner">
                          {member.name.charAt(0)}
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-serif font-bold text-sm text-[#0B132B]">
                            {member.name}
                          </h4>
                          <p className="text-xs font-medium text-[#F5A623]">
                            {member.designation}
                          </p>
                          <p className="text-[11px] text-gray-500">{member.department}</p>
                          <p className="text-xs text-gray-600 pt-1 leading-relaxed">
                            {member.bio}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
