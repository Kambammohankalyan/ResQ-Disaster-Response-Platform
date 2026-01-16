# ResQ - Disaster Management System

## Project Status:  Ready for Deployment

This project has been implemented according to the 'ResQ' architectural blueprint. It is a strictly typed, offline-first monorepo designed for high-availability disaster management.

### Architecture
- **Infrastructure**: MongoDB Replica Set (ACID transactions), Redis (BullMQ), Docker Compose.
- **Backend**: Node.js/Express with **Tsoa** (Auto-Swagger) and **BullMQ** (Sandboxed Workers).
- **Frontend**: React 19 + Vite with **TanStack Query** (Offline Persistence) and **MapLibre** (No-token Maps).
- **Shared**: strict TypeScript interfaces in \packages/types\.

###  How to Run

1. **Start Infrastructure** (Database & Queue)
   \\\ash
   docker-compose up -d
   \\\`n   *Wait ~10 seconds for the MongoDB Replica Set to initialize.*

2. **Install Dependencies**
   \\\ash
   pnpm install
   \\\`n
3. **Start Development Server**
   \\\ash
   pnpm dev
   \\\`n   This will start both the API and Web apps in parallel via Turbo.

###  Access Points
- **Web App**: [http://localhost:5173](http://localhost:5173) - Map, Incident Reporting, Offline Sync.
- **API Swagger Docs**: [http://localhost:4000/docs](http://localhost:4000/docs) - OpenAPI exploration.
- **API Health**: [http://localhost:4000/health](http://localhost:4000/health)

###  Project Structure
- \pps/api\: Backend service.
- \pps/web\: Frontend application (Offline-first configured).
- \packages/types\: Shared domain models (IIncident, IResource).

###  Verification Steps
1. Open the Web App.
2. Go Offline (DevTools > Network > Offline).
3. Submit an Incident.
4. Refresh the page (Data will persist from LocalStorage).
5. Go Online.
6. The incident will sync to Backend (Check \docker logs\ or Swagger GET /incidents).
