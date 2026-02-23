# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# openssl is required by the Prisma query engine at generate/build time
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all deps (postinstall runs prisma generate automatically)
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: run ──────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Runtime system deps:
#   ffmpeg   – video composition
#   yt-dlp   – YouTube download (installed as a static binary)
#   openssl  – Prisma query engine
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# Copy built artefacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./

# Persistent upload directory (mount a volume here in production)
RUN mkdir -p uploads

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Push schema to DB (creates tables if they don't exist) then start the app
CMD ["sh", "-c", "npx prisma db push && npm start"]
