import { Schema, model } from 'mongoose';
import { IClubSettings } from '../types/models';

const SocialLinksSchema = new Schema(
  {
    instagram: { type: String, default: null, trim: true },
    linkedin: { type: String, default: null, trim: true },
    github: { type: String, default: null, trim: true },
    twitter: { type: String, default: null, trim: true },
    youtube: { type: String, default: null, trim: true },
  },
  { _id: false }
);

const LogoAssetSchema = new Schema(
  {
    url: { type: String, default: null, trim: true },
    publicId: { type: String, default: null, trim: true },
    alt: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const ClubLogosSchema = new Schema(
  {
    clubLogo: { type: LogoAssetSchema, default: null },
    universityLogo: { type: LogoAssetSchema, default: null },
  },
  { _id: false }
);

const HeroSettingsSchema = new Schema(
  {
    eyebrow: { type: String, default: 'Mohan Babu University · Tirupati', trim: true },
    title: { type: String, default: 'ANVESHANA', trim: true },
    tagline: { type: String, default: 'Explore · Build · Bring Ideas to Life.', trim: true },
    description: {
      type: String,
      default:
        'The premier central student club uniting the School of Computing and the School of Engineering. Fostering multidisciplinary hackathons, technological breakthroughs, and engineering leadership.',
      trim: true,
    },
    primaryCtaText: { type: String, default: 'Explore Events', trim: true },
    primaryCtaLink: { type: String, default: '/events', trim: true },
    secondaryCtaText: { type: String, default: 'Meet the Core Team', trim: true },
    secondaryCtaLink: { type: String, default: '/team', trim: true },
    backgroundImage: {
      type: new Schema({ url: String, publicId: String }, { _id: false }),
      default: null,
    },
  },
  { _id: false }
);

const StatItemSchema = new Schema(
  {
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const PillarItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AboutSettingsSchema = new Schema(
  {
    eyebrow: { type: String, default: 'Our Central Mission', trim: true },
    heading: { type: String, default: 'Bridging Computing and Engineering.', trim: true },
    description: {
      type: String,
      default:
        'At Mohan Babu University, innovation does not happen in silos. Anveshana acts as the central catalyst connecting coders, makers, researchers, and designers across disciplines.',
      trim: true,
    },
    subDescription: {
      type: String,
      default:
        'Whether you are optimizing cloud infrastructure, soldering embedded sensors, or designing intuitive user experiences, Anveshana is your playground to explore ideas and bring them to life.',
      trim: true,
    },
    calloutTitle: { type: String, default: 'Frictionless Student Access', trim: true },
    calloutText: {
      type: String,
      default:
        'No accounts or login barriers required. Every student at MBU has immediate access to discover upcoming events, explore team leads, view hackathon galleries, and register natively.',
      trim: true,
    },
    pillars: {
      type: [PillarItemSchema],
      default: [
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
  },
  { _id: false }
);

const HomeEventsSectionSchema = new Schema(
  {
    eyebrow: { type: String, default: 'Explore Opportunities', trim: true },
    heading: { type: String, default: 'Upcoming Events & Hackathons', trim: true },
    description: {
      type: String,
      default:
        'Discover workshops, hackathons, and symposiums hosted on campus. Native registration opens prior to each event.',
      trim: true,
    },
    ctaText: { type: String, default: 'View Full Event Catalog →', trim: true },
  },
  { _id: false }
);

const HomeCtaSectionSchema = new Schema(
  {
    eyebrow: { type: String, default: 'Mohan Babu University Community', trim: true },
    heading: { type: String, default: 'Ready to Build Your Next Breakthrough?', trim: true },
    description: {
      type: String,
      default:
        'Whether you want to lead an engineering team, compete in a national hackathon, or provide event feedback, Anveshana is here for you.',
      trim: true,
    },
    primaryCtaText: { type: String, default: 'Browse All Events', trim: true },
    primaryCtaLink: { type: String, default: '/events', trim: true },
    secondaryCtaText: { type: String, default: 'Share Your Feedback', trim: true },
    secondaryCtaLink: { type: String, default: '/feedback', trim: true },
  },
  { _id: false }
);

const NavbarLinkSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    isVisible: { type: Boolean, default: true },
  },
  { _id: false }
);

const NavbarSettingsSchema = new Schema(
  {
    links: {
      type: [NavbarLinkSchema],
      default: [
        { name: 'Home', path: '/', isVisible: true },
        { name: 'Events', path: '/events', isVisible: true },
        { name: 'Team', path: '/team', isVisible: true },
        { name: 'Feedback', path: '/feedback', isVisible: true },
      ],
    },
    ctaText: { type: String, default: 'Explore Events', trim: true },
    ctaLink: { type: String, default: '/events', trim: true },
  },
  { _id: false }
);

const FooterSettingsSchema = new Schema(
  {
    aboutText: {
      type: String,
      default:
        'The premier central university club bridging students from the School of Computing and the School of Engineering. We foster hands-on engineering, collaborative hackathons, and technical innovation.',
      trim: true,
    },
    copyrightText: {
      type: String,
      default: '© Anveshana Club · Mohan Babu University. All rights reserved.',
      trim: true,
    },
  },
  { _id: false }
);

const PageTextSchema = new Schema(
  {
    eyebrow: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    privacyNotice: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const PagesContentSchema = new Schema(
  {
    events: {
      type: PageTextSchema,
      default: () => ({
        eyebrow: 'Events & Opportunities',
        title: 'Our Events',
        description:
          'Explore, Learn, Participate and Be a Part of Amazing Events bridging computing innovation and engineering leadership at Mohan Babu University.',
      }),
    },
    team: {
      type: PageTextSchema,
      default: () => ({
        eyebrow: 'Leadership & Wings',
        title: 'Core Team Directory',
        description:
          'Meet the dedicated students across the 7 specialized wings driving Anveshana Club at Mohan Babu University.',
      }),
    },
    feedback: {
      type: PageTextSchema,
      default: () => ({
        eyebrow: 'Community Voices & Rating',
        title: 'Feedback & Contact',
        description:
          'Share your experiences, recommend topics, or reach out to our campus desk.',
        privacyNotice:
          'Submissions do not require student login. Verified reviews are moderated before being aggregated into public ratings.',
      }),
    },
  },
  { _id: false }
);

const ClubSettingsSchema = new Schema<IClubSettings>(
  {
    clubName: {
      type: String,
      default: 'Anveshana Club',
      trim: true,
    },
    universityName: {
      type: String,
      default: 'Mohan Babu University',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Explore · Build · Bring Ideas to Life.',
      trim: true,
    },
    mission: {
      type: String,
      default:
        'A central university club uniting students from the School of Computing and the School of Engineering to foster innovation and cross-disciplinary collaboration.',
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      default: 'anveshana@mbu.edu.in',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+91 877 223 6711',
      trim: true,
    },
    campusLocation: {
      type: String,
      default: 'Sree Sainath Nagar, Tirupati, Andhra Pradesh - 517102',
      trim: true,
    },
    affiliatedSchools: {
      type: String,
      default: 'School of Computing & School of Engineering',
      trim: true,
    },
    socialLinks: {
      type: SocialLinksSchema,
      default: () => ({}),
    },
    logos: {
      type: ClubLogosSchema,
      default: () => ({}),
    },
    hero: {
      type: HeroSettingsSchema,
      default: () => ({}),
    },
    stats: {
      type: [StatItemSchema],
      default: [
        { value: '2', label: 'Premier Schools', description: 'Computing & Engineering' },
        { value: '7', label: 'Core Wings', description: 'Cross-functional operations' },
        { value: '100%', label: 'Hands-On Practice', description: 'Workshops & projects' },
        { value: 'Open', label: 'Student Access', description: 'Frictionless participation' },
      ],
    },
    about: {
      type: AboutSettingsSchema,
      default: () => ({}),
    },
    homeEventsSection: {
      type: HomeEventsSectionSchema,
      default: () => ({}),
    },
    homeCtaSection: {
      type: HomeCtaSectionSchema,
      default: () => ({}),
    },
    navbar: {
      type: NavbarSettingsSchema,
      default: () => ({}),
    },
    footer: {
      type: FooterSettingsSchema,
      default: () => ({}),
    },
    pagesContent: {
      type: PagesContentSchema,
      default: () => ({}),
    },
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ClubSettings = model<IClubSettings>('ClubSettings', ClubSettingsSchema);

