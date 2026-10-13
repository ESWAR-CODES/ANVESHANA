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

export const uploadBanner = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit
  },
  fileFilter,
}).single('banner');

/**
 * Express wrapper handling Multer file upload errors gracefully.
 */
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
