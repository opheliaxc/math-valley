# Math Valley — multi-stage production image
# Platform-neutral: no FROM --platform; build on the machine (or --platform) you need.
# Node major matches .nvmrc / package.json engines (26). Debian slim (not Alpine).

# ---------- deps: install all packages (incl. native build tools for better-sqlite3) ----------
FROM node:26-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ---------- build: typecheck + Vite frontend (bundles question-generator into dist/) ----------
FROM deps AS build
WORKDIR /app

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
COPY question-generator ./question-generator

RUN npm run build

# ---------- production-deps: production node_modules only, same OS/arch as runtime ----------
FROM node:26-bookworm-slim AS production-deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

# ---------- runtime: slim image, non-root, no build tools ----------
FROM node:26-bookworm-slim AS runtime
WORKDIR /app

# Defaults for container hosting (override via Compose / env). Never put secrets here.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3066 \
    SERVE_STATIC=1 \
    DB_PATH=/data/math-valley.db \
    BACKUP_DIR=/backups \
    BACKUP_INTERVAL_HOURS=24 \
    BACKUP_RETENTION=14

RUN groupadd --system mathvalley \
  && useradd --system --gid mathvalley --home-dir /app --shell /usr/sbin/nologin mathvalley \
  && mkdir -p /data /backups \
  && chown -R mathvalley:mathvalley /app /data /backups

COPY --from=production-deps --chown=mathvalley:mathvalley /app/node_modules ./node_modules
COPY --from=production-deps --chown=mathvalley:mathvalley /app/package.json ./package.json
COPY --from=build --chown=mathvalley:mathvalley /app/dist ./dist
# Server runs TypeScript via Node and imports shared modules under src/ and question-generator/.
COPY --chown=mathvalley:mathvalley server ./server
COPY --chown=mathvalley:mathvalley src ./src
COPY --chown=mathvalley:mathvalley question-generator ./question-generator
COPY --chown=mathvalley:mathvalley scripts ./scripts

USER mathvalley

EXPOSE 3066

# Use Node's built-in fetch (no curl package). Hits loopback; HOST=0.0.0.0 still accepts it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3066)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run Node directly so SIGTERM reaches the process (Compose should also set init: true).
CMD ["node", "server/index.ts"]
