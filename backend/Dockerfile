# ==========================================
# Anveshana Club Backend - Production Dockerfile
# Multi-stage, lean, Alpine-based Node.js runtime
# ==========================================

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cached unless package files change)
COPY package*.json ./
RUN npm ci

# Copy TypeScript configuration and source files
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in /dist
RUN npm run build

# Prune development dependencies for minimal production footprint
RUN npm prune --omit=dev

# Stage 2: Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Security: Run as unprivileged node user
USER node

# Copy built application and production dependencies from builder
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 5000

# Native healthcheck using Node's built-in fetch / http
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
