import { connectDB, disconnectDB } from '../config/db';
import { TeamCategory } from '../models/TeamCategory';

export const REQUIRED_TEAM_CATEGORIES = [
  {
    name: 'Team Leads',
    slug: 'leads',
    displayOrder: 1,
    description: 'Executive leadership guiding club vision, cross-department coordination, and university liaison.',
  },
  {
    name: 'Infrastructure',
    slug: 'infra',
    displayOrder: 2,
    description: 'Logistics, hardware resources, event venues, and physical operations.',
  },
  {
    name: 'Design',
    slug: 'design',
    displayOrder: 3,
    description: 'Creative direction, visual brand identity, UI/UX design, and event promotional graphics.',
  },
  {
    name: 'Data Management',
    slug: 'data',
    displayOrder: 4,
    description: 'Event registration data pipelines, participant databases, records, and club analytics.',
  },
  {
    name: 'Social Media',
    slug: 'social',
    displayOrder: 5,
    description: 'Online community building, event announcements, storytelling, and campus digital campaigns.',
  },
  {
    name: 'Public Relations',
    slug: 'pr',
    displayOrder: 6,
    description: 'Inter-department outreach, faculty coordination, student advocacy, and institutional relations.',
  },
  {
    name: 'Technical',
    slug: 'tech',
    displayOrder: 7,
    description: 'Software architecture, web platforms, hackathon problem statements, and coding workshops.',
  },
];

export const seedCategories = async (): Promise<boolean> => {
  console.log('[Seed] Seeding 7 Required Team Categories...');

  const connected = await connectDB();
  if (!connected) {
    console.error('[Seed] Database connection unavailable. Cannot seed categories without MongoDB Atlas connection.');
    return false;
  }

  try {
    for (const cat of REQUIRED_TEAM_CATEGORIES) {
      await TeamCategory.findOneAndUpdate(
        { slug: cat.slug },
        {
          $set: {
            name: cat.name,
            displayOrder: cat.displayOrder,
            description: cat.description,
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`[Seed] Successfully synchronized all ${REQUIRED_TEAM_CATEGORIES.length} required team categories.`);
    return true;
  } catch (error) {
    console.error('[Seed] Failed to seed categories:', error instanceof Error ? error.message : error);
    return false;
  }
};

if (require.main === module) {
  seedCategories()
    .then(async (success) => {
      await disconnectDB();
      process.exit(success ? 0 : 1);
    })
    .catch(async (err) => {
      console.error('[Seed] Fatal error:', err);
      await disconnectDB();
      process.exit(1);
    });
}
