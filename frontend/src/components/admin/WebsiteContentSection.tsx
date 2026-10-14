import React, { useState, useEffect, useRef } from 'react';
import { settingsService } from '../../services/settingsService';
import type { ClubSettings, UpdateSettingsPayload } from '../../types/settings';
import { Button } from '../common/Button';

type SubSection =
  | 'homepage'
  | 'about'
  | 'nav_footer'
  | 'logos'
  | 'club_info'
  | 'social'
  | 'pages';

export const WebsiteContentSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubSection>('homepage');
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // --- Form States ---
  // Club Info & Contact
  const [clubName, setClubName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [tagline, setTagline] = useState('');
  const [mission, setMission] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [affiliatedSchools, setAffiliatedSchools] = useState('');

  // Social Links
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');

  // Homepage Hero
  const [heroEyebrow, setHeroEyebrow] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroTagline, setHeroTagline] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroPrimaryCtaText, setHeroPrimaryCtaText] = useState('');
  const [heroPrimaryCtaLink, setHeroPrimaryCtaLink] = useState('');
  const [heroSecondaryCtaText, setHeroSecondaryCtaText] = useState('');
  const [heroSecondaryCtaLink, setHeroSecondaryCtaLink] = useState('');

  // Homepage Stats
  const [stats, setStats] = useState<Array<{ value: string; label: string; description: string }>>([]);

  // About the Club
  const [aboutEyebrow, setAboutEyebrow] = useState('');
  const [aboutHeading, setAboutHeading] = useState('');
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutSubDescription, setAboutSubDescription] = useState('');
  const [aboutCalloutTitle, setAboutCalloutTitle] = useState('');
  const [aboutCalloutText, setAboutCalloutText] = useState('');
  const [pillars, setPillars] = useState<Array<{ title: string; description: string }>>([]);

  // Homepage Sections (Events & Bottom CTA)
  const [eventsEyebrow, setEventsEyebrow] = useState('');
  const [eventsHeading, setEventsHeading] = useState('');
  const [eventsDescription, setEventsDescription] = useState('');
  const [eventsCtaText, setEventsCtaText] = useState('');

  const [bottomCtaEyebrow, setBottomCtaEyebrow] = useState('');
  const [bottomCtaHeading, setBottomCtaHeading] = useState('');
  const [bottomCtaDescription, setBottomCtaDescription] = useState('');
  const [bottomCtaPrimaryText, setBottomCtaPrimaryText] = useState('');
  const [bottomCtaPrimaryLink, setBottomCtaPrimaryLink] = useState('');
  const [bottomCtaSecondaryText, setBottomCtaSecondaryText] = useState('');
  const [bottomCtaSecondaryLink, setBottomCtaSecondaryLink] = useState('');

  // Navigation & Footer
  const [navLinks, setNavLinks] = useState<Array<{ name: string; path: string; isVisible: boolean }>>([]);
  const [navCtaText, setNavCtaText] = useState('');
  const [navCtaLink, setNavCtaLink] = useState('');
  const [footerAboutText, setFooterAboutText] = useState('');
  const [footerCopyrightText, setFooterCopyrightText] = useState('');

  // Public Page Content (Events, Team, Feedback)
  const [pageEventsEyebrow, setPageEventsEyebrow] = useState('');
  const [pageEventsTitle, setPageEventsTitle] = useState('');
  const [pageEventsDescription, setPageEventsDescription] = useState('');

  const [pageTeamEyebrow, setPageTeamEyebrow] = useState('');
  const [pageTeamTitle, setPageTeamTitle] = useState('');
  const [pageTeamDescription, setPageTeamDescription] = useState('');

  const [pageFeedbackEyebrow, setPageFeedbackEyebrow] = useState('');
  const [pageFeedbackTitle, setPageFeedbackTitle] = useState('');
  const [pageFeedbackDescription, setPageFeedbackDescription] = useState('');
  const [pageFeedbackPrivacy, setPageFeedbackPrivacy] = useState('');

  // Logo Alt Text States
  const [clubLogoAlt, setClubLogoAlt] = useState('');
  const [universityLogoAlt, setUniversityLogoAlt] = useState('');

  // Logo Upload States
  const [clubLogoFile, setClubLogoFile] = useState<File | null>(null);
  const [clubLogoPreview, setClubLogoPreview] = useState<string | null>(null);
  const [isUploadingClubLogo, setIsUploadingClubLogo] = useState(false);

  const [univLogoFile, setUnivLogoFile] = useState<File | null>(null);
  const [univLogoPreview, setUnivLogoPreview] = useState<string | null>(null);
  const [isUploadingUnivLogo, setIsUploadingUnivLogo] = useState(false);

  const clubFileInputRef = useRef<HTMLInputElement>(null);
  const univFileInputRef = useRef<HTMLInputElement>(null);

  const populateForm = (data: ClubSettings) => {
    setSettings(data);
    setClubName(data.clubName || '');
    setUniversityName(data.universityName || 'Mohan Babu University');
    setTagline(data.tagline || '');
    setMission(data.mission || '');
    setContactEmail(data.contactEmail || '');
    setContactPhone(data.contactPhone || '');
    setCampusLocation(data.campusLocation || 'Sree Sainath Nagar, Tirupati, Andhra Pradesh - 517102');
    setAffiliatedSchools(data.affiliatedSchools || 'School of Computing & School of Engineering');

    // Social Links
    setInstagram(data.socialLinks?.instagram || '');
    setLinkedin(data.socialLinks?.linkedin || '');
    setGithub(data.socialLinks?.github || '');
    setTwitter(data.socialLinks?.twitter || '');
    setYoutube(data.socialLinks?.youtube || '');

    // Hero
    setHeroEyebrow(data.hero?.eyebrow || 'Mohan Babu University · Tirupati');
    setHeroTitle(data.hero?.title || 'ANVESHANA');
    setHeroTagline(data.hero?.tagline || 'Explore · Build · Bring Ideas to Life.');
    setHeroDescription(
      data.hero?.description ||
        'The premier central student club uniting the School of Computing and the School of Engineering. Fostering multidisciplinary hackathons, technological breakthroughs, and engineering leadership.'
    );
    setHeroPrimaryCtaText(data.hero?.primaryCtaText || 'Explore Events');
    setHeroPrimaryCtaLink(data.hero?.primaryCtaLink || '/events');
    setHeroSecondaryCtaText(data.hero?.secondaryCtaText || 'Meet the Core Team');
    setHeroSecondaryCtaLink(data.hero?.secondaryCtaLink || '/team');

    // Stats
    setStats(
      data.stats && data.stats.length > 0
        ? data.stats.map((s) => ({ value: s.value, label: s.label, description: s.description || '' }))
        : [
            { value: '2', label: 'Premier Schools', description: 'Computing & Engineering' },
            { value: '7', label: 'Core Wings', description: 'Cross-functional operations' },
            { value: '100%', label: 'Hands-On Practice', description: 'Workshops & projects' },
            { value: 'Open', label: 'Student Access', description: 'Frictionless participation' },
          ]
    );

    // About
    setAboutEyebrow(data.about?.eyebrow || 'Our Central Mission');
    setAboutHeading(data.about?.heading || 'Bridging Computing and Engineering.');
    setAboutDescription(
      data.about?.description ||
        'At Mohan Babu University, innovation does not happen in silos. Anveshana acts as the central catalyst connecting coders, makers, researchers, and designers across disciplines.'
    );
    setAboutSubDescription(
      data.about?.subDescription ||
        'Whether you are optimizing cloud infrastructure, soldering embedded sensors, or designing intuitive user experiences, Anveshana is your playground to explore ideas and bring them to life.'
    );
    setAboutCalloutTitle(data.about?.calloutTitle || 'Frictionless Student Access');
    setAboutCalloutText(
      data.about?.calloutText ||
        'No accounts or login barriers required. Every student at MBU has immediate access to discover upcoming events, explore team leads, view hackathon galleries, and register natively.'
    );
    setPillars(
      data.about?.pillars && data.about.pillars.length > 0
        ? data.about.pillars
        : [
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
          ]
    );

    // Home Events & CTA
    setEventsEyebrow(data.homeEventsSection?.eyebrow || 'Explore Opportunities');
    setEventsHeading(data.homeEventsSection?.heading || 'Upcoming Events & Hackathons');
    setEventsDescription(
      data.homeEventsSection?.description ||
        'Discover workshops, hackathons, and symposiums hosted on campus. Native registration opens prior to each event.'
    );
    setEventsCtaText(data.homeEventsSection?.ctaText || 'View Full Event Catalog →');

    setBottomCtaEyebrow(data.homeCtaSection?.eyebrow || 'Mohan Babu University Community');
    setBottomCtaHeading(data.homeCtaSection?.heading || 'Ready to Build Your Next Breakthrough?');
    setBottomCtaDescription(
      data.homeCtaSection?.description ||
        'Whether you want to lead an engineering team, compete in a national hackathon, or provide event feedback, Anveshana is here for you.'
    );
    setBottomCtaPrimaryText(data.homeCtaSection?.primaryCtaText || 'Browse All Events');
    setBottomCtaPrimaryLink(data.homeCtaSection?.primaryCtaLink || '/events');
    setBottomCtaSecondaryText(data.homeCtaSection?.secondaryCtaText || 'Share Your Feedback');
    setBottomCtaSecondaryLink(data.homeCtaSection?.secondaryCtaLink || '/feedback');

    // Navigation & Footer
    setNavLinks(
      data.navbar?.links && data.navbar.links.length > 0
        ? data.navbar.links
        : [
            { name: 'Home', path: '/', isVisible: true },
            { name: 'Events', path: '/events', isVisible: true },
            { name: 'Team', path: '/team', isVisible: true },
            { name: 'Feedback', path: '/feedback', isVisible: true },
          ]
    );
    setNavCtaText(data.navbar?.ctaText || 'Explore Events');
    setNavCtaLink(data.navbar?.ctaLink || '/events');
    setFooterAboutText(
      data.footer?.aboutText ||
        'The premier central university club bridging students from the School of Computing and the School of Engineering. We foster hands-on engineering, collaborative hackathons, and technical innovation.'
    );
    setFooterCopyrightText(
      data.footer?.copyrightText || '© Anveshana Club · Mohan Babu University. All rights reserved.'
    );

    // Pages Content
    setPageEventsEyebrow(data.pagesContent?.events?.eyebrow || 'Events & Opportunities');
    setPageEventsTitle(data.pagesContent?.events?.title || 'Our Events');
    setPageEventsDescription(
      data.pagesContent?.events?.description ||
        'Explore, Learn, Participate and Be a Part of Amazing Events bridging computing innovation and engineering leadership at Mohan Babu University.'
    );

    setPageTeamEyebrow(data.pagesContent?.team?.eyebrow || 'Leadership & Wings');
    setPageTeamTitle(data.pagesContent?.team?.title || 'Core Team Directory');
    setPageTeamDescription(
      data.pagesContent?.team?.description ||
        'Meet the dedicated students across the 7 specialized wings driving Anveshana Club at Mohan Babu University.'
    );

    setPageFeedbackEyebrow(data.pagesContent?.feedback?.eyebrow || 'Continuous Improvement');
    setPageFeedbackTitle(data.pagesContent?.feedback?.title || 'Contact & Community Feedback');
    setPageFeedbackDescription(
      data.pagesContent?.feedback?.description ||
        'Share your ideas, suggest technology workshops, or reach out to the Anveshana executive committee.'
    );
    setPageFeedbackPrivacy(
      data.pagesContent?.feedback?.privacyNotice ||
        'Submissions do not require student login. Verified reviews are moderated before being aggregated into public ratings.'
    );

    // Logos Alt Text
    setClubLogoAlt(data.logos?.clubLogo?.alt || 'Anveshana Club Logo');
    setUniversityLogoAlt(data.logos?.universityLogo?.alt || 'Mohan Babu University Logo');

    setIsDirty(false);
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await settingsService.getAdminSettings();
      if (res.success && res.data) {
        populateForm(res.data);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to load website content configuration.',
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.status === 503
          ? 'Database is currently offline. Showing fallback baseline values.'
          : err.response?.data?.error || 'Failed to connect to settings service.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const handleDiscardChanges = () => {
    if (window.confirm('Are you sure you want to discard all unsaved edits?')) {
      if (settings) populateForm(settings);
    }
  };

  // --- Save All CMS Content ---
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedbackMessage(null);

    const payload: UpdateSettingsPayload = {
      clubName: clubName.trim(),
      universityName: universityName.trim(),
      tagline: tagline.trim(),
      mission: mission.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone.trim() || null,
      campusLocation: campusLocation.trim(),
      affiliatedSchools: affiliatedSchools.trim(),
      socialLinks: {
        instagram: instagram.trim() || null,
        linkedin: linkedin.trim() || null,
        github: github.trim() || null,
        twitter: twitter.trim() || null,
        youtube: youtube.trim() || null,
      },
      hero: {
        eyebrow: heroEyebrow.trim(),
        title: heroTitle.trim(),
        tagline: heroTagline.trim(),
        description: heroDescription.trim(),
        primaryCtaText: heroPrimaryCtaText.trim(),
        primaryCtaLink: heroPrimaryCtaLink.trim(),
        secondaryCtaText: heroSecondaryCtaText.trim(),
        secondaryCtaLink: heroSecondaryCtaLink.trim(),
      },
      stats: stats.map((s) => ({
        value: s.value.trim(),
        label: s.label.trim(),
        description: s.description.trim(),
      })),
      about: {
        eyebrow: aboutEyebrow.trim(),
        heading: aboutHeading.trim(),
        description: aboutDescription.trim(),
        subDescription: aboutSubDescription.trim(),
        calloutTitle: aboutCalloutTitle.trim(),
        calloutText: aboutCalloutText.trim(),
        pillars: pillars.map((p) => ({
          title: p.title.trim(),
          description: p.description.trim(),
        })),
      },
      homeEventsSection: {
        eyebrow: eventsEyebrow.trim(),
        heading: eventsHeading.trim(),
        description: eventsDescription.trim(),
        ctaText: eventsCtaText.trim(),
      },
      homeCtaSection: {
        eyebrow: bottomCtaEyebrow.trim(),
        heading: bottomCtaHeading.trim(),
        description: bottomCtaDescription.trim(),
        primaryCtaText: bottomCtaPrimaryText.trim(),
        primaryCtaLink: bottomCtaPrimaryLink.trim(),
        secondaryCtaText: bottomCtaSecondaryText.trim(),
        secondaryCtaLink: bottomCtaSecondaryLink.trim(),
      },
      navbar: {
        links: navLinks.map((l) => ({
          name: l.name.trim(),
          path: l.path.trim(),
          isVisible: l.isVisible,
        })),
        ctaText: navCtaText.trim(),
        ctaLink: navCtaLink.trim(),
      },
      footer: {
        aboutText: footerAboutText.trim(),
        copyrightText: footerCopyrightText.trim(),
      },
      pagesContent: {
        events: {
          eyebrow: pageEventsEyebrow.trim(),
          title: pageEventsTitle.trim(),
          description: pageEventsDescription.trim(),
        },
        team: {
          eyebrow: pageTeamEyebrow.trim(),
          title: pageTeamTitle.trim(),
          description: pageTeamDescription.trim(),
        },
        feedback: {
          eyebrow: pageFeedbackEyebrow.trim(),
          title: pageFeedbackTitle.trim(),
          description: pageFeedbackDescription.trim(),
          privacyNotice: pageFeedbackPrivacy.trim(),
        },
      },
      logos: {
        clubLogo: { alt: clubLogoAlt.trim() },
        universityLogo: { alt: universityLogoAlt.trim() },
      },
    };

    try {
      const res = await settingsService.updateAdminSettings(payload);
      if (res.success && res.data) {
        populateForm(res.data);
        setFeedbackMessage({
          type: 'success',
          text: 'Website content and configuration saved successfully.',
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to save changes.',
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.status === 503
          ? 'Database is currently offline. Changes cannot be saved until MongoDB Atlas is connected.'
          : err.response?.data?.error || 'Failed to persist changes.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Logo Upload & Delete Handlers ---
  const handleClubLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedbackMessage({ type: 'error', text: 'Only JPEG, PNG, and WebP logos are allowed.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFeedbackMessage({ type: 'error', text: 'Logo image must be under 2MB.' });
      return;
    }

    setClubLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setClubLogoPreview(previewUrl);
    setFeedbackMessage(null);
  };

  const handleUploadClubLogo = async () => {
    if (!clubLogoFile) return;
    setIsUploadingClubLogo(true);
    setFeedbackMessage(null);

    try {
      const res = await settingsService.uploadClubLogo(clubLogoFile, clubLogoAlt);
      if (res.success && res.data) {
        populateForm(res.data);
        setClubLogoFile(null);
        setClubLogoPreview(null);
        setFeedbackMessage({ type: 'success', text: 'Anveshana Club logo uploaded and activated successfully.' });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to upload club logo.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error || 'Error uploading club logo to Cloudinary.' });
    } finally {
      setIsUploadingClubLogo(false);
    }
  };

  const handleDeleteClubLogo = async () => {
    if (!window.confirm('Reset Anveshana Club logo to default crest?')) return;
    setIsUploadingClubLogo(true);
    setFeedbackMessage(null);

    try {
      const res = await settingsService.deleteClubLogo();
      if (res.success && res.data) {
        populateForm(res.data);
        setClubLogoFile(null);
        setClubLogoPreview(null);
        setFeedbackMessage({ type: 'success', text: 'Anveshana Club logo reset to default.' });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to reset club logo.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reset club logo.' });
    } finally {
      setIsUploadingClubLogo(false);
    }
  };

  const handleUnivLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedbackMessage({ type: 'error', text: 'Only JPEG, PNG, and WebP logos are allowed.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFeedbackMessage({ type: 'error', text: 'Logo image must be under 2MB.' });
      return;
    }

    setUnivLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUnivLogoPreview(previewUrl);
    setFeedbackMessage(null);
  };

  const handleUploadUnivLogo = async () => {
    if (!univLogoFile) return;
    setIsUploadingUnivLogo(true);
    setFeedbackMessage(null);

    try {
      const res = await settingsService.uploadUniversityLogo(univLogoFile, universityLogoAlt);
      if (res.success && res.data) {
        populateForm(res.data);
        setUnivLogoFile(null);
        setUnivLogoPreview(null);
        setFeedbackMessage({ type: 'success', text: 'Mohan Babu University logo uploaded and activated successfully.' });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to upload university logo.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error || 'Error uploading university logo to Cloudinary.' });
    } finally {
      setIsUploadingUnivLogo(false);
    }
  };

  const handleDeleteUnivLogo = async () => {
    if (!window.confirm('Reset Mohan Babu University logo to default?')) return;
    setIsUploadingUnivLogo(true);
    setFeedbackMessage(null);

    try {
      const res = await settingsService.deleteUniversityLogo();
      if (res.success && res.data) {
        populateForm(res.data);
        setUnivLogoFile(null);
        setUnivLogoPreview(null);
        setFeedbackMessage({ type: 'success', text: 'University logo reset to default.' });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to reset university logo.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reset university logo.' });
    } finally {
      setIsUploadingUnivLogo(false);
    }
  };

  // Subsections definition
  const subSections: Array<{ id: SubSection; label: string; icon: string }> = [
    { id: 'homepage', label: 'Homepage', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'about', label: 'About the Club', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'nav_footer', label: 'Navigation & Footer', icon: 'M4 6h16M4 12h16M4 18h7' },
    { id: 'logos', label: 'Logos & Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'club_info', label: 'Club Info & Contact', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'social', label: 'Social Media Links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'pages', label: 'Public Page Content', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* CMS Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-2xl font-bold text-[#0B132B]">Website Content (CMS)</h2>
            {isDirty && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage every intended editable text, link, and logo across public portal pages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              disabled={isSaving}
            >
              Discard Changes
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSaveAll()}
            isLoading={isSaving}
          >
            Save All Changes
          </Button>
        </div>
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

      {/* Subsections Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-100">
        {subSections.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-[#0B132B] text-[#F5A623] shadow-xs'
                : 'text-gray-600 hover:text-[#0B132B] hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center text-xs text-gray-500">
          Loading website configuration and copy...
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="space-y-8">
          {/* =========================================================================
             TAB 1: HOMEPAGE (Hero, Stats, Highlights & Bottom CTA)
             ========================================================================= */}
          {activeSubTab === 'homepage' && (
            <div className="space-y-8">
              {/* Hero Section Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Hero Section Content</h3>
                  <p className="text-xs text-gray-500">
                    Controls the primary above-the-fold banner on the public homepage.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Hero Eyebrow Text (University / Location Pill)
                    </label>
                    <input
                      type="text"
                      value={heroEyebrow}
                      onChange={(e) => {
                        setHeroEyebrow(e.target.value);
                        markDirty();
                      }}
                      placeholder="Mohan Babu University · Tirupati"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Main Heading (Title)
                    </label>
                    <input
                      type="text"
                      value={heroTitle}
                      onChange={(e) => {
                        setHeroTitle(e.target.value);
                        markDirty();
                      }}
                      placeholder="ANVESHANA"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Hero Tagline
                    </label>
                    <input
                      type="text"
                      value={heroTagline}
                      onChange={(e) => {
                        setHeroTagline(e.target.value);
                        markDirty();
                      }}
                      placeholder="Explore · Build · Bring Ideas to Life."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Hero Subtitle / Description
                    </label>
                    <textarea
                      rows={3}
                      value={heroDescription}
                      onChange={(e) => {
                        setHeroDescription(e.target.value);
                        markDirty();
                      }}
                      placeholder="Describe the central student club mission..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Primary CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={heroPrimaryCtaText}
                      onChange={(e) => {
                        setHeroPrimaryCtaText(e.target.value);
                        markDirty();
                      }}
                      placeholder="Explore Events"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Primary CTA Destination Link
                    </label>
                    <input
                      type="text"
                      value={heroPrimaryCtaLink}
                      onChange={(e) => {
                        setHeroPrimaryCtaLink(e.target.value);
                        markDirty();
                      }}
                      placeholder="/events"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Secondary CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={heroSecondaryCtaText}
                      onChange={(e) => {
                        setHeroSecondaryCtaText(e.target.value);
                        markDirty();
                      }}
                      placeholder="Meet the Core Team"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Secondary CTA Destination Link
                    </label>
                    <input
                      type="text"
                      value={heroSecondaryCtaLink}
                      onChange={(e) => {
                        setHeroSecondaryCtaLink(e.target.value);
                        markDirty();
                      }}
                      placeholder="/team"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>
                </div>
              </div>

              {/* Homepage Statistics Row */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#0B132B]">Key Statistics &amp; Milestones</h3>
                    <p className="text-xs text-gray-500">
                      Displayed in the dedicated statistics band below the hero CTA buttons.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStats([...stats, { value: '', label: '', description: '' }]);
                      markDirty();
                    }}
                  >
                    + Add Stat Item
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Item #{idx + 1}
                        </span>
                        {stats.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setStats(stats.filter((_, i) => i !== idx));
                              markDirty();
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                            title="Remove stat item"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Display Value (Number / Badge)
                        </label>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => {
                            const updated = [...stats];
                            updated[idx].value = e.target.value;
                            setStats(updated);
                            markDirty();
                          }}
                          placeholder="e.g. 100% or 7"
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-[#0B132B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const updated = [...stats];
                            updated[idx].label = e.target.value;
                            setStats(updated);
                            markDirty();
                          }}
                          placeholder="e.g. Core Wings"
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Supporting Note
                        </label>
                        <input
                          type="text"
                          value={stat.description}
                          onChange={(e) => {
                            const updated = [...stats];
                            updated[idx].description = e.target.value;
                            setStats(updated);
                            markDirty();
                          }}
                          placeholder="Short description"
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Homepage Event Highlights Section Header */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Homepage Event Highlights Copy</h3>
                  <p className="text-xs text-gray-500">
                    The header copy above the 3-column dynamic upcoming events grid on the homepage.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Section Eyebrow
                    </label>
                    <input
                      type="text"
                      value={eventsEyebrow}
                      onChange={(e) => {
                        setEventsEyebrow(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={eventsHeading}
                      onChange={(e) => {
                        setEventsHeading(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Section Description
                    </label>
                    <input
                      type="text"
                      value={eventsDescription}
                      onChange={(e) => {
                        setEventsDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={eventsCtaText}
                      onChange={(e) => {
                        setEventsCtaText(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Homepage Bottom Community CTA Section */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Bottom Community Callout Section</h3>
                  <p className="text-xs text-gray-500">
                    The dark navy banner at the bottom of the homepage inviting students to browse events and share reviews.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Eyebrow Text
                    </label>
                    <input
                      type="text"
                      value={bottomCtaEyebrow}
                      onChange={(e) => {
                        setBottomCtaEyebrow(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Main Heading
                    </label>
                    <input
                      type="text"
                      value={bottomCtaHeading}
                      onChange={(e) => {
                        setBottomCtaHeading(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Description Copy
                    </label>
                    <textarea
                      rows={2}
                      value={bottomCtaDescription}
                      onChange={(e) => {
                        setBottomCtaDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Primary Button Label
                    </label>
                    <input
                      type="text"
                      value={bottomCtaPrimaryText}
                      onChange={(e) => {
                        setBottomCtaPrimaryText(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Primary Button Link
                    </label>
                    <input
                      type="text"
                      value={bottomCtaPrimaryLink}
                      onChange={(e) => {
                        setBottomCtaPrimaryLink(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Secondary Button Label
                    </label>
                    <input
                      type="text"
                      value={bottomCtaSecondaryText}
                      onChange={(e) => {
                        setBottomCtaSecondaryText(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Secondary Button Link
                    </label>
                    <input
                      type="text"
                      value={bottomCtaSecondaryLink}
                      onChange={(e) => {
                        setBottomCtaSecondaryLink(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 2: ABOUT THE CLUB (Mission, Narrative & Core Pillars)
             ========================================================================= */}
          {activeSubTab === 'about' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Mission &amp; About Section</h3>
                  <p className="text-xs text-gray-500">
                    Content rendered in the ivory Mission section on the homepage and about narratives.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={aboutEyebrow}
                      onChange={(e) => {
                        setAboutEyebrow(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Main Heading
                    </label>
                    <input
                      type="text"
                      value={aboutHeading}
                      onChange={(e) => {
                        setAboutHeading(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Primary Narrative Paragraph
                    </label>
                    <textarea
                      rows={3}
                      value={aboutDescription}
                      onChange={(e) => {
                        setAboutDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Secondary Narrative Paragraph
                    </label>
                    <textarea
                      rows={3}
                      value={aboutSubDescription}
                      onChange={(e) => {
                        setAboutSubDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Callout Box Title
                    </label>
                    <input
                      type="text"
                      value={aboutCalloutTitle}
                      onChange={(e) => {
                        setAboutCalloutTitle(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Callout Box Text
                    </label>
                    <textarea
                      rows={2}
                      value={aboutCalloutText}
                      onChange={(e) => {
                        setAboutCalloutText(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* 4 Core Pillars */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">The 4 Foundation Pillars</h3>
                  <p className="text-xs text-gray-500">
                    Feature cards displayed alongside the mission narrative.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pillars.map((pillar, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                      <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest block">
                        Pillar #{idx + 1}
                      </span>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Pillar Title
                        </label>
                        <input
                          type="text"
                          value={pillar.title}
                          onChange={(e) => {
                            const updated = [...pillars];
                            updated[idx].title = e.target.value;
                            setPillars(updated);
                            markDirty();
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-[#0B132B]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={pillar.description}
                          onChange={(e) => {
                            const updated = [...pillars];
                            updated[idx].description = e.target.value;
                            setPillars(updated);
                            markDirty();
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 3: NAVIGATION & FOOTER
             ========================================================================= */}
          {activeSubTab === 'nav_footer' && (
            <div className="space-y-8">
              {/* Navigation Bar Settings */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Navigation Bar Links &amp; Action Button</h3>
                  <p className="text-xs text-gray-500">
                    Control menu items and the top header action button.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Header CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={navCtaText}
                        onChange={(e) => {
                          setNavCtaText(e.target.value);
                          markDirty();
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Header CTA Destination Link
                      </label>
                      <input
                        type="text"
                        value={navCtaLink}
                        onChange={(e) => {
                          setNavCtaLink(e.target.value);
                          markDirty();
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-3">
                      Navigation Menu Links
                    </label>
                    <div className="space-y-2.5">
                      {navLinks.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => {
                              const updated = [...navLinks];
                              updated[idx].name = e.target.value;
                              setNavLinks(updated);
                              markDirty();
                            }}
                            placeholder="Link Name"
                            className="w-40 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-900"
                          />
                          <input
                            type="text"
                            value={link.path}
                            onChange={(e) => {
                              const updated = [...navLinks];
                              updated[idx].path = e.target.value;
                              setNavLinks(updated);
                              markDirty();
                            }}
                            placeholder="/path"
                            className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-600"
                          />
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={link.isVisible}
                              onChange={(e) => {
                                const updated = [...navLinks];
                                updated[idx].isVisible = e.target.checked;
                                setNavLinks(updated);
                                markDirty();
                              }}
                              className="rounded text-[#0B132B] focus:ring-[#0B132B] h-4 w-4"
                            />
                            <span>Visible</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Content */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Footer Branding &amp; Legal Copy</h3>
                  <p className="text-xs text-gray-500">
                    Content appearing in the footer across all public pages.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Footer Mission / About Summary
                    </label>
                    <textarea
                      rows={3}
                      value={footerAboutText}
                      onChange={(e) => {
                        setFooterAboutText(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Copyright Notice
                    </label>
                    <input
                      type="text"
                      value={footerCopyrightText}
                      onChange={(e) => {
                        setFooterCopyrightText(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 4: LOGOS & IMAGES (Card 1: Anveshana Logo, Card 2: MBU Logo)
             ========================================================================= */}
          {activeSubTab === 'logos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CARD 1: Anveshana Club Logo */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] uppercase tracking-widest text-[#F5A623] font-bold block">
                      Organization Brand
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#0B132B] mt-0.5">
                      Anveshana Club Logo
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Rendered in the public navbar, footer, and community certificates.
                    </p>
                  </div>

                  {/* Logo Preview Area */}
                  <div className="mt-5 p-6 bg-gradient-to-b from-[#0B132B] to-[#1C2541] rounded-xl border border-gray-700 flex flex-col items-center justify-center min-h-[160px] text-center">
                    {clubLogoPreview ? (
                      <div>
                        <img
                          src={clubLogoPreview}
                          alt="New Club Logo Preview"
                          className="max-h-20 max-w-[200px] object-contain mx-auto"
                        />
                        <span className="text-[10px] text-amber-300 mt-2 block font-semibold">
                          Selected Replacement (Unuploaded)
                        </span>
                      </div>
                    ) : settings?.logos?.clubLogo?.url ? (
                      <div>
                        <img
                          src={settings.logos.clubLogo.url}
                          alt={settings.logos.clubLogo.alt || 'Anveshana Club Logo'}
                          className="max-h-20 max-w-[200px] object-contain mx-auto"
                        />
                        <span className="text-[10px] text-gray-300 mt-2 block">
                          Current Active Logo
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-[#1C2541] border border-[#F5A623] text-[#F5A623] flex items-center justify-center font-serif text-xl font-bold">
                          A
                        </div>
                        <span className="text-xs text-gray-400">Default Brand Crest (Fallback Active)</span>
                      </div>
                    )}
                  </div>

                  {/* Alt Text Field */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Accessibility Alt Text
                    </label>
                    <input
                      type="text"
                      value={clubLogoAlt}
                      onChange={(e) => {
                        setClubLogoAlt(e.target.value);
                        markDirty();
                      }}
                      placeholder="Anveshana Club Logo"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900"
                    />
                  </div>
                </div>

                {/* Upload / Replace Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <input
                    type="file"
                    ref={clubFileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleClubLogoSelect}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clubFileInputRef.current?.click()}
                    >
                      {clubLogoPreview || settings?.logos?.clubLogo?.url ? 'Select New Image...' : 'Choose Logo File...'}
                    </Button>

                    {clubLogoFile && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleUploadClubLogo}
                        isLoading={isUploadingClubLogo}
                      >
                        Upload to Cloudinary
                      </Button>
                    )}

                    {settings?.logos?.clubLogo?.url && !clubLogoFile && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleDeleteClubLogo}
                        disabled={isUploadingClubLogo}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Reset to Default
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Max size 2MB. Supported formats: PNG, WebP, JPEG. Transparent PNG recommended.
                  </p>
                </div>
              </div>

              {/* CARD 2: Mohan Babu University Logo */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] uppercase tracking-widest text-[#F5A623] font-bold block">
                      Institutional Brand
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#0B132B] mt-0.5">
                      Mohan Babu University (MBU) Logo
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Rendered alongside the club badge in header and institutional cards.
                    </p>
                  </div>

                  {/* Logo Preview Area */}
                  <div className="mt-5 p-6 bg-gradient-to-b from-[#0B132B] to-[#1C2541] rounded-xl border border-gray-700 flex flex-col items-center justify-center min-h-[160px] text-center">
                    {univLogoPreview ? (
                      <div>
                        <img
                          src={univLogoPreview}
                          alt="New University Logo Preview"
                          className="max-h-20 max-w-[200px] object-contain mx-auto"
                        />
                        <span className="text-[10px] text-amber-300 mt-2 block font-semibold">
                          Selected Replacement (Unuploaded)
                        </span>
                      </div>
                    ) : settings?.logos?.universityLogo?.url ? (
                      <div>
                        <img
                          src={settings.logos.universityLogo.url}
                          alt={settings.logos.universityLogo.alt || 'Mohan Babu University Logo'}
                          className="max-h-20 max-w-[200px] object-contain mx-auto"
                        />
                        <span className="text-[10px] text-gray-300 mt-2 block">
                          Current Active Logo
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="px-3 py-1 rounded bg-[#1C2541] border border-white/20 text-[#F5A623] text-xs font-bold font-serif">
                          MBU
                        </div>
                        <span className="text-xs text-gray-400">Institutional Typography (Fallback Active)</span>
                      </div>
                    )}
                  </div>

                  {/* Alt Text Field */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Accessibility Alt Text
                    </label>
                    <input
                      type="text"
                      value={universityLogoAlt}
                      onChange={(e) => {
                        setUniversityLogoAlt(e.target.value);
                        markDirty();
                      }}
                      placeholder="Mohan Babu University Logo"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900"
                    />
                  </div>
                </div>

                {/* Upload / Replace Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <input
                    type="file"
                    ref={univFileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleUnivLogoSelect}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => univFileInputRef.current?.click()}
                    >
                      {univLogoPreview || settings?.logos?.universityLogo?.url ? 'Select New Image...' : 'Choose Logo File...'}
                    </Button>

                    {univLogoFile && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleUploadUnivLogo}
                        isLoading={isUploadingUnivLogo}
                      >
                        Upload to Cloudinary
                      </Button>
                    )}

                    {settings?.logos?.universityLogo?.url && !univLogoFile && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleDeleteUnivLogo}
                        disabled={isUploadingUnivLogo}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Reset to Default
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Max size 2MB. Supported formats: PNG, WebP, JPEG. Transparent PNG recommended.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 5: CLUB INFORMATION & CONTACT
             ========================================================================= */}
          {activeSubTab === 'club_info' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Institutional &amp; Campus Coordinates</h3>
                  <p className="text-xs text-gray-500">
                    Official university coordinates displayed on footer, contact page, and email footers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Club Public Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clubName}
                      onChange={(e) => {
                        setClubName(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Affiliated University Name
                    </label>
                    <input
                      type="text"
                      value={universityName}
                      onChange={(e) => {
                        setUniversityName(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Official Club Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Campus Helpdesk Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => {
                        setContactPhone(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Physical Campus Location
                    </label>
                    <input
                      type="text"
                      value={campusLocation}
                      onChange={(e) => {
                        setCampusLocation(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Affiliated Academic Schools
                    </label>
                    <input
                      type="text"
                      value={affiliatedSchools}
                      onChange={(e) => {
                        setAffiliatedSchools(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 6: SOCIAL MEDIA LINKS
             ========================================================================= */}
          {activeSubTab === 'social' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Verified Social Channels</h3>
                  <p className="text-xs text-gray-500">
                    Official URLs linked in the public website header, footer, and community cards. Must be valid HTTP or HTTPS URLs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={instagram}
                      onChange={(e) => {
                        setInstagram(e.target.value);
                        markDirty();
                      }}
                      placeholder="https://instagram.com/anveshana_mbu"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      LinkedIn Company URL
                    </label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => {
                        setLinkedin(e.target.value);
                        markDirty();
                      }}
                      placeholder="https://linkedin.com/company/anveshana-mbu"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      GitHub Organization URL
                    </label>
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => {
                        setGithub(e.target.value);
                        markDirty();
                      }}
                      placeholder="https://github.com/anveshana-mbu"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      X / Twitter URL
                    </label>
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => {
                        setTwitter(e.target.value);
                        markDirty();
                      }}
                      placeholder="https://x.com/anveshana_mbu"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      YouTube Channel URL
                    </label>
                    <input
                      type="url"
                      value={youtube}
                      onChange={(e) => {
                        setYoutube(e.target.value);
                        markDirty();
                      }}
                      placeholder="https://youtube.com/@anveshana"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 7: PUBLIC PAGE CONTENT (Events, Team, Feedback intros)
             ========================================================================= */}
          {activeSubTab === 'pages' && (
            <div className="space-y-8">
              {/* Events Page Header */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Events Catalog Page Header</h3>
                  <p className="text-xs text-gray-500">
                    Controls the banner copy at the top of the public /events listing page.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={pageEventsEyebrow}
                      onChange={(e) => {
                        setPageEventsEyebrow(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={pageEventsTitle}
                      onChange={(e) => {
                        setPageEventsTitle(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Page Description
                    </label>
                    <textarea
                      rows={2}
                      value={pageEventsDescription}
                      onChange={(e) => {
                        setPageEventsDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Team Page Header */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Core Team Directory Page Header</h3>
                  <p className="text-xs text-gray-500">
                    Controls the banner copy at the top of the public /team directory page.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={pageTeamEyebrow}
                      onChange={(e) => {
                        setPageTeamEyebrow(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={pageTeamTitle}
                      onChange={(e) => {
                        setPageTeamTitle(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Page Description
                    </label>
                    <textarea
                      rows={2}
                      value={pageTeamDescription}
                      onChange={(e) => {
                        setPageTeamDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Feedback Page Header & Privacy */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#0B132B]">Feedback &amp; Contact Page Copy</h3>
                  <p className="text-xs text-gray-500">
                    Controls the banner copy and privacy note on the public /feedback page.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={pageFeedbackEyebrow}
                      onChange={(e) => {
                        setPageFeedbackEyebrow(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={pageFeedbackTitle}
                      onChange={(e) => {
                        setPageFeedbackTitle(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Page Description
                    </label>
                    <textarea
                      rows={2}
                      value={pageFeedbackDescription}
                      onChange={(e) => {
                        setPageFeedbackDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Privacy Notice Statement
                    </label>
                    <textarea
                      rows={2}
                      value={pageFeedbackPrivacy}
                      onChange={(e) => {
                        setPageFeedbackPrivacy(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {isDirty ? (
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  You have unsaved changes in this session.
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  All changes currently saved to database.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                >
                  Discard Changes
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
              >
                Save All Changes
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
