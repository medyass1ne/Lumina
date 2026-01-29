# Base image
FROM node:18-alpine

# Install dependencies required for 'sharp' image processing
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["npm", "start"]