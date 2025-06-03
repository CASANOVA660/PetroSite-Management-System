# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy-peer-deps flag to resolve conflicts
RUN npm ci --legacy-peer-deps

# Copy all files
COPY . .

# Production stage
FROM node:20-alpine

# Install production dependencies only
WORKDIR /app

# Copy package files for caching purposes
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Create necessary directories
RUN mkdir -p /app/uploads
RUN mkdir -p /app/logs

# Copy built files from builder
COPY --from=builder /app ./

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Give ownership of the directories to the nodejs user
RUN chown -R nodejs:nodejs /app/uploads
RUN chown -R nodejs:nodejs /app/logs

USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check (updated to use the new endpoint)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "server.js"]
