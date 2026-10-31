# Build the Next.js static export with the project's pinned pnpm toolchain.
FROM node:22-bookworm-slim AS web-build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY next.config.ts tailwind.config.ts postcss.config.mjs tsconfig.json next-env.d.ts ./
RUN FUNDWISE_BUILD=1 pnpm exec next build

# Serve the exported pages and verified FastAPI optimizer from one container.
FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000
COPY requirements.txt ./requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
COPY artifacts ./artifacts
COPY --from=web-build /app/.next-build ./.next-build
EXPOSE 3000
CMD ["python3", "-m", "backend.run"]
