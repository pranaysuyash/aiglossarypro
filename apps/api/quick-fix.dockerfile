FROM node:18-alpine

WORKDIR /app/apps/api

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the built dist directory
COPY dist ./dist

# Expose port
EXPOSE 3001

# Set NODE_ENV to production by default
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
