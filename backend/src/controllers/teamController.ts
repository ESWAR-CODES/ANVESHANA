import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TeamCategory } from '../models/TeamCategory';
import { TeamMember } from '../models/TeamMember';
import { getDbStatus } from '../config/db';
import { uploadImageBuffer, deleteCloudinaryImage } from '../config/cloudinary';
import { REQUIRED_TEAM_CATEGORIES } from '../scripts/seedCategories';

/**
 * Public: Retrieve active team categories and their published team members.
 * GET /api/v1/team
 */
export const getPublicTeam = async (_req: Request, res: Response): Promise<void> => {
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
    const [categories, members] = await Promise.all([
      TeamCategory.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
      TeamMember.find({ isPublished: true, isDeleted: false })
        .sort({ displayOrder: 1, createdAt: 1 })
        .lean(),
    ]);

    // Group members under their respective categories
    const categoriesWithMembers = categories.map((cat) => {
      const catMembers = members.filter(
        (m) => m.categoryId.toString() === cat._id.toString()
      );
      return {
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        members: catMembers.map((m) => ({
          id: m._id,
          name: m.name,
          designation: m.designation,
          biography: m.biography,
          profileMedia: m.profileMedia,
          linkedinUrl: m.linkedinUrl,
          githubUrl: m.githubUrl,
          portfolioUrl: m.portfolioUrl,
          displayOrder: m.displayOrder,
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithMembers,
        totalMembers: members.length,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve team directory.',
    });
  }
};

/**
 * Admin: Retrieve the 7 predefined Team Categories.
 * GET /api/v1/admin/team/categories
 */
export const getAdminTeamCategories = async (_req: Request, res: Response): Promise<void> => {
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
    let categories = await TeamCategory.find().sort({ displayOrder: 1 }).lean();

    // Auto-seed if categories are missing
    if (categories.length === 0) {
      for (const cat of REQUIRED_TEAM_CATEGORIES) {
        await TeamCategory.findOneAndUpdate(
          { slug: cat.slug },
          { $set: { ...cat, isActive: true } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      categories = await TeamCategory.find().sort({ displayOrder: 1 }).lean();
    }

    res.status(200).json({
      success: true,
      data: categories,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve team categories.',
    });
  }
};

/**
 * Admin: Retrieve paginated core team members with category filters and search.
 * GET /api/v1/admin/team/members
 */
export const getAdminTeamMembers = async (req: Request, res: Response): Promise<void> => {
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
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 30));
    const skip = (page - 1) * limit;

    const { categoryId, search, status } = req.query;
    const filter: any = { isDeleted: false };

    if (categoryId && typeof categoryId === 'string' && mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = categoryId;
    }

    if (status === 'published') {
      filter.isPublished = true;
    } else if (status === 'draft') {
      filter.isPublished = false;
    }

    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { designation: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [members, total] = await Promise.all([
      TeamMember.find(filter)
        .populate('categoryId', 'name slug')
        .sort({ displayOrder: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TeamMember.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        members,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve team members.',
    });
  }
};

/**
 * Admin: Create a new core team member with optional profile photo (2 MB Limit).
 * POST /api/v1/admin/team/members
 */
export const createAdminTeamMember = async (req: Request, res: Response): Promise<void> => {
  const { name, designation, categoryId, biography, linkedinUrl, githubUrl, portfolioUrl, displayOrder, isPublished } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Team member name is required (at least 2 characters).',
    });
    return;
  }

  if (!designation || typeof designation !== 'string' || designation.trim().length < 2) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Member designation / role title is required.',
    });
    return;
  }

  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Valid team category reference is required.',
    });
    return;
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

  try {
    // Validate category exists in database
    const categoryExists = await TeamCategory.findById(categoryId);
    if (!categoryExists) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Selected team category not found.',
      });
      return;
    }

    let profileMedia = null;
    if (req.file) {
      const uploadRes = await uploadImageBuffer(req.file.buffer, 'anveshana/team');
      profileMedia = {
        publicId: uploadRes.publicId,
        url: uploadRes.url,
      };
    }

    const member = new TeamMember({
      categoryId,
      name: name.trim(),
      designation: designation.trim(),
      biography: typeof biography === 'string' ? biography.trim().slice(0, 300) : null,
      profileMedia,
      linkedinUrl: typeof linkedinUrl === 'string' && linkedinUrl.trim() ? linkedinUrl.trim() : null,
      githubUrl: typeof githubUrl === 'string' && githubUrl.trim() ? githubUrl.trim() : null,
      portfolioUrl: typeof portfolioUrl === 'string' && portfolioUrl.trim() ? portfolioUrl.trim() : null,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isPublished: isPublished === false || isPublished === 'false' ? false : true,
      isDeleted: false,
    });

    await member.save();

    res.status(201).json({
      success: true,
      data: member,
      message: `Team member "${member.name}" added successfully.`,
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to create team member.',
    });
  }
};

/**
 * Admin: Update an existing core team member profile.
 * PUT /api/v1/admin/team/members/:id
 */
export const updateAdminTeamMember = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idStr = Array.isArray(id) ? id[0] : id;

  if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid team member identifier format.',
    });
    return;
  }

  const { name, designation, categoryId, biography, linkedinUrl, githubUrl, portfolioUrl, displayOrder, isPublished } = req.body;

  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid category identifier format.',
    });
    return;
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

  try {
    const member = await TeamMember.findOne({ _id: idStr, isDeleted: false });
    if (!member) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Team member record not found.',
      });
      return;
    }

    if (categoryId) {
      const catExists = await TeamCategory.findById(categoryId);
      if (!catExists) {
        res.status(404).json({
          success: false,
          data: null,
          error: 'Team category not found.',
        });
        return;
      }
      member.categoryId = categoryId;
    }

    if (name && typeof name === 'string') member.name = name.trim();
    if (designation && typeof designation === 'string') member.designation = designation.trim();
    if (biography !== undefined) member.biography = typeof biography === 'string' ? biography.trim().slice(0, 300) : null;
    if (linkedinUrl !== undefined) member.linkedinUrl = linkedinUrl ? String(linkedinUrl).trim() : null;
    if (githubUrl !== undefined) member.githubUrl = githubUrl ? String(githubUrl).trim() : null;
    if (portfolioUrl !== undefined) member.portfolioUrl = portfolioUrl ? String(portfolioUrl).trim() : null;
    if (displayOrder !== undefined) member.displayOrder = parseInt(displayOrder, 10) || 0;
    if (isPublished !== undefined) member.isPublished = Boolean(isPublished);

    // Handle new photo replacement
    if (req.file) {
      const oldPublicId = member.profileMedia?.publicId;
      const uploadRes = await uploadImageBuffer(req.file.buffer, 'anveshana/team');
      member.profileMedia = {
        publicId: uploadRes.publicId,
        url: uploadRes.url,
      };
      if (oldPublicId) {
        deleteCloudinaryImage(oldPublicId).catch(() => {});
      }
    }

    await member.save();

    res.status(200).json({
      success: true,
      data: member,
      message: `Updated profile for "${member.name}".`,
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to update team member.',
    });
  }
};

/**
 * Admin: Toggle publication state of a team member.
 * PATCH /api/v1/admin/team/members/:id/publish
 */
export const togglePublishTeamMember = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idStr = Array.isArray(id) ? id[0] : id;

  if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid team member identifier format.',
    });
    return;
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

  try {
    const member = await TeamMember.findOne({ _id: idStr, isDeleted: false });
    if (!member) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Team member record not found.',
      });
      return;
    }

    member.isPublished = !member.isPublished;
    await member.save();

    res.status(200).json({
      success: true,
      data: {
        id: member._id,
        isPublished: member.isPublished,
      },
      message: `Team member is now ${member.isPublished ? 'published' : 'hidden'}.`,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to toggle publication status.',
    });
  }
};

/**
 * Admin: Soft-archive / soft-delete a team member profile.
 * DELETE /api/v1/admin/team/members/:id
 */
export const deleteAdminTeamMember = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idStr = Array.isArray(id) ? id[0] : id;

  if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid team member identifier format.',
    });
    return;
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

  try {
    const member = await TeamMember.findOne({ _id: idStr, isDeleted: false });
    if (!member) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Team member record not found.',
      });
      return;
    }

    // Soft-archive to preserve auditability per specification
    member.isDeleted = true;
    member.isPublished = false;
    await member.save();

    res.status(200).json({
      success: true,
      data: null,
      message: `Team member "${member.name}" was soft-archived successfully.`,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete team member.',
    });
  }
};
