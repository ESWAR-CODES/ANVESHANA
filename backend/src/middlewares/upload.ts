import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
    );
  }
};

// Memory storage for direct buffer streaming to Cloudinary
const memoryStorage = multer.memoryStorage();

/* =========================================================================
   1. Event Banner Upload (2 MB Limit)
   ========================================================================= */
export const uploadBanner = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit
  },
  fileFilter,
}).single('banner');

export const handleBannerUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadBanner(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Image file size exceeds the 2MB limit.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        data: null,
        error: `File upload error: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        data: null,
        error: err.message || 'Error uploading file',
      });
      return;
    }
    next();
  });
};

/* =========================================================================
   2. Event Gallery Photo Upload (5 MB Limit)
   ========================================================================= */
export const uploadGalleryPhoto = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit per photo
  },
  fileFilter,
}).single('image');

export const handleGalleryPhotoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadGalleryPhoto(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Gallery photo file size exceeds the 5MB limit.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        data: null,
        error: `Gallery upload error: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        data: null,
        error: err.message || 'Error uploading gallery photo',
      });
      return;
    }
    next();
  });
};

/* =========================================================================
   3. Team Member Profile Photo Upload (2 MB Limit)
   ========================================================================= */
export const uploadTeamPhoto = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit
  },
  fileFilter,
}).single('profileImage');

export const handleTeamPhotoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadTeamPhoto(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Profile photo file size exceeds the 2MB limit.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        data: null,
        error: `Team photo upload error: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        data: null,
        error: err.message || 'Error uploading profile photo',
      });
      return;
    }
    next();
  });
};

/* =========================================================================
   4. Organization & University Logo Upload (2 MB Limit)
   ========================================================================= */
export const uploadLogo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit
  },
  fileFilter,
}).single('logo');

export const handleLogoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadLogo(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Logo file size exceeds the 2MB limit.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        data: null,
        error: `Logo upload error: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        data: null,
        error: err.message || 'Error uploading logo image',
      });
      return;
    }
    next();
  });
};

/* =========================================================================
   5. Homepage Hero Background Image Upload (5 MB Limit)
   ========================================================================= */
export const uploadHeroBackground = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit for high-res hero backdrop
  },
  fileFilter,
}).single('heroBackground');

export const handleHeroBackgroundUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadHeroBackground(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Hero background image file size exceeds the 5MB limit.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        data: null,
        error: `Hero background upload error: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        data: null,
        error: err.message || 'Error uploading hero background image',
      });
      return;
    }
    next();
  });
};

