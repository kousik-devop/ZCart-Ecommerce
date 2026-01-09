FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Use production environment by default
ENV NODE_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# Expose port used by the app (default 3003)
EXPOSE 3004

# Start the app
CMD ["node", "server.js"]
