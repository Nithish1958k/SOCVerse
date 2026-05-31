# ─── SOCVerse API ─────────────────────────────────────────
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

# Drop root privileges
USER node

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/server.js"]
