FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src
COPY prisma ./prisma
COPY dist ./dist

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000

CMD ["node", "dist/index.js"]