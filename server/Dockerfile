# Production Dockerfile for doc-assistant-server
FROM node:20-alpine

# Set environment
ENV NODE_ENV=production \
    PORT=4001

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies only with fast network flags
RUN npm ci --omit=dev --no-audit --no-fund

# Copy application source code
COPY . .

# Ensure uploads directory exists and is owned by the node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Run as non-root user for security
USER node

# Expose the API server port
EXPOSE 4001

# Health check to allow Docker and Portainer to monitor container health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e 'require("http").get("http://localhost:4001/v1/healthcheck", (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1))'

# Start the API server
CMD ["node", "cmd/api/index.js"]
