/**
 * URL Sanitizer preventing XSS via dangerous schemes (javascript:, data:, vbscript:).
 * Only permits valid web protocols (https://, http://), relative paths (/), mailto:, and tel:.
 */
export const sanitizeUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return '#';
};
