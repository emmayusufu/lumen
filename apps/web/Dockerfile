FROM node:24-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN npm install --production=false --workspaces --include-workspace-root

FROM node:24-alpine AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
WORKDIR /repo/apps/web

ARG NEXT_PUBLIC_COLLAB_URL
ARG NEXT_PUBLIC_MINIO_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_HYPERDX_API_KEY
ARG NEXT_PUBLIC_HYPERDX_SERVICE
ARG NEXT_PUBLIC_HYPERDX_URL
ENV NEXT_PUBLIC_COLLAB_URL=$NEXT_PUBLIC_COLLAB_URL \
    NEXT_PUBLIC_MINIO_URL=$NEXT_PUBLIC_MINIO_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_HYPERDX_API_KEY=$NEXT_PUBLIC_HYPERDX_API_KEY \
    NEXT_PUBLIC_HYPERDX_SERVICE=$NEXT_PUBLIC_HYPERDX_SERVICE \
    NEXT_PUBLIC_HYPERDX_URL=$NEXT_PUBLIC_HYPERDX_URL

RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/web/public ./public
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["node", "server.js"]
