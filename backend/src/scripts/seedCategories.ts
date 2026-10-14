import { connectDB, disconnectDB } from '../config/db';
import { TeamCategory } from '../models/TeamCategory';
import { TeamMember } from '../models/TeamMember';

export const REQUIRED_TEAM_CATEGORIES = [
  {
    name: 'Team Leads',
    slug: 'team-leads',
    displayOrder: 1,
    description: 'Executive student leadership guiding club vision, strategy, cross-department coordination, and university liaison.',
  },
  {
    name: 'Champions',
    slug: 'champions',
    displayOrder: 2,
    description: 'Specialist leads and contributors driving technical innovation, design, events, infrastructure, public relations, and club initiatives.',
  },
];

/**
 * Idempotently ensures the 2 simplified categories exist and migrates legacy members to 'champions'.
 */
export const ensureTwoTeamCategoriesAndMigrate = async (): Promise<boolean> => {
  try {
    // 1. Ensure 'Team Leads' category (handle legacy 'leads' slug)
    let leadsCat = await TeamCategory.findOne({
      $or: [{ slug: 'team-leads' }, { slug: 'leads' }, { name: 'Team Leads' }],
    });

    if (leadsCat) {
      leadsCat.name = 'Team Leads';
      leadsCat.slug = 'team-leads';
      leadsCat.displayOrder = 1;
      leadsCat.description = REQUIRED_TEAM_CATEGORIES[0].description;
      leadsCat.isActive = true;
      await leadsCat.save();
    } else {
      leadsCat = await TeamCategory.create({
        name: 'Team Leads',
        slug: 'team-leads',
        displayOrder: 1,
        description: REQUIRED_TEAM_CATEGORIES[0].description,
        isActive: true,
      });
    }

    // 2. Ensure 'Champions' category
    let championsCat = await TeamCategory.findOne({
      $or: [{ slug: 'champions' }, { name: 'Champions' }],
    });

    if (championsCat) {
      championsCat.name = 'Champions';
      championsCat.slug = 'champions';
      championsCat.displayOrder = 2;
      championsCat.description = REQUIRED_TEAM_CATEGORIES[1].description;
      championsCat.isActive = true;
      await championsCat.save();
    } else {
      championsCat = await TeamCategory.create({
        name: 'Champions',
        slug: 'champions',
        displayOrder: 2,
        description: REQUIRED_TEAM_CATEGORIES[1].description,
        isActive: true,
      });
    }

    // 3. Find any other legacy categories
    const otherCategories = await TeamCategory.find({
      _id: { $nin: [leadsCat._id, championsCat._id] },
    });

    if (otherCategories.length > 0) {
      const otherCategoryIds = otherCategories.map((c) => c._id);

      // Migrate all members from legacy categories to Champions
      const migrationResult = await TeamMember.updateMany(
        { categoryId: { $in: otherCategoryIds } },
        { $set: { categoryId: championsCat._id } }
      );

      if (migrationResult.modifiedCount > 0) {
        console.log(
          `[TeamMigration] Idempotently migrated ${migrationResult.modifiedCount} legacy team members to Champions.`
        );
      }

      // Mark legacy categories as inactive
      await TeamCategory.updateMany(
        { _id: { $in: otherCategoryIds } },
        { $set: { isActive: false } }
      );
    }

    // Also safety-migrate any members with dangling category IDs
    await TeamMember.updateMany(
      { categoryId: { $nin: [leadsCat._id, championsCat._id] } },
      { $set: { categoryId: championsCat._id } }
    );

    return true;
  } catch (error) {
    console.error('[TeamMigration] Error during team category migration:', error);
    return false;
  }
};

export const seedCategories = async (): Promise<boolean> => {
  console.log('[Seed] Seeding 2 Required Team Categories (Team Leads & Champions)...');

  const connected = await connectDB();
  if (!connected) {
    console.error('[Seed] Database connection unavailable. Cannot seed categories without MongoDB Atlas connection.');
    return false;
  }

  try {
    const success = await ensureTwoTeamCategoriesAndMigrate();
    if (success) {
      console.log(`[Seed] Successfully synchronized both required team categories.`);
    }
    return success;
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
