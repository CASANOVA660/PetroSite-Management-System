# Build stage
FROM node:20.14.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Production stage
FROM node:18.19.0-alpine

# Install production dependencies only
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app ./

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "server.js"]
