import dotenv from 'dotenv';
dotenv.config();

const required = ['JWT_SECRET', 'MONGO_URI'];
for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.warn(`[config] WARNING: ${key} is not set — see .env.example`);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/socverse',
  jwtSecret: process.env.JWT_SECRET || 'insecure_dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  alertEngine: {
    enabled: (process.env.ALERT_ENGINE_ENABLED || 'true') === 'true',
    intervalMs: parseInt(process.env.ALERT_ENGINE_INTERVAL_MS || '3500', 10),
  },
};
