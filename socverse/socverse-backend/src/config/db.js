import mongoose from 'mongoose';
import { config } from './index.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  const uri = config.mongoUri;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      // eslint-disable-next-line no-console
      console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
      return mongoose.connection;
    } catch (err) {
      attempts += 1;
      // eslint-disable-next-line no-console
      console.error(`[db] connection attempt ${attempts}/${maxAttempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
