export interface SocialLinks {
  instagram?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  youtube?: string | null;
}

export interface LogoAsset {
  url: string;
  publicId?: string | null;
  alt?: string;
}

export interface ClubLogos {
  clubLogo?: LogoAsset | null;
  universityLogo?: LogoAsset | null;
}

export interface HeroSettings {
  eyebrow?: string;
  title?: string;
  tagline?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundImage?: { url: string; publicId: string } | null;
}

export interface StatItem {
  value: string;
  label: string;
  description?: string;
}

export interface PillarItem {
  title: string;
  description: string;
}

export interface AboutSettings {
  eyebrow?: string;
  heading?: string;
  description?: string;
  subDescription?: string;
  calloutTitle?: string;
  calloutText?: string;
  pillars?: PillarItem[];
}

export interface HomeEventsSection {
  eyebrow?: string;
  heading?: string;
  description?: string;
  ctaText?: string;
}

export interface HomeCtaSection {
  eyebrow?: string;
  heading?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export interface NavbarLink {
  name: string;
  path: string;
  isVisible: boolean;
}

export interface NavbarSettings {
  links?: NavbarLink[];
  ctaText?: string;
  ctaLink?: string;
}

export interface FooterSettings {
  aboutText?: string;
  copyrightText?: string;
}

export interface PagesContent {
  events?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  team?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  feedback?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    privacyNotice?: string;
  };
}

export interface ClubSettings {
  _id?: string;
  clubName: string;
  universityName?: string;
  tagline: string;
  mission: string;
  contactEmail: string;
  contactPhone?: string | null;
  campusLocation?: string;
  affiliatedSchools?: string;
  socialLinks: SocialLinks;
  logos?: ClubLogos;
  hero?: HeroSettings;
  stats?: StatItem[];
  about?: AboutSettings;
  homeEventsSection?: HomeEventsSection;
  homeCtaSection?: HomeCtaSection;
  navbar?: NavbarSettings;
  footer?: FooterSettings;
  pagesContent?: PagesContent;
  isSingleton?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsPayload {
  clubName?: string;
  universityName?: string;
  tagline?: string;
  mission?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  campusLocation?: string;
  affiliatedSchools?: string;
  socialLinks?: SocialLinks;
  hero?: HeroSettings;
  stats?: StatItem[];
  about?: AboutSettings;
  homeEventsSection?: HomeEventsSection;
  homeCtaSection?: HomeCtaSection;
  navbar?: NavbarSettings;
  footer?: FooterSettings;
  pagesContent?: PagesContent;
  logos?: {
    clubLogo?: { alt?: string };
    universityLogo?: { alt?: string };
  };
}
