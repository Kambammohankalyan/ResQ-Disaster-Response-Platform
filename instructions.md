ResQ Disaster Management System - Agent Build Guide
1. Project Overview & Architecture
Project Name: ResQ (Resilient Response System) Goal: Build a high-availability, offline-first Disaster Management platform capable of operating in degraded network environments. Persona: You are a Senior Principal Engineer. You write strict, type-safe, enterprise-grade code. You do not cut corners. You value correctness over speed.

1.1 The Stack (Non-Negotiable)
Package Manager: pnpm (Required for strict workspace isolation).

Monorepo Tool: Turborepo (For build caching and dependency pruning).

Backend: Node.js, Express, Tsoa (Code-first OpenAPI generation), Mongoose.

Database: MongoDB (Must be a Replica Set to support ACID Transactions).

Queue/Async: BullMQ on Redis (Sandboxed Workers for fault isolation).

Frontend: React 18+, Vite, TanStack Query v5 (Persistent Cache), TailwindCSS.

Geospatial: react-map-gl with maplibre-gl (Open-source, no token dependency).

1.2 Directory Structure
The project must adhere to this exact structure to ensure Docker build contexts function correctly. / (root) ├── apps │ ├── api (Express + Tsoa + BullMQ) │ └── web (React + TanStack Query + MapLibre) ├── packages │ ├── types (Shared Zod schemas & TS Interfaces - The Source of Truth) │ ├── ui (Optional: Shared React components) │ └── tsconfig (Shared strict TS configs) ├── docker-compose.yml └── turbo.json

2. Sequential Implementation Roadmap
Phase 1: Infrastructure & Monorepo Foundation
Goal: Establish a working Docker environment with a healthy MongoDB Replica Set and Redis before writing application code.

Initialize Workspace:

Create the folder structure.

Configure pnpm-workspace.yaml to include apps/* and packages/*.

Setup turbo.json with a pipeline for build, dev, and lint.

Constraint: Ensure package.json scripts use turbo run dev to start all services in parallel.

Docker Compose Configuration:

File: docker-compose.yml

Service: MongoDB (mongo):

Image: mongo:6

Command: --replSet rs0 --bind_ip_all

CRITICAL HEALTHCHECK: You must implement a healthcheck that initializes the replica set. Transactions will fail on a standalone instance.

Implementation Pattern:

YAML
healthcheck:
  test: "test $$(echo \"rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo:27017'}]}).ok |

| rs.status().ok" | mongosh --quiet) -eq 1" interval: 10s start_period: 5s ```

   

* Service: Redis (redis): * Image: redis:alpine * Ports: 6379:6379 * Persistence: Map a volume to /data to ensure job queues survive container restarts.

Phase 2: Shared Domain Logic (The Contract)
Goal: Establish Type Safety across the network boundary.

Package Setup: packages/types

Initialize a TypeScript project with tsc --init.

Ensure declaration: true is set in tsconfig.json.

Tasks:

Define IIncident:

TypeScript
export interface IIncident {
  id: string;
  title: string;
  location: { lat: number, lng: number };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: Date;
}
Define IResource: { id: string, type: string, quantity: number, location: { lat: number, lng: number } }.

Constraint: These interfaces must be used by the Mongoose Models (Backend) and the React Components (Frontend).

Phase 3: The Backend (API) Architecture
Goal: Auto-generated Swagger docs and robust, modular architecture.

Setup Tsoa:

Install tsoa, express, mongoose, swagger-ui-express.

Config tsoa.json:

JSON
{
  "entryFile": "src/app.ts",
  "noImplicitAdditionalProperties": "throw-on-extras",
  "controllerPathGlobs": ["src/controllers/**/*Controller.ts"],
  "spec": { "outputDirectory": "src/build", "specVersion": 3 },
  "routes": { "routesDir": "src/build" }
}
**    

Modular Pattern Implementation:

src/controllers/: HTTP layer only. Class-based. Use decorators: @Route, @Get, @Post, @Body, @Tags.

src/services/: Business logic. Interact with Mongoose and BullMQ here.

src/models/: Mongoose Schemas. Must implement interfaces from packages/types.

Implement IncidentController:

POST /incidents: Validates input, saves to DB, pushes a job to BullMQ for notification processing.

GET /incidents: Returns list of incidents.

Phase 4: Asynchronous Processing (BullMQ)
Goal: Offload heavy tasks to ensure API responsiveness during high load.

Queue Factory:

Create src/infrastructure/redis.ts.

Export a Singleton Redis connection instance using ioredis.

Warning: Do not create a new connection for every queue event. Reuse the connection.    

Notification Queue & Sandbox Worker:

Create src/queues/notification.queue.ts.

Create src/workers/notification.worker.ts.

Sandboxing: The worker MUST be instantiated pointing to the file path of the processor, not the function itself.

Code Pattern:

TypeScript
const worker = new Worker('notifications', path.join(__dirname, 'workers/notification.processor.js'), {
   connection: redisConnection,
   concurrency: 5 // Process 5 jobs in parallel
});
**    

Phase 5: Frontend Offline Architecture
Goal: The app must be fully functional when the internet disconnects.

TanStack Query Configuration:

File: src/providers/QueryProvider.tsx.

Persistence: Import PersistQueryClientProvider from @tanstack/react-query-persist-client.

Persister:

TypeScript
const persister = createSyncStoragePersister({ storage: window.localStorage });
Client Options:

TypeScript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 Hours. Data remains on disk.
      staleTime: 1000 * 60 * 5,    // 5 Minutes. Prevents aggressive refetching.
      networkMode: 'offlineFirst', // CRITICAL: Reads cache if offline without error.
      retry: 3
    },
    mutations: {
      networkMode: 'offlineFirst'
    }
  }
});
**    

Optimistic Mutations:

Implement useMutation for creating incidents.

Use onMutate to immediately update the ['incidents'] query cache with the new data.

This ensures the user sees their report on the map instantly, even if the background sync is pending.

Phase 6: Geospatial Visualization
Goal: Map visualization without dependency on external validation servers (like Mapbox).

MapLibre Integration:

Install maplibre-gl and react-map-gl.

Component: src/components/IncidentMap.tsx.

Use <Map mapLib={maplibregl}... /> to force the use of the open-source library.

Style: Configure a style source that does not require a token (e.g., OpenStreetMap raster tiles for MVP, or a self-hosted vector tile server for production).    

Data Binding:

Fetch incidents via TanStack Query: const { data } = useQuery(...).

Render data as <Marker /> components.

Ensure markers are performant (use useMemo for the marker array if thousands of points exist).

3. Validation & Quality Assurance Protocols
The AI agent must perform the following validation steps to confirm the implementation meets the "ResQ" standard.

3.1 Infrastructure Validation
Command: docker-compose up -d

Verification: Run docker exec -it resq-mongo-1 mongosh --eval "rs.status()"

Success Criteria: The output must show "ok": 1 and identifying the node as PRIMARY. If it shows an error or "Not a replica set", the healthcheck script failed.    

3.2 Type Safety Validation
Action: Modify packages/types/src/index.ts. Change severity in IIncident to remove 'CRITICAL'.

Verification: Run pnpm build.

Success Criteria: Both apps/api (Controller validation) AND apps/web (React Component props) must fail to compile. This proves the "Single Source of Truth" is active.

3.3 Offline Capability Validation
Action:

Open the web application.

Wait for incidents to load.

Disconnect the network (via Browser DevTools > Network > Offline).

Reload the page.

Success Criteria: The incidents must still be visible on the map and list (loaded from LocalStorage). The app must not show a "Network Error" white screen.

3.4 Documentation Validation
Action: Navigate to http://localhost:3000/docs.

Success Criteria: The Swagger UI must be rendered. The POST /incidents endpoint must show the schema matching IIncident.

