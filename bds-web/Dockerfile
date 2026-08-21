# Image production cho bds-web (Next.js 16, standalone output)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* được nhúng vào bundle lúc build nên phải truyền ở giai đoạn này.
ARG NEXT_PUBLIC_BDS_API_URL=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_BDS_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_BDS_API_URL=$NEXT_PUBLIC_BDS_API_URL
ENV NEXT_PUBLIC_BDS_SITE_URL=$NEXT_PUBLIC_BDS_SITE_URL

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
