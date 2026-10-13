import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { Administrator } from '../models/Administrator';
import { hashPassword } from '../utils/password';

export const seedAdmin = async (): Promise<boolean> => {
  console.log('[Seed] Starting Administrator Seed Process...');

  const connected = await connectDB();
  if (!connected) {
    console.error('[Seed] Database connection unavailable. Cannot seed administrator without MongoDB Atlas connection.');
    return false;
  }

  const email = env.ADMIN_DEFAULT_EMAIL?.toLowerCase().trim();
  const password = env.ADMIN_DEFAULT_PASSWORD;

  if (!email || !password) {
    console.error('[Seed] Error: ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD is missing in environment variables.');
    return false;
  }

  try {
    // Check if any administrator with this email already exists
    const existingAdmin = await Administrator.findOne({ email });

    if (existingAdmin) {
      console.log(`[Seed] Administrator account (${email}) already exists. Duplicate bootstrap prevented.`);
      return true;
    }

    // Securely hash password using bcrypt
    const passwordHash = await hashPassword(password);

    await Administrator.create({
      email,
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    console.log(`[Seed] Successfully created initial administrator account: ${email}`);
    // Credentials/passwords are never logged or exposed
    return true;
  } catch (error) {
    console.error('[Seed] Failed to seed administrator:', error instanceof Error ? error.message : error);
    return false;
  }
};

// Execute directly if run via CLI
if (require.main === module) {
  seedAdmin()
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
