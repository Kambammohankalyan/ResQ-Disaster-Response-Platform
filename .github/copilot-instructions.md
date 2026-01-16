# GitHub Copilot Instructions for ResQ Monorepo

## Project Overview

**ResQ (Resilient Response System)** is a high-availability, offline-first Disaster Management platform designed for degraded network environments.
**Role**: Senior Principal Engineer. Code must be strict, type-safe, and enterprise-grade.

## Architecture & Technology Stack (Non-Negotiable)

- **Package Manager**: `pnpm` (Strict workspace isolation).
- **Monorepo**: Turborepo.
- **Backend**: Node.js, Express, **Tsoa** (Code-first OpenAPI), Mongoose.
- **Database**: MongoDB **Replica Set** (Required for ACID Transactions).
- **Queue**: BullMQ on Redis (Sandboxed Workers).
- **Frontend**: React 18+, Vite, **TanStack Query v5** (Persistent Cache/Offline-First), TailwindCSS.
- **Geospatial**: `react-map-gl` with `maplibre-gl` (No external API keys).

## Directory Structure

```
/ (root)
├── apps
│   ├── api (Express + Tsoa + BullMQ)
│   └── web (React + TanStack Query + MapLibre)
├── packages
│   ├── types (Shared Zod schemas & TS Interfaces - Single Source of Truth)
│   ├── ui (Shared React components)
│   └── tsconfig (Shared strict TS configs)
├── docker-compose.yml
└── turbo.json
```

## Critical Developer Workflows

- **Build**: `pnpm build` (Runs `turbo run build`).
- **Dev**: `pnpm dev` (Runs `turbo run dev`).
- **Docker**: `docker-compose up -d` (Compulsory for DB/Redis).
  - **Healthcheck**: MongoDB must pass replica set initialization script in `docker-compose.yml`.

## Coding Patterns & Guidelines

### 1. Type-Safe Continuity

- **Single Source of Truth**: All domain models (`IIncident`, `IResource`) MUST be defined in `packages/types` and imported by both `apps/api` and `apps/web`.
- **API Contracts**: Use **Tsoa** decorators (`@Route`, `@Body`) in Controllers to auto-generate Swagger docs.
- **Runtime Validation**: `tsoa.json` must have `"noImplicitAdditionalProperties": "throw-on-extras"`.

### 2. Backend Architecture (`apps/api`)

- **Controller-Service-Model Separation**:
  - `src/controllers`: HTTP layer ONLY. Tsoa decorators. No business logic.
  - `src/services`: Business logic. Database interactions. Queue producers. Agnostic of HTTP.
  - `src/models`: Mongoose schemas implementing `packages/types` interfaces.
- **Async Processing**: Use **BullMQ** for heavy tasks.
  - **Sandboxed Workers**: Workers must run in separate processes (`new Worker('name', path_to_file)`).
  - **Redis**: Use a Singleton pattern for connections. Separate connections for Publisher and Subscriber/Worker.

### 3. Frontend Offline-First (`apps/web`)

- **TanStack Query**:
  - `networkMode: 'offlineFirst'`
  - `gcTime`: > 24 hours (Data persistence).
  - `staleTime`: ~5 mins.
  - **Persister**: `createSyncStoragePersister` with `localStorage` or `IDB`.
- **Mutations**: Implement Optimistic Updates. Paused mutations must be persisted and retried when online.
- **Maps**: Use `maplibre-gl` with `react-map-gl`. No Google Maps/Mapbox tokens.

## Implementation Roadmap

1. **Infrastructure**: `docker-compose.yml` with Mongo RS logic. `pnpm` workspace setup.
2. **Shared Types**: `packages/types`.
3. **Backend Core**: Tsoa setup, Mongo connection.
4. **Async**: BullMQ setup.
5. **Frontend**: Offline-first provider setup.
6. **Geospatial**: Map setup.

## Validation Protocols

- **Infrastructure**: `docker exec ... rs.status()` must return OK.
- **Type Safety**: Changing a type in `packages/types` MUST fail builds in both API and Web.
- **Offline**: App must load data from cache when network is disconnected.
