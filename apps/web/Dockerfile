# apps/web/Dockerfile
# Builds and runs the Next.js app located in apps/web

FROM node:20-slim AS deps
WORKDIR /app

# Copy only package files first for layer caching
COPY package.json package-lock.json* ./

# IMPORTANT: use npm install (not npm ci) because package-lock.json may not exist
RUN npm install

FROM node:20-slim AS builder
WORKDIR /app

# Bring installed deps forward
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the web app
COPY . .

# Build Next.js
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Copy built app
COPY --from=builder /app ./

# Start Next.js (must respect $PORT)
CMD ["npm","run","start"]
