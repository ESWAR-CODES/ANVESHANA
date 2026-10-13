import { Request, Response } from 'express';
import { ClubSettings } from '../models/ClubSettings';
import { getDbStatus } from '../config/db';

export const DEFAULT_CLUB_SETTINGS = {
  clubName: 'Anveshana Club',
  tagline: 'Explore · Build · Bring Ideas to Life.',
  mission:
    'A central university club uniting students from the School of Computing and the School of Engineering to foster innovation and cross-disciplinary collaboration.',
  contactEmail: 'anveshana@mbu.edu.in',
  contactPhone: '+91 877 223 6711',
  socialLinks: {
    instagram: 'https://instagram.com/anveshana_mbu',
    linkedin: 'https://linkedin.com/company/anveshana-mbu',
    github: 'https://github.com/anveshana-mbu',
    twitter: null,
    youtube: null,
  },
  isSingleton: true,
};

/**
 * Public: Retrieve club contact details and public metadata.
 * GET /api/v1/settings
 * Safe fail-safe: Returns approved defaults if document missing or database offline.
 */
export const getPublicSettings = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();

  // If database is offline, return safe default settings per specification
  if (!dbStatus.connected) {
    res.status(200).json({
      success: true,
      data: DEFAULT_CLUB_SETTINGS,
      message: 'Default settings loaded (database offline).',
      error: null,
    });
    return;
  }

  try {
    const settings = await ClubSettings.findOne({ isSingleton: true }).lean();
    if (!settings) {
      res.status(200).json({
        success: true,
        data: DEFAULT_CLUB_SETTINGS,
        error: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        clubName: settings.clubName || DEFAULT_CLUB_SETTINGS.clubName,
        tagline: settings.tagline || DEFAULT_CLUB_SETTINGS.tagline,
        mission: settings.mission || DEFAULT_CLUB_SETTINGS.mission,
        contactEmail: settings.contactEmail || DEFAULT_CLUB_SETTINGS.contactEmail,
        contactPhone: settings.contactPhone || DEFAULT_CLUB_SETTINGS.contactPhone,
        socialLinks: settings.socialLinks || DEFAULT_CLUB_SETTINGS.socialLinks,
      },
      error: null,
    });
  } catch (error) {
    // Fail safe to default settings
    res.status(200).json({
      success: true,
      data: DEFAULT_CLUB_SETTINGS,
      error: null,
    });
  }
};

/**
 * Admin: Retrieve full club settings singleton for administrative inspection.
 * GET /api/v1/admin/settings
 */
export const getAdminSettings = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    let settings = await ClubSettings.findOne({ isSingleton: true }).lean();
    if (!settings) {
      // Initialize singleton
      const created = await ClubSettings.create({
        ...DEFAULT_CLUB_SETTINGS,
      });
      settings = created.toObject();
    }

    res.status(200).json({
      success: true,
      data: settings,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve administrative settings.',
    });
  }
};

/**
 * Admin: Update approved club settings fields only.
 * PUT /api/v1/admin/settings
 * 
 * Strict Whitelist Security:
 * Explicitly ignores/disallows changes to global branding, colors, fonts, tagline,
 * mission, team categories, admin accounts, or static homepage copy.
 */
export const updateAdminSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contactEmail, contactPhone, socialLinks } = req.body;
    const updatePayload: Record<string, any> = {};

    // Validate and whitelist contactEmail
    if (contactEmail !== undefined) {
      if (typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Valid contact email is required.',
        });
        return;
      }
      updatePayload.contactEmail = contactEmail.trim().toLowerCase();
    }

    // Whitelist contactPhone
    if (contactPhone !== undefined) {
      updatePayload.contactPhone = typeof contactPhone === 'string' && contactPhone.trim() ? contactPhone.trim() : null;
    }

    // Whitelist socialLinks
    if (socialLinks !== undefined) {
      if (typeof socialLinks !== 'object' || socialLinks === null) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Social links must be an object with supported platforms.',
        });
        return;
      }

      for (const [platform, url] of Object.entries(socialLinks)) {
        if (typeof url === 'string' && url.trim()) {
          try {
            const parsed = new URL(url.trim());
            if (!['http:', 'https:'].includes(parsed.protocol)) {
              res.status(400).json({
                success: false,
                data: null,
                error: `Social link for ${platform} must be a valid HTTP or HTTPS URL.`,
              });
              return;
            }
          } catch {
            res.status(400).json({
              success: false,
              data: null,
              error: `Social link for ${platform} must be a valid HTTP or HTTPS URL.`,
            });
            return;
          }
        }
      }

      updatePayload.socialLinks = {
        instagram: typeof socialLinks.instagram === 'string' && socialLinks.instagram.trim() ? socialLinks.instagram.trim() : null,
        linkedin: typeof socialLinks.linkedin === 'string' && socialLinks.linkedin.trim() ? socialLinks.linkedin.trim() : null,
        github: typeof socialLinks.github === 'string' && socialLinks.github.trim() ? socialLinks.github.trim() : null,
        twitter: typeof socialLinks.twitter === 'string' && socialLinks.twitter.trim() ? socialLinks.twitter.trim() : null,
        youtube: typeof socialLinks.youtube === 'string' && socialLinks.youtube.trim() ? socialLinks.youtube.trim() : null,
      };
    }

    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database service is currently unavailable.',
      });
      return;
    }

    const updatedSettings = await ClubSettings.findOneAndUpdate(
      { isSingleton: true },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Official contact and social link settings updated successfully.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update club settings.',
    });
  }
};
