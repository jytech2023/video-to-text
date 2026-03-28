FROM node:20-slim AS base

# Install ffmpeg and yt-dlp dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir yt-dlp \
    && ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp \
    && apt-get purge -y python3-pip python3-venv \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
