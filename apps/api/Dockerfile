FROM oven/bun:1-slim AS base
WORKDIR /app

# Install runtime dependencies (OpenSSL for SSL/TLS and curl for healthcheck)
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install

COPY . .

EXPOSE 3001
ENV NODE_ENV=production

CMD ["bun", "run", "src/server.ts"]
