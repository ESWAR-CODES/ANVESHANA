import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().optional().default(() => {
    return (
      process.env.CLIENT_URL ||
      process.env.CORS_URL ||
      process.env.CROS_URL ||
      process.env.cros_url ||
      process.env.cors_url ||
      process.env.FRONTEND_URL ||
      'https://anveshana-rho.vercel.app,http://localhost:5173'
    );
  }),
  
  // Database: Optional at import-time to allow offline testing / schema compilation
  MONGO_URI: z.string().optional().default(''),
  
  // Auth & Admin bootstrap
  JWT_SECRET: z.string().default('development_jwt_secret_change_in_production_32chars'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  ADMIN_DEFAULT_EMAIL: z.string().email().optional().default('admin@anveshana-mbu.in'),
  ADMIN_DEFAULT_PASSWORD: z.string().min(8).optional().default('ChangeMeImmediately123!'),
  
  // Cloudinary media
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  // Production cookie & proxy options
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
  COOKIE_SECURE: z.string().optional().transform((val) => val === undefined ? undefined : val === 'true'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[Config] Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Environment configuration error');
}

export const env = parsedEnv.data;

export const isDbConfigured = (): boolean => {
  return Boolean(env.MONGO_URI && env.MONGO_URI.trim().length > 0 && !env.MONGO_URI.includes('<password>'));
};
