# ResQ - Resilient Response System

**ResQ** is a high-availability, offline-first Disaster Management platform designed for degraded network environments. It enables real-time incident reporting, resource management, and coordination between dispatchers and volunteers.

## Features

- **Offline-First**: Full functionality without internet connection using TanStack Query; automatic synchronization when online.
- **Real-time Coordination**: Socket.io integration for live updates on incidents and resources.
- **Geospatial Intelligence**: Regulated map visualizations using MapLibre (no external API keys required).
- **Enterprise Grade**: Strict type safety with shared Zod schemas and TypeScript interfaces across full stack.
- **Reliable Processing**: Background job processing with BullMQ and Redis sandboxed workers.
- **ACID Transactions**: MongoDB Replica Set configured for data integrity.

## Tech Stack

- **Monorepo**: Turborepo, pnpm
- **Backend**: Node.js, Express, Tsoa (Code-first OpenAPI), Mongoose
- **Database**: MongoDB (Replica Set), Redis
- **Queue System**: BullMQ
- **Frontend**: React 18, Vite, TailwindCSS, TanStack Query v5
- **Mapping**: react-map-gl, maplibre-gl

## Prerequisites

Ensure you have the following installed:

- **Node.js**: v18+ (Recommended: v20.18.1)
- **pnpm**: v8+ or v9+
- **Docker & Docker Compose**: Required for database infrastructure

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd resq

# Install dependencies for all workspaces
pnpm install
```

### 2. Start Infrastructure

Launch MongoDB (Replica Set) and Redis containers.

```bash
docker-compose up -d
```

_Wait a few seconds for MongoDB to initialize the replica set logic defined in healthchecks._

### 3. Seed Database

Initialize the database with default roles, permissions, and test users.

```bash
pnpm --filter api seed
```

### 4. Start Development

Run both the API and Web applications in parallel.

```bash
pnpm dev
```

ACCESS:

- **Web Interface**: [http://localhost:5173](http://localhost:5173)
- **API Swagger Docs**: [http://localhost:4000/docs](http://localhost:4000/docs)

## Default Credentials

Use these accounts to test different role-based permissions:

| Role           | Email                  | Password        | Capabilities                              |
| -------------- | ---------------------- | --------------- | ----------------------------------------- |
| **Admin**      | `admin@resq.local`     | `Admin123!`     | Full system access, User/Role management  |
| **Dispatcher** | `dispatch@resq.local`  | `Dispatch123!`  | Manage incidents, resources, and map data |
| **Volunteer**  | `volunteer@resq.local` | `Volunteer123!` | View tasks, Accept assignments            |
| **Civilian**   | `civilian@resq.local`  | `Help123!`      | Report incidents, View public map         |

## Project Architecture

```
/
├── apps
│   ├── api            # Express Server, Tsoa Models, BullMQ Workers
│   └── web            # React Client, Offline Logic, MapLibre
├── packages
│   ├── types          # Shared Zod Schemas & TS Interfaces (Single Source of Truth)
│   ├── ui             # Shared React Components
│   ├── eslint-config  # Shared Linting Rules
│   └── typescript-config # Shared TSConfig
├── docker-compose.yml # Infra (Mongo RS, Redis)
└── turbo.json         # Build pipeline config
```

## Troubleshooting

**MongoDB Connection Error?**
Ensure existing Mongo containers are removed before starting fresh to avoid volume conflicts with the replica set configuration.

```bash
docker-compose down -v
docker-compose up -d
```

**"Types not found"?**
If you change `packages/types`, ensure you run the build command so dependent apps pick up the changes.

```bash
pnpm build
```
