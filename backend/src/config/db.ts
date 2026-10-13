import mongoose from 'mongoose';
import { env, isDbConfigured } from './env';

export interface DbStatus {
  configured: boolean;
  connected: boolean;
  state: string;
}

const stateNames: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getDbStatus = (): DbStatus => {
  const readyState = mongoose.connection.readyState;
  return {
    configured: isDbConfigured(),
    connected: readyState === 1,
    state: stateNames[readyState] || 'unknown',
  };
};

export const connectDB = async (): Promise<boolean> => {
  if (!isDbConfigured()) {
    console.warn('[Database] Notice: MONGO_URI is not configured in backend/.env. Database operations are currently offline.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log('[Database] Successfully connected to MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB');
  }
};

// Graceful termination handling
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});
