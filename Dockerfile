# Dockerfile for Next.js frontend

# 1. Base image for installing dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Configure npm registry FIRST, then install pnpm
RUN npm config set strict-ssl false && \
    npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm

# Configure pnpm for network issues (SSL and registry)
RUN pnpm config set strict-ssl false && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-timeout 120000

# Copy package.json and pnpm-lock.yaml to install dependencies
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm (faster with better caching)
# Using --no-frozen-lockfile because lockfile may be out of sync after merges
RUN pnpm install --no-frozen-lockfile --reporter=default

# 2. Base image for building the application
FROM node:20-alpine AS builder
WORKDIR /app

# Configure npm and install pnpm
RUN npm config set strict-ssl false && \
    npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code
COPY . .
# Build the Next.js application
RUN pnpm run build

# Build the embedded Citation Manager UI (CRA) so iframe can serve built assets
# Configure citation UI build to serve under public subpath so assets resolve in iframe
ENV REACT_APP_SUPERVISOR_URL=http://localhost:8000
ENV PUBLIC_URL=/citation-manager-ui/build
RUN cd public/citation-manager-ui \
    && npm install --no-audit --no-fund \
    && npm run build

# 3. Final image for running the application
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Configure npm and install pnpm
RUN npm config set strict-ssl false && \
    npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# The command to start the app
CMD ["pnpm", "start"]
