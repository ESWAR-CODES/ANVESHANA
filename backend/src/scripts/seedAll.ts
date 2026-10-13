import { connectDB, disconnectDB } from '../config/db';
import { seedCategories } from './seedCategories';
import { ClubSettings } from '../models/ClubSettings';

export const seedSettings = async (): Promise<boolean> => {
  try {
    const existing = await ClubSettings.findOne({ isSingleton: true });
    if (!existing) {
      await ClubSettings.create({
        clubName: 'Anveshana Club',
        tagline: 'Explore · Build · Bring Ideas to Life.',
        mission:
          'A central university club uniting students from the School of Computing and the School of Engineering to foster innovation and cross-disciplinary collaboration.',
        contactEmail: 'anveshana@mbu.edu.in',
        contactPhone: null,
        socialLinks: {
          instagram: 'https://instagram.com/anveshana_mbu',
          linkedin: 'https://linkedin.com/company/anveshana-mbu',
          github: 'https://github.com/anveshana-mbu',
        },
        isSingleton: true,
      });
      console.log('[Seed] Default ClubSettings initialized.');
    } else {
      console.log('[Seed] ClubSettings already exists.');
    }
    return true;
  } catch (error) {
    console.error('[Seed] Failed to seed ClubSettings:', error instanceof Error ? error.message : error);
    return false;
  }
};

export const seedAll = async (): Promise<boolean> => {
  console.log('[Seed] Starting database seed routine (Categories & Settings)...');
  const connected = await connectDB();
  if (!connected) {
    console.error('[Seed] Database connection unavailable. Cannot seed without MongoDB Atlas connection.');
    return false;
  }

  const catSuccess = await seedCategories();
  const settingsSuccess = await seedSettings();

  console.log('[Seed] Completed baseline seeding.');
  return catSuccess && settingsSuccess;
};

if (require.main === module) {
  seedAll()
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
