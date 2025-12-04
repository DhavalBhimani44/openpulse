# Deployment Guide

This guide covers deploying OpenPulse to various platforms.

## Prerequisites

- PostgreSQL database (managed or self-hosted)
- Node.js 18+ runtime
- Environment variables configured

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Random secret key (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Your dashboard URL (e.g., `https://analytics.example.com`)
- `COLLECTOR_URL` - Your collector URL (e.g., `https://collect.example.com`)

### Optional

- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `IP_GEOLOCATION_API_KEY` - IP geolocation API key

## Docker Deployment

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: openpulse
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: openpulse
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openpulse"]
      interval: 10s
      timeout: 5s
      retries: 5

  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.dashboard
    environment:
      DATABASE_URL: postgresql://openpulse:${POSTGRES_PASSWORD}@postgres:5432/openpulse?schema=public
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  collector:
    build:
      context: .
      dockerfile: Dockerfile.collector
    environment:
      DATABASE_URL: postgresql://openpulse:${POSTGRES_PASSWORD}@postgres:5432/openpulse?schema=public
      COLLECTOR_URL: ${COLLECTOR_URL}
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

Create `.env` file:

```env
POSTGRES_PASSWORD=your-secure-password
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://analytics.example.com
COLLECTOR_URL=https://collect.example.com
```

### Build and Run

```bash
# Build images
docker-compose build

# Run migrations
docker-compose run dashboard pnpm db:migrate

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Dockerfiles

**Dockerfile.dashboard:**

```dockerfile
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter=@openpulse/dashboard

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
WORKDIR /app/apps/dashboard
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Dockerfile.collector:**

```dockerfile
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY apps/collector/package.json ./apps/collector/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter=@openpulse/collector

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/collector/.next ./apps/collector/.next
COPY --from=builder /app/apps/collector/package.json ./apps/collector/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
WORKDIR /app/apps/collector
EXPOSE 3001
CMD ["pnpm", "start"]
```

## Railway Deployment

1. **Create Railway project**
   - Go to [Railway](https://railway.app)
   - Create new project
   - Add PostgreSQL database

2. **Deploy Dashboard**
   - Add GitHub repository
   - Set root directory to `apps/dashboard`
   - Add environment variables:
     - `DATABASE_URL` (from PostgreSQL service)
     - `BETTER_AUTH_SECRET`
     - `BETTER_AUTH_URL`
   - Deploy

3. **Deploy Collector**
   - Add new service from same repo
   - Set root directory to `apps/collector`
   - Add environment variables:
     - `DATABASE_URL`
     - `COLLECTOR_URL`
   - Deploy

4. **Run migrations**
   - Use Railway CLI or one-click deploy button
   - Or run migrations manually in dashboard service

## Vercel Deployment

### Dashboard

1. **Import project**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `apps/dashboard`

2. **Configure**
   - Framework: Next.js
   - Build command: `cd ../.. && pnpm build --filter=@openpulse/dashboard`
   - Output directory: `apps/dashboard/.next`

3. **Environment variables**
   - Add all required variables
   - Use Vercel's PostgreSQL or external database

4. **Deploy**

### Collector

Vercel can host the collector, but consider a dedicated server for better performance.

## Render Deployment

1. **Create PostgreSQL database**
   - Create new PostgreSQL database
   - Note connection string

2. **Deploy Dashboard**
   - Create new Web Service
   - Connect GitHub repository
   - Root directory: `apps/dashboard`
   - Build command: `cd ../.. && pnpm install && pnpm build --filter=@openpulse/dashboard`
   - Start command: `cd apps/dashboard && pnpm start`
   - Add environment variables

3. **Deploy Collector**
   - Create new Web Service
   - Root directory: `apps/collector`
   - Build command: `cd ../.. && pnpm install && pnpm build --filter=@openpulse/collector`
   - Start command: `cd apps/collector && pnpm start`
   - Add environment variables

4. **Run migrations**
   - Use Render shell or one-click deploy

## Post-Deployment

1. **Run database migrations**
   ```bash
   cd packages/db
   pnpm db:migrate
   ```

2. **Verify deployment**
   - Check dashboard loads
   - Test tracking script
   - Verify events are being collected

3. **Set up monitoring**
   - Monitor database connections
   - Set up alerts for errors
   - Monitor API response times

4. **Configure domains**
   - Point domains to your services
   - Set up SSL certificates
   - Update environment variables with production URLs

## Scaling Considerations

- **Database**: Use connection pooling (PgBouncer)
- **Collector**: Consider horizontal scaling with load balancer
- **Caching**: Add Redis for rate limiting and caching
- **CDN**: Use CDN for tracking script delivery
- **Monitoring**: Set up application monitoring (Sentry, etc.)

## Security Checklist

- [ ] Use strong `BETTER_AUTH_SECRET`
- [ ] Enable HTTPS/SSL
- [ ] Use environment variables (never commit secrets)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable CORS properly
- [ ] Keep dependencies updated
- [ ] Use database connection pooling
- [ ] Set up firewall rules
- [ ] Enable database SSL connections

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is accessible from deployment environment
- Verify SSL settings if required

### Migration Issues

- Ensure database user has migration permissions
- Run migrations manually if needed
- Check migration logs

### Tracking Script Not Working

- Verify `COLLECTOR_URL` is correct
- Check CORS settings
- Verify project ID/slug is correct
- Check browser console for errors

## Support

For deployment issues, open an issue on GitHub or check the documentation.

