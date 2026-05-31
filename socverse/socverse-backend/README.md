# SOCVerse Backend

Production-style API for the **SOCVerse** Security Operations Center simulator —
built with **Express + MongoDB (Mongoose) + JWT auth + RBAC + Socket.IO**, and
containerized with Docker. It mirrors the domain model of the SOCVerse front-end
simulator: the same `L1 / L2 / L3 / Manager` roles, the 8 telemetry sources, the
correlated attack scenarios, and the 10-stage incident lifecycle.

---

## Architecture

```
src/
  config/        env loader + Mongoose connection (with retry)
  models/        User, Alert, Ticket, Case (Mongoose schemas)
  middleware/    auth (JWT), rbac (role guards), error (async + handler)
  controllers/   auth, alert, ticket, case, metrics
  routes/        one router per resource + aggregator + /health
  services/      alertEngine (synthetic telemetry), metricsService (MTTD/MTTR/SLA)
  sockets/       Socket.IO init with JWT handshake auth + metrics broadcast
  utils/         constants (shared taxonomy), random, sequence (atomic IDs), seed
  app.js         Express app factory (helmet, cors, compression, rate-limit)
  server.js      boot: DB connect -> HTTP+Socket -> alert engine -> graceful shutdown
```

**Request flow:** `authenticate` (verifies JWT, loads user) → `requireRole` /
`requireMinRole` (RBAC) → controller → Mongoose model → response, with every
state change broadcast over Socket.IO.

---

## Quick start — Docker (recommended)

```bash
cp .env.example .env          # then set a strong JWT_SECRET
docker compose up --build -d  # starts MongoDB + API on http://localhost:4000
docker compose run --rm seed  # seed demo users + initial alerts/scenarios
docker compose logs -f api    # watch the alert engine generate telemetry
```

## Quick start — local Node

```bash
npm install
cp .env.example .env          # set MONGO_URI (a local/remote MongoDB) + JWT_SECRET
npm run seed                  # optional: demo data
npm run dev                   # nodemon, http://localhost:4000
# or: npm start
```

Requires Node.js >= 18 and a reachable MongoDB.

---

## Demo accounts (created by `npm run seed`)

| Email                     | Role    | Password    |
|---------------------------|---------|-------------|
| l1@socverse.local         | L1      | `Passw0rd!` |
| l2@socverse.local         | L2      | `Passw0rd!` |
| l3@socverse.local         | L3      | `Passw0rd!` |
| manager@socverse.local    | Manager | `Passw0rd!` |

---

## API reference

All `/api/*` routes except `auth/register` and `auth/login` require
`Authorization: Bearer <token>`.

### Auth
| Method | Path                 | Access | Notes                          |
|--------|----------------------|--------|--------------------------------|
| POST   | `/api/auth/register` | public | `{ name, email, password, role? }` |
| POST   | `/api/auth/login`    | public | returns `{ token, user }`      |
| GET    | `/api/auth/me`       | any    | current user                   |

### Alerts
| Method | Path                              | Access | Notes |
|--------|-----------------------------------|--------|-------|
| GET    | `/api/alerts`                     | any    | filters: `severity, status, source, category, q, limit, skip` |
| GET    | `/api/alerts/:id`                 | any    | `_id` or `ALR-xxxxx` |
| PATCH  | `/api/alerts/:id/status`          | L1+    | `{ status, note }` — advances lifecycle stage |
| POST   | `/api/alerts/:id/false-positive`  | L1+    | |
| POST   | `/api/alerts/generate`            | L1+    | inject one ambient alert |
| POST   | `/api/alerts/scenario/:key`       | L1+    | inject correlated chain (`brute, phish, malware, ransom, privesc, exfil, insider, c2`) |

### Tickets
| Method | Path                       | Access | Notes |
|--------|----------------------------|--------|-------|
| GET    | `/api/tickets`             | any    | filters: `status, tier` |
| POST   | `/api/tickets`             | L1+    | `{ alertId, title?, priority?, assignedTier?, notes? }` → `INC-xxxx` |
| PATCH  | `/api/tickets/:id/status`  | L1+    | |

### Cases
| Method | Path                        | Access | Notes |
|--------|-----------------------------|--------|-------|
| GET    | `/api/cases`                | any    | filter: `status` |
| POST   | `/api/cases/escalate`       | **L2+** | `{ alertId }` → `CASE-xxxx`, auto-correlates IOC-sharing alerts |
| POST   | `/api/cases/:id/findings`   | **L2+** | `{ text }` |
| POST   | `/api/cases/:id/contain`    | **L3+** | `{ action: isolate \| block-ip \| disable-user }` |
| POST   | `/api/cases/:id/close`      | **L3+** | files RCA, closes anchor + related alerts |

### Metrics
| Method | Path           | Access            | Notes |
|--------|----------------|-------------------|-------|
| GET    | `/api/metrics` | **L3 + Manager**  | MTTD, MTTR, SLA %, FP rate, severity/source/status/category distributions |

### Health
`GET /api/health` → `{ status: "ok", ts }`

---

## RBAC model

Two complementary guards live in `middleware/rbac.js`:

- `requireRole(...roles)` — exact allow-list (used for Metrics = `L3, Manager`).
- `requireMinRole(min)` — hierarchical, using `ROLE_RANK` (`L1 < L2 < L3 < Manager`).

This matches the front-end simulator: L1 triages, L2 investigates/escalates, L3
hunts/contains/closes, and Manager has full visibility plus metrics.

---

## Real-time (Socket.IO)

Connect with the same JWT used for REST:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:4000', { auth: { token } });
socket.on('alert:new',     (a) => {/* live queue */});
socket.on('alert:updated', (a) => {/* status changes */});
socket.on('case:new',      (c) => {/* escalations */});
socket.on('case:updated',  (c) => {/* findings/containment */});
socket.on('ticket:new',    (t) => {/* new tickets */});
socket.on('metrics:update',(m) => {/* dashboard, pushed every 5s */});
```

Event names are centralized in `src/utils/constants.js` (`SOCKET_EVENTS`) so the
client and server never drift.

---

## Alert engine

`services/alertEngine.js` generates realistic per-source raw log lines, builds
alerts with extracted IOCs and MITRE technique IDs, and can inject correlated
attack chains that share a host / source IP / user / domain — exactly how a real
intrusion surfaces across multiple SIEM data sources. Toggle the ambient timer
with `ALERT_ENGINE_ENABLED` / `ALERT_ENGINE_INTERVAL_MS` in `.env`.

---

## Environment variables

See `.env.example`. Key ones: `PORT`, `MONGO_URI`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, `ALERT_ENGINE_ENABLED`,
`ALERT_ENGINE_INTERVAL_MS`.

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Connecting the simulator front-end

The single-file `socverse.html` simulator runs fully client-side with its own
in-memory engine. To back it with this API instead, point its data calls at
`http://localhost:4000/api`, store the JWT from `/api/auth/login`, and subscribe
to the Socket.IO events above for live updates. The field names line up with the
schemas in `src/models/` to keep that wiring straightforward.

---

## Testing notes

This scaffold was verified at the syntax, import-graph, app-construction, HTTP
routing, validation, JWT, and full RBAC-matrix levels. The Mongo-backed CRUD
paths are exercised by running against a real MongoDB — `docker compose up`
provides one out of the box.
```
