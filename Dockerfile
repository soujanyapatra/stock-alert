# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
COPY shared/ /app/shared/
RUN npm run build


# ── Stage 2: Build backend ───────────────────────────────────────────
FROM node:20-slim AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./
# Skip browser download during install — we install Chromium via apt below
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install

COPY backend/ ./
COPY shared/ /app/shared/
RUN npm run build && cp src/database/schema.sql dist/backend/src/database/schema.sql


# ── Stage 3: Production image ────────────────────────────────────────
FROM node:20-slim AS production

# Install Chromium and its system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Tell Playwright to use the system Chromium (no download needed)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy built backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json

# Copy built frontend into the path the backend serves from
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy shared types
COPY shared/ ./shared/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "backend/dist/backend/src/index.js"]
