import { describe, it, expect } from 'vitest';
import { slugify } from '../utils/slugify';

describe('Slugify Utility', () => {
  it('converts event titles to clean URL-safe slugs', () => {
    expect(slugify('Anveshana Hackathon 2026')).toBe('anveshana-hackathon-2026');
    expect(slugify('AI / ML Hands-on Workshop! (#1)')).toBe('ai-ml-hands-on-workshop-1');
    expect(slugify('  Spaced   Out   Title  ')).toBe('spaced-out-title');
    expect(slugify('Special@$%Characters&*()')).toBe('specialcharacters');
  });
});
