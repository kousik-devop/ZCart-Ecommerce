FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Use production mode
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create and use non-root user (security best practice)
RUN addgroup -S app && adduser -S app -G app
USER app

# Expose Auth service port
EXPOSE 3000

# Start Auth service
CMD ["node", "server.js"]
