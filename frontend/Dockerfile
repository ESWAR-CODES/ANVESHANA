# ==========================================
# Anveshana Club Frontend - Production Dockerfile
# Multi-stage build with Nginx Alpine static web server
# ==========================================

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cached)
COPY package*.json ./
RUN npm ci

# Copy source code and static assets
COPY . .

# Build argument for backend API URL injected at build time
ARG VITE_API_URL="http://localhost:5000"
ENV VITE_API_URL=${VITE_API_URL}

# Compile TypeScript and build production bundle with Vite
RUN npm run build

# Stage 2: Runtime static web server
FROM nginx:alpine AS runner

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
