# Implementation Plan - ResQ Disaster Management System

## Phase 1: Infrastructure & Monorepo Foundation

- [x] Install `pnpm` and initialize `pnpm-workspace.yaml`.
- [x] Rename `apps/client` to `apps/web`.
- [x] Clean up `package.json` (remove npm workspaces) and `package-lock.json`.
- [x] Configure `turbo.json`.
- [x] Create `docker-compose.yml` with MongoDB Replica Set (with healthcheck) and Redis.
- [x] Verify Infrastructure with `docker-compose up -d`.

## Phase 2: Shared Domain Logic

- [x] Create `packages/types`.
- [x] Initialize `tsconfig.json` and `package.json`.
- [x] Define `IIncident` and `IResource` interfaces.
- [x] Build and link package.

## Phase 3: Backend Architecture (API)

- [x] Setup `apps/api` with Tsoa, Express, Mongoose.
- [x] Configure `tsoa.json` (strict mode).
- [x] Create `src/controllers`, `src/services`, `src/models` structure.
- [x] Implement `IncidentController` and `IncidentService`.
- [x] Implement Mongoose models using `IIncident` from `packages/types`.

## Phase 4: Ashycnronous Processing (BullMQ)

- [x] Create singleton `src/infrastructure/redis.ts`.
- [x] Setup `src/queues/notification.queue.ts`.
- [x] Setup `src/workers/notification.worker.ts` (Sandboxed).
- [x] Integrate Queue into `IncidentController`.

## Phase 5: Frontend Offline Architecture

- [x] Initialize `apps/web` with Vite, React, TS.
- [x] Setup `TanStack Query` with `PersistQueryClientProvider`.
- [x] Configure `gcTime` and `networkMode`.
- [x] Implement `useIncident` hook with Optimistic Updates.

## Phase 6: Geospatial Visualization

- [x] Install `react-map-gl` and `maplibre-gl`.
- [x] Create `IncidentMap` component.
- [x] Visualise incidents from data.
