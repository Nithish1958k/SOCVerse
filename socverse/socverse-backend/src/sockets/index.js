import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { SOCKET_EVENTS } from '../utils/constants.js';
import { computeMetrics } from '../services/metricsService.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.clientOrigin, methods: ['GET', 'POST'] },
  });

  // Authenticate the socket handshake with the same JWT used for REST.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.user = { id: payload.sub, role: payload.role, name: payload.name };
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a role-scoped room so we can target tier-specific broadcasts later.
    socket.join(`role:${socket.user.role}`);
    // eslint-disable-next-line no-console
    console.log(`[socket] ${socket.user.name} (${socket.user.role}) connected`);

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log(`[socket] ${socket.user.name} disconnected`);
    });
  });

  // Periodically push refreshed metrics to all clients.
  setInterval(async () => {
    if (!io.engine.clientsCount) return;
    try {
      const metrics = await computeMetrics();
      io.emit(SOCKET_EVENTS.METRICS, metrics);
    } catch {
      /* swallow metric push errors */
    }
  }, 5000);

  return io;
}

export function getIO() {
  return io;
}
