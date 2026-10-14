import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from './env';

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET &&
      env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads a memory buffer to Cloudinary with automatic optimization.
 * Downscales images to max 1920px width and compresses.
 */
export const uploadImageBuffer = async (
  buffer: Buffer,
  folder = 'anveshana/events'
): Promise<{ publicId: string; url: string }> => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please supply Cloudinary credentials in .env');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1920, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          const errMsg =
            (error as any)?.message ||
            (typeof error === 'string' ? error : 'Cloudinary upload returned empty response');
          const errObj = new Error(errMsg);
          if (error && typeof error === 'object') {
            Object.assign(errObj, error);
          }
          return reject(errObj);
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
        });
      }
    );

    uploadStream.on('error', (err: any) => {
      const errMsg = err?.message || 'Cloudinary upload stream failed';
      const errObj = new Error(errMsg);
      if (err && typeof err === 'object') {
        Object.assign(errObj, err);
      }
      reject(errObj);
    });

    uploadStream.end(buffer);
  });
};

/**
 * Deletes an existing Cloudinary asset by publicId.
 */
export const deleteCloudinaryImage = async (publicId: string): Promise<boolean> => {
  if (!isCloudinaryConfigured() || !publicId) {
    return false;
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (error) {
    console.warn(`[Cloudinary] Failed to delete image ${publicId}:`, error instanceof Error ? error.message : error);
    return false;
  }
};
