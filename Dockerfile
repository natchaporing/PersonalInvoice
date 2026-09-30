# Next.js standalone server on the official Playwright image, which ships the exact
# Chromium build that playwright-core expects (used to render signed PDFs).
# Keep the tag in step with the playwright-core version in package.json.
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS build
# Public values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS run
# Ghostscript turns the rendered PDF into PDF/A-3 for e-Tax packages (src/lib/etax/pdfa.ts).
RUN apt-get update && apt-get install -y --no-install-recommends ghostscript \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=pwuser:pwuser /app/.next/standalone ./
COPY --from=build --chown=pwuser:pwuser /app/.next/static ./.next/static
COPY --from=build --chown=pwuser:pwuser /app/public ./public
USER pwuser
EXPOSE 3000
CMD ["node", "server.js"]
