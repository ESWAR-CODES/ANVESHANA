import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a candidate plaintext password with a stored bcrypt hash.
 */
export const comparePassword = async (candidatePassword: string, hash: string): Promise<boolean> => {
  if (!candidatePassword || !hash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, hash);
};
