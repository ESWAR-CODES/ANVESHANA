import { Request, Response } from 'express';
import { ClubSettings } from '../models/ClubSettings';
import { getDbStatus } from '../config/db';
import { uploadImageBuffer, deleteCloudinaryImage } from '../config/cloudinary';

export const DEFAULT_CLUB_SETTINGS = {
  clubName: 'Anveshana Club',
  universityName: 'Mohan Babu University',
  tagline: 'Explore · Build · Bring Ideas to Life.',
  mission:
    'A central university club uniting students from the School of Computing and the School of Engineering to foster innovation and cross-disciplinary collaboration.',
  contactEmail: 'anveshana@mbu.edu.in',
  contactPhone: '+91 877 223 6711',
  campusLocation: 'Sree Sainath Nagar, Tirupati, Andhra Pradesh - 517102',
  affiliatedSchools: 'School of Computing & School of Engineering',
  socialLinks: {
    instagram: 'https://instagram.com/anveshana_mbu',
    linkedin: 'https://linkedin.com/company/anveshana-mbu',
    github: 'https://github.com/anveshana-mbu',
    twitter: null,
    youtube: null,
  },
  logos: {
    clubLogo: null,
    universityLogo: null,
  },
  hero: {
    eyebrow: 'Mohan Babu University · Tirupati',
    title: 'ANVESHANA',
    tagline: 'Explore · Build · Bring Ideas to Life.',
    description:
      'The premier central student club uniting the School of Computing and the School of Engineering. Fostering multidisciplinary hackathons, technological breakthroughs, and engineering leadership.',
    primaryCtaText: 'Explore Events',
    primaryCtaLink: '/events',
    secondaryCtaText: 'Meet the Core Team',
    secondaryCtaLink: '/team',
    backgroundImage: null,
  },
  stats: [
    { value: '2', label: 'Premier Schools', description: 'Computing & Engineering' },
    { value: '7', label: 'Core Wings', description: 'Cross-functional operations' },
    { value: '100%', label: 'Hands-On Practice', description: 'Workshops & projects' },
    { value: 'Open', label: 'Student Access', description: 'Frictionless participation' },
  ],
  about: {
    eyebrow: 'Our Central Mission',
    heading: 'Bridging Computing and Engineering.',
    description:
      'At Mohan Babu University, innovation does not happen in silos. Anveshana acts as the central catalyst connecting coders, makers, researchers, and designers across disciplines.',
    subDescription:
      'Whether you are optimizing cloud infrastructure, soldering embedded sensors, or designing intuitive user experiences, Anveshana is your playground to explore ideas and bring them to life.',
    calloutTitle: 'Frictionless Student Access',
    calloutText:
      'No accounts or login barriers required. Every student at MBU has immediate access to discover upcoming events, explore team leads, view hackathon galleries, and register natively.',
    pillars: [
      {
        title: 'Curiosity & Discovery',
        description:
          'Encouraging students to question conventional patterns, explore modern tech stacks, and investigate emerging challenges in computing.',
      },
      {
        title: 'Engineering Rigor',
        description:
          'Bridging high-level software architectures with low-level systems engineering, IoT, and embedded technologies from the School of Engineering.',
      },
      {
        title: 'Real-World Prototyping',
        description:
          'Moving beyond theoretical lectures into production code, tangible hardware prototypes, and deployed student-led applications.',
      },
      {
        title: 'Peer Collaboration',
        description:
          'A vibrant community of designers, backend engineers, systems architects, and project leads working together with zero hierarchy.',
      },
    ],
  },
  homeEventsSection: {
    eyebrow: 'Explore Opportunities',
    heading: 'Upcoming Events & Hackathons',
    description:
      'Discover workshops, hackathons, and symposiums hosted on campus. Native registration opens prior to each event.',
    ctaText: 'View Full Event Catalog →',
  },
  homeCtaSection: {
    eyebrow: 'Mohan Babu University Community',
    heading: 'Ready to Build Your Next Breakthrough?',
    description:
      'Whether you want to lead an engineering team, compete in a national hackathon, or provide event feedback, Anveshana is here for you.',
    primaryCtaText: 'Browse All Events',
    primaryCtaLink: '/events',
    secondaryCtaText: 'Share Your Feedback',
    secondaryCtaLink: '/feedback',
  },
  navbar: {
    links: [
      { name: 'Home', path: '/', isVisible: true },
      { name: 'Events', path: '/events', isVisible: true },
      { name: 'Team', path: '/team', isVisible: true },
      { name: 'Feedback', path: '/feedback', isVisible: true },
    ],
    ctaText: 'Explore Events',
    ctaLink: '/events',
  },
  footer: {
    aboutText:
      'The premier central university club bridging students from the School of Computing and the School of Engineering. We foster hands-on engineering, collaborative hackathons, and technical innovation.',
    copyrightText: '© Anveshana Club · Mohan Babu University. All rights reserved.',
  },
  pagesContent: {
    events: {
      eyebrow: 'Events & Opportunities',
      title: 'Our Events',
      description:
        'Explore, Learn, Participate and Be a Part of Amazing Events bridging computing innovation and engineering leadership at Mohan Babu University.',
    },
    team: {
      eyebrow: 'Leadership & Wings',
      title: 'Core Team Directory',
      description:
        'Meet the dedicated students across the 7 specialized wings driving Anveshana Club at Mohan Babu University.',
    },
    feedback: {
      eyebrow: 'Community Voices & Rating',
      title: 'Feedback & Contact',
      description:
        'Share your experiences, recommend topics, or reach out to our campus desk.',
      privacyNotice:
        'Submissions do not require student login. Verified reviews are moderated before being aggregated into public ratings.',
    },
  },
  isSingleton: true,
};

// Helper: validate HTTP/HTTPS URLs
const isValidHttpUrl = (val: string): boolean => {
  try {
    const parsed = new URL(val);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Public: Retrieve club contact details and public CMS metadata.
 * GET /api/v1/settings
 * Safe fail-safe: Returns approved defaults if document missing or database offline.
 */
export const getPublicSettings = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();

  // If database is offline, return safe default settings per specification
  if (!dbStatus.connected) {
    res.status(200).json({
      success: true,
      data: DEFAULT_CLUB_SETTINGS,
      message: 'Default settings loaded (database offline).',
      error: null,
    });
    return;
  }

  try {
    const settings = await ClubSettings.findOne({ isSingleton: true }).lean();
    if (!settings) {
      res.status(200).json({
        success: true,
        data: DEFAULT_CLUB_SETTINGS,
        error: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        clubName: settings.clubName || DEFAULT_CLUB_SETTINGS.clubName,
        universityName: settings.universityName || DEFAULT_CLUB_SETTINGS.universityName,
        tagline: settings.tagline || DEFAULT_CLUB_SETTINGS.tagline,
        mission: settings.mission || DEFAULT_CLUB_SETTINGS.mission,
        contactEmail: settings.contactEmail || DEFAULT_CLUB_SETTINGS.contactEmail,
        contactPhone: settings.contactPhone || DEFAULT_CLUB_SETTINGS.contactPhone,
        campusLocation: settings.campusLocation || DEFAULT_CLUB_SETTINGS.campusLocation,
        affiliatedSchools: settings.affiliatedSchools || DEFAULT_CLUB_SETTINGS.affiliatedSchools,
        socialLinks: settings.socialLinks || DEFAULT_CLUB_SETTINGS.socialLinks,
        logos: settings.logos || DEFAULT_CLUB_SETTINGS.logos,
        hero: settings.hero || DEFAULT_CLUB_SETTINGS.hero,
        stats: settings.stats || DEFAULT_CLUB_SETTINGS.stats,
        about: settings.about || DEFAULT_CLUB_SETTINGS.about,
        homeEventsSection: settings.homeEventsSection || DEFAULT_CLUB_SETTINGS.homeEventsSection,
        homeCtaSection: settings.homeCtaSection || DEFAULT_CLUB_SETTINGS.homeCtaSection,
        navbar: settings.navbar || DEFAULT_CLUB_SETTINGS.navbar,
        footer: settings.footer || DEFAULT_CLUB_SETTINGS.footer,
        pagesContent: settings.pagesContent || DEFAULT_CLUB_SETTINGS.pagesContent,
        isSingleton: true,
      },
      error: null,
    });
  } catch (error) {
    // Fail safe to default settings
    res.status(200).json({
      success: true,
      data: DEFAULT_CLUB_SETTINGS,
      error: null,
    });
  }
};

/**
 * Admin: Retrieve full club settings singleton for administrative CMS editor.
 * GET /api/v1/admin/settings
 */
export const getAdminSettings = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    let settings = await ClubSettings.findOne({ isSingleton: true }).lean();
    if (!settings) {
      // Initialize singleton
      const created = await ClubSettings.create({
        ...DEFAULT_CLUB_SETTINGS,
      });
      settings = created.toObject();
    }

    res.status(200).json({
      success: true,
      data: settings,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve administrative settings.',
    });
  }
};

/**
 * Admin: Update approved club settings fields only.
 * PUT /api/v1/admin/settings
 * 
 * Strict Whitelist Security:
 * Explicitly ignores/disallows changes to database ids, admin accounts, or non-whitelisted objects.
 */
export const updateAdminSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clubName,
      universityName,
      tagline,
      mission,
      contactEmail,
      contactPhone,
      campusLocation,
      affiliatedSchools,
      socialLinks,
      hero,
      stats,
      about,
      homeEventsSection,
      homeCtaSection,
      navbar,
      footer,
      pagesContent,
      logos,
    } = req.body;

    const updatePayload: Record<string, any> = {};

    // 1. Basic text fields
    if (clubName !== undefined) {
      if (typeof clubName !== 'string' || !clubName.trim()) {
        res.status(400).json({ success: false, data: null, error: 'Club name cannot be empty.' });
        return;
      }
      updatePayload.clubName = clubName.trim();
    }

    if (universityName !== undefined) {
      updatePayload.universityName = typeof universityName === 'string' ? universityName.trim() : DEFAULT_CLUB_SETTINGS.universityName;
    }

    if (tagline !== undefined) {
      updatePayload.tagline = typeof tagline === 'string' ? tagline.trim() : DEFAULT_CLUB_SETTINGS.tagline;
    }

    if (mission !== undefined) {
      updatePayload.mission = typeof mission === 'string' ? mission.trim() : DEFAULT_CLUB_SETTINGS.mission;
    }

    // 2. Validate and whitelist contactEmail
    if (contactEmail !== undefined) {
      if (typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Valid contact email is required.',
        });
        return;
      }
      updatePayload.contactEmail = contactEmail.trim().toLowerCase();
    }

    // 3. Contact phone, campus location, affiliated schools
    if (contactPhone !== undefined) {
      updatePayload.contactPhone = typeof contactPhone === 'string' && contactPhone.trim() ? contactPhone.trim() : null;
    }

    if (campusLocation !== undefined) {
      updatePayload.campusLocation = typeof campusLocation === 'string' ? campusLocation.trim() : DEFAULT_CLUB_SETTINGS.campusLocation;
    }

    if (affiliatedSchools !== undefined) {
      updatePayload.affiliatedSchools = typeof affiliatedSchools === 'string' ? affiliatedSchools.trim() : DEFAULT_CLUB_SETTINGS.affiliatedSchools;
    }

    // 4. Social Links validation
    if (socialLinks !== undefined) {
      if (typeof socialLinks !== 'object' || socialLinks === null) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Social links must be an object with supported platforms.',
        });
        return;
      }

      for (const [platform, url] of Object.entries(socialLinks)) {
        if (typeof url === 'string' && url.trim()) {
          if (!isValidHttpUrl(url.trim())) {
            res.status(400).json({
              success: false,
              data: null,
              error: `Social link for ${platform} must be a valid HTTP or HTTPS URL.`,
            });
            return;
          }
        }
      }

      updatePayload.socialLinks = {
        instagram: typeof socialLinks.instagram === 'string' && socialLinks.instagram.trim() ? socialLinks.instagram.trim() : null,
        linkedin: typeof socialLinks.linkedin === 'string' && socialLinks.linkedin.trim() ? socialLinks.linkedin.trim() : null,
        github: typeof socialLinks.github === 'string' && socialLinks.github.trim() ? socialLinks.github.trim() : null,
        twitter: typeof socialLinks.twitter === 'string' && socialLinks.twitter.trim() ? socialLinks.twitter.trim() : null,
        youtube: typeof socialLinks.youtube === 'string' && socialLinks.youtube.trim() ? socialLinks.youtube.trim() : null,
      };
    }

    // 5. Hero section (uses dot-notation to preserve hero.backgroundImage)
    if (hero !== undefined && typeof hero === 'object' && hero !== null) {
      if (hero.eyebrow !== undefined) {
        updatePayload['hero.eyebrow'] = typeof hero.eyebrow === 'string' ? hero.eyebrow.trim() : DEFAULT_CLUB_SETTINGS.hero.eyebrow;
      }
      if (hero.title !== undefined) {
        updatePayload['hero.title'] = typeof hero.title === 'string' && hero.title.trim() ? hero.title.trim() : DEFAULT_CLUB_SETTINGS.hero.title;
      }
      if (hero.tagline !== undefined) {
        updatePayload['hero.tagline'] = typeof hero.tagline === 'string' ? hero.tagline.trim() : DEFAULT_CLUB_SETTINGS.hero.tagline;
      }
      if (hero.description !== undefined) {
        updatePayload['hero.description'] = typeof hero.description === 'string' ? hero.description.trim() : DEFAULT_CLUB_SETTINGS.hero.description;
      }
      if (hero.primaryCtaText !== undefined) {
        updatePayload['hero.primaryCtaText'] = typeof hero.primaryCtaText === 'string' ? hero.primaryCtaText.trim() : DEFAULT_CLUB_SETTINGS.hero.primaryCtaText;
      }
      if (hero.primaryCtaLink !== undefined) {
        updatePayload['hero.primaryCtaLink'] = typeof hero.primaryCtaLink === 'string' ? hero.primaryCtaLink.trim() : DEFAULT_CLUB_SETTINGS.hero.primaryCtaLink;
      }
      if (hero.secondaryCtaText !== undefined) {
        updatePayload['hero.secondaryCtaText'] = typeof hero.secondaryCtaText === 'string' ? hero.secondaryCtaText.trim() : DEFAULT_CLUB_SETTINGS.hero.secondaryCtaText;
      }
      if (hero.secondaryCtaLink !== undefined) {
        updatePayload['hero.secondaryCtaLink'] = typeof hero.secondaryCtaLink === 'string' ? hero.secondaryCtaLink.trim() : DEFAULT_CLUB_SETTINGS.hero.secondaryCtaLink;
      }
      if (hero.backgroundImage !== undefined) {
        updatePayload['hero.backgroundImage'] = hero.backgroundImage;
      }
    }

    // 6. Stats section
    if (stats !== undefined) {
      if (Array.isArray(stats)) {
        updatePayload.stats = stats.map((s: any) => ({
          value: typeof s.value === 'string' ? s.value.trim() : String(s.value || ''),
          label: typeof s.label === 'string' ? s.label.trim() : String(s.label || ''),
          description: typeof s.description === 'string' ? s.description.trim() : '',
        }));
      }
    }

    // 7. About section
    if (about !== undefined && typeof about === 'object' && about !== null) {
      const sanitizedPillars = Array.isArray(about.pillars)
        ? about.pillars.map((p: any) => ({
            title: typeof p.title === 'string' ? p.title.trim() : '',
            description: typeof p.description === 'string' ? p.description.trim() : '',
          }))
        : DEFAULT_CLUB_SETTINGS.about.pillars;

      updatePayload.about = {
        eyebrow: typeof about.eyebrow === 'string' ? about.eyebrow.trim() : DEFAULT_CLUB_SETTINGS.about.eyebrow,
        heading: typeof about.heading === 'string' ? about.heading.trim() : DEFAULT_CLUB_SETTINGS.about.heading,
        description: typeof about.description === 'string' ? about.description.trim() : DEFAULT_CLUB_SETTINGS.about.description,
        subDescription: typeof about.subDescription === 'string' ? about.subDescription.trim() : DEFAULT_CLUB_SETTINGS.about.subDescription,
        calloutTitle: typeof about.calloutTitle === 'string' ? about.calloutTitle.trim() : DEFAULT_CLUB_SETTINGS.about.calloutTitle,
        calloutText: typeof about.calloutText === 'string' ? about.calloutText.trim() : DEFAULT_CLUB_SETTINGS.about.calloutText,
        pillars: sanitizedPillars,
      };
    }

    // 8. Home Events & CTA sections
    if (homeEventsSection !== undefined && typeof homeEventsSection === 'object' && homeEventsSection !== null) {
      updatePayload.homeEventsSection = {
        eyebrow: typeof homeEventsSection.eyebrow === 'string' ? homeEventsSection.eyebrow.trim() : DEFAULT_CLUB_SETTINGS.homeEventsSection.eyebrow,
        heading: typeof homeEventsSection.heading === 'string' ? homeEventsSection.heading.trim() : DEFAULT_CLUB_SETTINGS.homeEventsSection.heading,
        description: typeof homeEventsSection.description === 'string' ? homeEventsSection.description.trim() : DEFAULT_CLUB_SETTINGS.homeEventsSection.description,
        ctaText: typeof homeEventsSection.ctaText === 'string' ? homeEventsSection.ctaText.trim() : DEFAULT_CLUB_SETTINGS.homeEventsSection.ctaText,
      };
    }

    if (homeCtaSection !== undefined && typeof homeCtaSection === 'object' && homeCtaSection !== null) {
      updatePayload.homeCtaSection = {
        eyebrow: typeof homeCtaSection.eyebrow === 'string' ? homeCtaSection.eyebrow.trim() : DEFAULT_CLUB_SETTINGS.homeCtaSection.eyebrow,
        heading: typeof homeCtaSection.heading === 'string' ? homeCtaSection.heading.trim() : DEFAULT_CLUB_SETTINGS.homeCtaSection.heading,
        description: typeof homeCtaSection.description === 'string' ? homeCtaSection.description.trim() : DEFAULT_CLUB_SETTINGS.homeCtaSection.description,
        primaryCtaText: typeof homeCtaSection.primaryCtaText === 'string' ? homeCtaSection.primaryCtaText.trim() : DEFAULT_CLUB_SETTINGS.homeCtaSection.primaryCtaText,
        primaryCtaLink: typeof homeCtaSection.primaryCtaLink === 'string' ? homeCtaSection.primaryCtaLink.trim() : DEFAULT_CLUB_SETTINGS.homeCtaSection.primaryCtaLink,
        secondaryCtaText: typeof homeCtaSection.secondaryCtaText === 'string' ? homeCtaSection.secondaryCtaText.trim() : DEFAULT_CLUB_SETTINGS.homeCtaSection.secondaryCtaText,
        secondaryCtaLink: typeof homeCtaSection.secondaryCtaLink === 'string' ? homeCtaSection.secondaryCtaLink.trim() : DEFAULT_CLUB_SETTINGS.homeCtaSection.secondaryCtaLink,
      };
    }

    // 9. Navbar & Footer
    if (navbar !== undefined && typeof navbar === 'object' && navbar !== null) {
      const sanitizedLinks = Array.isArray(navbar.links)
        ? navbar.links.map((link: any) => ({
            name: typeof link.name === 'string' ? link.name.trim() : '',
            path: typeof link.path === 'string' ? link.path.trim() : '/',
            isVisible: Boolean(link.isVisible),
          }))
        : DEFAULT_CLUB_SETTINGS.navbar.links;

      updatePayload.navbar = {
        links: sanitizedLinks,
        ctaText: typeof navbar.ctaText === 'string' ? navbar.ctaText.trim() : DEFAULT_CLUB_SETTINGS.navbar.ctaText,
        ctaLink: typeof navbar.ctaLink === 'string' ? navbar.ctaLink.trim() : DEFAULT_CLUB_SETTINGS.navbar.ctaLink,
      };
    }

    if (footer !== undefined && typeof footer === 'object' && footer !== null) {
      updatePayload.footer = {
        aboutText: typeof footer.aboutText === 'string' ? footer.aboutText.trim() : DEFAULT_CLUB_SETTINGS.footer.aboutText,
        copyrightText: typeof footer.copyrightText === 'string' ? footer.copyrightText.trim() : DEFAULT_CLUB_SETTINGS.footer.copyrightText,
      };
    }

    // 10. Pages Content
    if (pagesContent !== undefined && typeof pagesContent === 'object' && pagesContent !== null) {
      updatePayload.pagesContent = {
        events: {
          eyebrow: typeof pagesContent.events?.eyebrow === 'string' ? pagesContent.events.eyebrow.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.events.eyebrow,
          title: typeof pagesContent.events?.title === 'string' ? pagesContent.events.title.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.events.title,
          description: typeof pagesContent.events?.description === 'string' ? pagesContent.events.description.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.events.description,
        },
        team: {
          eyebrow: typeof pagesContent.team?.eyebrow === 'string' ? pagesContent.team.eyebrow.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.team.eyebrow,
          title: typeof pagesContent.team?.title === 'string' ? pagesContent.team.title.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.team.title,
          description: typeof pagesContent.team?.description === 'string' ? pagesContent.team.description.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.team.description,
        },
        feedback: {
          eyebrow: typeof pagesContent.feedback?.eyebrow === 'string' ? pagesContent.feedback.eyebrow.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.feedback.eyebrow,
          title: typeof pagesContent.feedback?.title === 'string' ? pagesContent.feedback.title.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.feedback.title,
          description: typeof pagesContent.feedback?.description === 'string' ? pagesContent.feedback.description.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.feedback.description,
          privacyNotice: typeof pagesContent.feedback?.privacyNotice === 'string' ? pagesContent.feedback.privacyNotice.trim() : DEFAULT_CLUB_SETTINGS.pagesContent.feedback.privacyNotice,
        },
      };
    }

    // 11. Logo alt text updates if provided
    if (logos !== undefined && typeof logos === 'object' && logos !== null) {
      if (logos.clubLogo?.alt !== undefined) {
        updatePayload['logos.clubLogo.alt'] = typeof logos.clubLogo.alt === 'string' ? logos.clubLogo.alt.trim() : '';
      }
      if (logos.universityLogo?.alt !== undefined) {
        updatePayload['logos.universityLogo.alt'] = typeof logos.universityLogo.alt === 'string' ? logos.universityLogo.alt.trim() : '';
      }
    }

    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database service is currently unavailable.',
      });
      return;
    }

    const updatedSettings = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Website content and configuration updated successfully.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update club settings.',
    });
  }
};

/**
 * Admin: Upload Anveshana Club Logo
 * POST /api/v1/admin/settings/logo/club
 */
export const uploadClubLogo = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'No logo image file was provided.',
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const uploadResult = await uploadImageBuffer(req.file.buffer, 'anveshana/logos');

    const existing = await ClubSettings.findOne({ isSingleton: true });
    if (existing?.logos?.clubLogo?.publicId) {
      await deleteCloudinaryImage(existing.logos.clubLogo.publicId);
    }

    const altText = typeof req.body.alt === 'string' && req.body.alt.trim() ? req.body.alt.trim() : 'Anveshana Club Logo';

    const updated = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      {
        $set: {
          'logos.clubLogo': {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            alt: altText,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Anveshana Club logo uploaded successfully.',
      error: null,
    });
  } catch (error: any) {
    const errMsg = error?.message || 'Failed to upload club logo.';
    const isForbidden =
      error?.http_code === 403 ||
      errMsg.includes('403') ||
      errMsg.includes('permissions') ||
      errMsg.includes('forbidden');
    const isUnauthorized = error?.http_code === 401 || errMsg.includes('401');

    let userFriendlyError = errMsg;
    if (isForbidden || isUnauthorized) {
      userFriendlyError =
        'Logo upload rejected by Cloudinary: Missing read/write permissions or invalid API credentials. Please verify Cloudinary environment credentials.';
    }

    res.status(isForbidden || isUnauthorized ? 502 : 400).json({
      success: false,
      data: null,
      error: userFriendlyError,
    });
  }
};

/**
 * Admin: Upload Mohan Babu University Logo
 * POST /api/v1/admin/settings/logo/university
 */
export const uploadUniversityLogo = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'No logo image file was provided.',
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const uploadResult = await uploadImageBuffer(req.file.buffer, 'anveshana/logos');

    const existing = await ClubSettings.findOne({ isSingleton: true });
    if (existing?.logos?.universityLogo?.publicId) {
      await deleteCloudinaryImage(existing.logos.universityLogo.publicId);
    }

    const altText = typeof req.body.alt === 'string' && req.body.alt.trim() ? req.body.alt.trim() : 'Mohan Babu University Logo';

    const updated = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      {
        $set: {
          'logos.universityLogo': {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            alt: altText,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Mohan Babu University logo uploaded successfully.',
      error: null,
    });
  } catch (error: any) {
    const errMsg = error?.message || 'Failed to upload university logo.';
    const isForbidden =
      error?.http_code === 403 ||
      errMsg.includes('403') ||
      errMsg.includes('permissions') ||
      errMsg.includes('forbidden');
    const isUnauthorized = error?.http_code === 401 || errMsg.includes('401');

    let userFriendlyError = errMsg;
    if (isForbidden || isUnauthorized) {
      userFriendlyError =
        'Logo upload rejected by Cloudinary: Missing read/write permissions or invalid API credentials. Please verify Cloudinary environment credentials.';
    }

    res.status(isForbidden || isUnauthorized ? 502 : 400).json({
      success: false,
      data: null,
      error: userFriendlyError,
    });
  }
};

/**
 * Admin: Delete / Reset Anveshana Club Logo
 * DELETE /api/v1/admin/settings/logo/club
 */
export const deleteClubLogo = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const existing = await ClubSettings.findOne({ isSingleton: true });
    if (existing?.logos?.clubLogo?.publicId) {
      await deleteCloudinaryImage(existing.logos.clubLogo.publicId);
    }

    const updated = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      { $set: { 'logos.clubLogo': null } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Anveshana Club logo reset to default.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to reset club logo.',
    });
  }
};

/**
 * Admin: Delete / Reset Mohan Babu University Logo
 * DELETE /api/v1/admin/settings/logo/university
 */
export const deleteUniversityLogo = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const existing = await ClubSettings.findOne({ isSingleton: true });
    if (existing?.logos?.universityLogo?.publicId) {
      await deleteCloudinaryImage(existing.logos.universityLogo.publicId);
    }

    const updated = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      { $set: { 'logos.universityLogo': null } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Mohan Babu University logo reset to default.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to reset university logo.',
    });
  }
};

/**
 * Admin: Upload Homepage Hero Background Image
 * POST /api/v1/admin/settings/hero/background
 */
export const uploadHeroBackground = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'No hero background image file was provided.',
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const uploadResult = await uploadImageBuffer(req.file.buffer, 'anveshana/hero');

    const existing = await ClubSettings.findOne({ isSingleton: true });
    const oldPublicId = existing?.hero?.backgroundImage?.publicId;

    const updated = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      {
        $set: {
          'hero.backgroundImage': {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Only delete old Cloudinary asset after successful upload and DB save
    if (oldPublicId && oldPublicId !== uploadResult.publicId) {
      await deleteCloudinaryImage(oldPublicId).catch(() => {});
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Homepage hero background image uploaded and activated successfully.',
      error: null,
    });
  } catch (error: any) {
    const errMsg = error?.message || 'Failed to upload hero background image.';
    const isForbidden =
      error?.http_code === 403 ||
      errMsg.includes('403') ||
      errMsg.includes('permissions') ||
      errMsg.includes('forbidden');
    const isUnauthorized = error?.http_code === 401 || errMsg.includes('401');

    let userFriendlyError = errMsg;
    if (isForbidden || isUnauthorized) {
      userFriendlyError =
        'Image upload rejected by Cloudinary: Missing read/write permissions or invalid API credentials.';
    }

    res.status(isForbidden || isUnauthorized ? 502 : 400).json({
      success: false,
      data: null,
      error: userFriendlyError,
    });
  }
};

/**
 * Admin: Delete / Reset Homepage Hero Background Image
 * DELETE /api/v1/admin/settings/hero/background
 */
export const deleteHeroBackground = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const existing = await ClubSettings.findOne({ isSingleton: true });
    if (existing?.hero?.backgroundImage?.publicId) {
      await deleteCloudinaryImage(existing.hero.backgroundImage.publicId).catch(() => {});
    }

    const updated = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      { $set: { 'hero.backgroundImage': null } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Homepage hero background reset to default.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to reset hero background image.',
    });
  }
};
