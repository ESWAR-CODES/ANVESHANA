import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../utils/password';

describe('Password Utilities', () => {
  it('hashes password securely and verifies candidate password correctly', async () => {
    const raw = 'SecureClubPassword123!';
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(raw);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await comparePassword(raw, hash);
    expect(matches).toBe(true);

    const wrongMatches = await comparePassword('WrongPassword123!', hash);
    expect(wrongMatches).toBe(false);
  });

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters long');
  });

  it('handles empty candidates safely', async () => {
    const matches = await comparePassword('', '$2a$12$somevalidlengthmockhashstringhere...');
    expect(matches).toBe(false);
  });
});
