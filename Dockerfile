# Dockerfile for Next.js frontend

FROM node:20-alpine AS deps
WORKDIR /app

# Use corepack to provide pnpm consistently without global npm installs
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only dependency manifests to leverage Docker cache for deps
COPY package.json pnpm-lock.yaml ./
# Try a frozen install for reproducibility; if the lockfile is out of date
# fall back to a regular install so builds succeed. In CI you may prefer
# to update `pnpm-lock.yaml` and keep `--frozen-lockfile`.
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure pnpm is available in this stage (enable corepack and prepare pnpm)
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Ensure pnpm is available in the final image
RUN corepack enable && corepack prepare pnpm@latest --activate
# Copy build artifacts only
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["pnpm", "start"]
