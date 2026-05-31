import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp(io) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  // Make the Socket.IO instance available to controllers via req.io
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  // Basic abuse protection on the API surface
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/', (_req, res) => res.json({ name: 'SOCVerse API', version: '1.0.0', docs: '/api/health' }));
  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
