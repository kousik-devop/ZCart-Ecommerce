FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Production mode
ENV NODE_ENV=production

# Copy package files first (cache optimization)
COPY package*.json ./

# Install only production deps
RUN npm ci --only=production

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# Expose correct port (must match server.js)
EXPOSE 3000

# Start Auth service
CMD ["node", "server.js"]
