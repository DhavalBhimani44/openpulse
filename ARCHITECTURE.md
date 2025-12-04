# OpenPulse Architecture

## Overview

OpenPulse is a monorepo-based analytics platform built with modern web technologies. The architecture is designed for scalability, maintainability, and developer experience.

## Monorepo Structure

```
openpulse/
├── apps/
│   ├── dashboard/          # Main Next.js app (UI + API)
│   └── collector/          # API-only Next.js app (event ingestion)
├── packages/
│   ├── db/                 # Prisma schema and client
│   ├── trpc/               # tRPC routers and client
│   └── ui/                 # Shared shadcn/ui components
├── turbo.json              # Turborepo configuration
└── package.json            # Root package.json
```

## Applications

### Dashboard (`apps/dashboard`)

**Purpose**: Main user interface and API server

**Tech Stack**:
- Next.js 14 (App Router)
- React Server Components
- tRPC for API
- Better Auth for authentication
- Tailwind CSS + shadcn/ui

**Key Features**:
- User authentication (login/signup)
- Project management
- Analytics dashboard
- Real-time metrics
- tRPC API endpoints

**Routes**:
- `/login` - Login page
- `/signup` - Sign up page
- `/projects` - Projects list
- `/projects/[id]` - Project dashboard
- `/projects/[id]/pages` - Page analytics
- `/projects/[id]/devices` - Device analytics
- `/projects/[id]/referrers` - Referrer analytics
- `/projects/[id]/locations` - Geographic analytics
- `/api/trpc/[trpc]` - tRPC API endpoint
- `/api/auth/[...all]` - Better Auth endpoints

### Collector (`apps/collector`)

**Purpose**: High-performance event ingestion API

**Tech Stack**:
- Next.js 14 (API routes only)
- Rate limiting
- IP anonymization
- Device parsing (ua-parser-js)

**Key Features**:
- Event collection endpoint (`/api/collect`)
- Batch processing
- Rate limiting (per IP, per project)
- IP anonymization
- Device/geo parsing
- Tracking script delivery (`/tracker.js`)

**Endpoints**:
- `POST /api/collect` - Accept tracking events
- `GET /tracker.js` - Serve tracking script

## Packages

### Database (`packages/db`)

**Purpose**: Database schema and Prisma client

**Contents**:
- Prisma schema (`prisma/schema.prisma`)
- Prisma client export
- Database models

**Models**:
- User (Better Auth)
- Session (Better Auth)
- Project
- ProjectMember
- Event
- AnalyticsSession
- PageView
- Device
- Referrer
- Geo

### tRPC (`packages/trpc`)

**Purpose**: Type-safe API layer

**Contents**:
- tRPC server setup
- tRPC client setup
- Routers:
  - `authRouter` - Authentication
  - `projectRouter` - Project management
  - `metricsRouter` - Analytics metrics
  - `eventsRouter` - Raw events

**Key Features**:
- Type-safe API calls
- Automatic request/response validation (Zod)
- Protected procedures (authentication required)
- Project-scoped procedures (project access check)

### UI (`packages/ui`)

**Purpose**: Shared UI components

**Contents**:
- shadcn/ui components
- Utility functions
- Component exports

**Components**:
- Button
- Card
- Dialog
- Input
- Label
- Select
- Tabs

## Data Flow

### Event Collection Flow

```
Website (tracker.js)
  ↓
POST /api/collect (Collector)
  ↓
Rate Limiting
  ↓
IP Anonymization
  ↓
Device/Geo Parsing
  ↓
Database (Prisma)
  ↓
Event, Session, Device, Referrer, Geo tables
```

### Analytics Query Flow

```
Dashboard UI
  ↓
tRPC Client
  ↓
POST /api/trpc (Dashboard)
  ↓
tRPC Router
  ↓
Protected Procedure (auth check)
  ↓
Project Procedure (access check)
  ↓
Prisma Query
  ↓
Database
  ↓
Aggregated Results
  ↓
tRPC Response
  ↓
React Component
```

## Authentication Flow

1. User signs up/logs in via Better Auth
2. Better Auth creates session and sets cookie
3. Middleware checks session on protected routes
4. tRPC context extracts user from session
5. Protected procedures verify user exists
6. Project procedures verify project access

## Database Design

### Key Design Decisions

1. **Unlimited Projects**: No limit on projects per user (key differentiator)
2. **Privacy**: IP anonymization before storage
3. **Performance**: Composite indexes on common query patterns
4. **Scalability**: Separate tables for devices, referrers, geo (normalized)

### Indexing Strategy

- `Event.projectId_timestamp` - Fast date range queries
- `AnalyticsSession.projectId_startedAt` - Fast session queries
- Composite unique indexes prevent duplicates
- Foreign key indexes for joins

## Performance Optimizations

1. **Event Batching**: Tracker batches events before sending
2. **Rate Limiting**: Prevents abuse (per IP, per project)
3. **Database Indexes**: Optimized for common queries
4. **Prisma Aggregations**: Efficient metric calculations
5. **Connection Pooling**: Database connection reuse

## Security

1. **IP Anonymization**: Privacy protection
2. **Rate Limiting**: DDoS protection
3. **Authentication**: Better Auth with secure sessions
4. **Authorization**: Project-level access control
5. **Input Validation**: Zod schemas for all inputs
6. **SQL Injection**: Prisma ORM prevents SQL injection

## Scalability Considerations

### Current Architecture

- Single database (PostgreSQL)
- In-memory rate limiting
- Basic geo lookup

### Future Scaling

- **Database**: Read replicas, sharding
- **Rate Limiting**: Redis-based
- **Geo Lookup**: MaxMind GeoIP2 or external API
- **Caching**: Redis for metrics
- **CDN**: For tracking script delivery
- **Horizontal Scaling**: Load balancer for collector

## Development Workflow

1. **Local Development**:
   ```bash
   pnpm dev  # Starts all apps
   ```

2. **Database Migrations**:
   ```bash
   cd packages/db
   pnpm db:migrate
   ```

3. **Building**:
   ```bash
   pnpm build  # Builds all apps
   ```

4. **Type Checking**:
   ```bash
   pnpm lint  # Lints all packages
   ```

## Deployment Architecture

### Recommended Setup

- **Dashboard**: Vercel/Railway/Render
- **Collector**: Dedicated server (Railway/Render)
- **Database**: Managed PostgreSQL (Railway/Supabase/Neon)
- **Redis** (optional): Upstash for rate limiting

### Docker Setup

- Multi-stage builds for optimization
- Separate containers for dashboard and collector
- Shared database container
- Docker Compose for local development

## Monitoring & Observability

### Recommended Tools

- **Error Tracking**: Sentry
- **APM**: Vercel Analytics, Railway Metrics
- **Database**: Prisma Studio, pgAdmin
- **Logs**: Application logs, database logs

### Key Metrics

- Event ingestion rate
- API response times
- Database query performance
- Error rates
- Active sessions

## Future Improvements

See [ROADMAP.md](./ROADMAP.md) for planned features and architectural improvements.

