# OpenPulse Analytics

A complete, self-hosted website analytics platform built with modern web technologies. Track unlimited projects per user with privacy-friendly, lightweight tracking.

## Features

- **Unlimited Projects**: Create as many analytics projects as you need (unlike Vercel Analytics which limits you to one)
- **Privacy-Friendly**: IP anonymization, no personal data collection, respects Do Not Track
- **Lightweight Tracker**: <4KB tracking script with batching and retry logic
- **Real-time Analytics**: See visitors, pageviews, sessions, bounce rates, and more
- **Comprehensive Metrics**: Track devices, browsers, operating systems, countries, cities, referrers, UTM parameters, and screen sizes
- **Modern UI**: Beautiful dashboard built with shadcn/ui components
- **Self-Hosted**: Complete control over your data

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend & Backend**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC for type-safe APIs
- **Authentication**: Better Auth
- **UI Components**: shadcn/ui with Tailwind CSS
- **TypeScript**: Full type safety throughout

## Architecture

```
openpulse/
├── apps/
│   ├── dashboard/     # Main Next.js app (UI + API routes)
│   └── collector/     # API-only app for event ingestion
├── packages/
│   ├── db/           # Prisma schema and client
│   ├── trpc/         # tRPC routers and client
│   └── ui/           # Shared shadcn/ui components
```

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/openpulse.git
cd openpulse
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create `.env` files in both `apps/dashboard` and `apps/collector`:

```bash
# apps/dashboard/.env
DATABASE_URL="postgresql://user:password@localhost:5432/openpulse?schema=public"
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"

# apps/collector/.env
DATABASE_URL="postgresql://user:password@localhost:5432/openpulse?schema=public"
COLLECTOR_URL="http://localhost:3001"
```

4. **Set up the database**

```bash
cd packages/db
pnpm db:migrate
```

5. **Start development servers**

From the root directory:

```bash
pnpm dev
```

This will start:
- Dashboard app on `http://localhost:3000`
- Collector app on `http://localhost:3001`

6. **Create your first account**

Visit `http://localhost:3000/signup` and create an account.

## Usage

### Creating a Project

1. Sign in to the dashboard
2. Click "Create Project"
3. Enter a name and optional description
4. Copy your project ID (slug)

### Embedding the Tracker

Add the tracking script to your website:

```html
<script 
  src="http://your-collector-domain.com/tracker.js" 
  data-project="YOUR_PROJECT_SLUG"
></script>
```

Replace `YOUR_PROJECT_SLUG` with your project's slug.

### Viewing Analytics

Navigate to your project in the dashboard to see:
- Overview metrics (visitors, pageviews, bounce rate, session duration)
- Real-time visitors
- Top pages
- Entry and exit pages
- Device breakdown (browsers, OS, device types, screen sizes)
- Geographic data (countries, cities)
- Referrer sources
- UTM campaign tracking

## API Usage

### Tracking Endpoint

The collector accepts POST requests to `/api/collect`:

```javascript
fetch('http://your-collector-domain.com/api/collect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectId: 'your-project-id',
    sessionId: 'session-id',
    url: 'https://example.com/page',
    referrer: 'https://google.com',
    title: 'Page Title',
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
});
```

### tRPC API

The dashboard exposes a tRPC API at `/api/trpc`. Use the tRPC client for type-safe API calls.

## Environment Variables

### Dashboard App

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret key for Better Auth (generate a random string)
- `BETTER_AUTH_URL` - Base URL of your dashboard app

### Collector App

- `DATABASE_URL` - PostgreSQL connection string
- `COLLECTOR_URL` - Base URL of your collector app (for tracking script)

### Optional

- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting (if using Upstash)
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `IP_GEOLOCATION_API_KEY` - API key for IP geolocation service

## Database Setup

### Local PostgreSQL

```bash
# Create database
createdb openpulse

# Run migrations
cd packages/db
pnpm db:migrate
```

### Docker PostgreSQL

```bash
docker run --name openpulse-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=openpulse \
  -p 5432:5432 \
  -d postgres:15
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- Docker & Docker Compose
- Railway
- Vercel
- Render

## Development

### Project Structure

- `apps/dashboard` - Main dashboard application
- `apps/collector` - Event collection API
- `packages/db` - Database schema and Prisma client
- `packages/trpc` - tRPC routers and client setup
- `packages/ui` - Shared UI components

### Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all packages
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

### Database Migrations

```bash
# Create a new migration
cd packages/db
pnpm db:migrate

# Apply migrations
pnpm db:push
```

## Privacy

OpenPulse is designed with privacy in mind:

- **IP Anonymization**: IP addresses are anonymized before storage (last octet removed)
- **No Personal Data**: We don't collect personal information
- **Do Not Track**: Respects the DNT header
- **Self-Hosted**: You control all data

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and improvements.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/openpulse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/openpulse/discussions)

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [tRPC](https://trpc.io/)
- [Better Auth](https://www.better-auth.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Turborepo](https://turbo.build/)

