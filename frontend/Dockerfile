# Frontend Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY frontend ./frontend
COPY next.config.ts ./
COPY tsconfig.json ./
COPY public ./public

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]