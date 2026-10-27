/**
 * Sanitization utilities for Anveshana Club Backend.
 */

/**
 * Escapes special regex characters in a user-supplied string
 * to prevent ReDoS (Regular Expression Denial of Service) and NoSQL regex pattern injection.
 */
export function escapeRegex(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
