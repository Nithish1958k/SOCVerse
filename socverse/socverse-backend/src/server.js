import http from 'http';
import { config } from './config/index.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { initSocket } from './sockets/index.js';
import { startAlertEngine, stopAlertEngine } from './services/alertEngine.js';

async function bootstrap() {
  await connectDB();

  // Create HTTP server first so Socket.IO can attach to it.
  const httpServer = http.createServer();
  const io = initSocket(httpServer);

  // Build the Express app with io injected, then mount it on the server.
  const app = createApp(io);
  httpServer.on('request', app);

  httpServer.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] SOCVerse API listening on http://localhost:${config.port} (${config.env})`);
    startAlertEngine(io);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n[server] ${signal} received — shutting down`);
    stopAlertEngine();
    httpServer.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if connections linger
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
