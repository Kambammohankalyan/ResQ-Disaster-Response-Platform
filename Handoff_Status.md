# ResQ System - Final Handoff

## 🟢 System Status: Operational

Both **Backend (API)** and **Frontend (Web)** are configured and running.

### 🔧 Fixes Applied

1.  **Backend (`apps/api`)**: Fixed `ts-node` crash by resolving proper `tsconfig` workspace paths (`TS6053`).
2.  **Frontend (`apps/web`)**: Fixed `Vite` startup crash by downgrading to v5 to match your Node.js `v20.18.1`.

### 🚀 Access Links

- **Web Interface**: [http://localhost:5173](http://localhost:5173)
  - _Features_: Offline Maps, Incident Reporting, Optimistic Updates.
- **API Documentation**: [http://localhost:4000/docs](http://localhost:4000/docs)
  - _Features_: Swagger UI, Auto-generated schemas.

### 📝 Usage Guide

1.  **Report an Incident**: Use the form on the Web UI.
2.  **Verify Offline Mode**:
    - Open Browser DevTools (F12) -> Network -> Select "Offline".
    - Submit a form. It will appear instantly in the list (Optimistic).
    - Go "Online". The data will sync to the server.
3.  **Check Database**:
    - `docker exec -it resq-mongo mongosh`
    - `use resq`
    - `db.incidents.find()`

The project is complete and strictly adheres to the provided architecture.
