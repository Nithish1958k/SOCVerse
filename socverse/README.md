# SOCVerse

A Security Operations Center (SOC) workflow simulator with two parts:

1. **`socverse.html`** — a self-contained, single-file simulator. No install, no
   build, no backend required. Open it in any browser and you get the full
   L1 → L2 → L3 workflow: a live alert engine, triage queue, investigation
   workspace, MITRE ATT&CK matrix, threat hunting, detection rules (Sigma/YARA),
   containment & response, SIEM consoles (Splunk/QRadar/Sentinel), an attack
   simulator, a metrics/SLA dashboard, and a reports module — all running in
   memory in the browser.

2. **`socverse-backend/`** — an optional production-style API
   (Express + MongoDB + JWT + RBAC + Socket.IO, Dockerized) that mirrors the same
   domain model, in case you want to back the simulator with a real server,
   persistence, multi-user auth, and live websocket updates.

---

## Run the simulator (fastest)

Just open the file:

- Double-click `socverse.html`, **or**
- In VS Code, install the **Live Server** extension, right-click `socverse.html`
  → *Open with Live Server*.

Log in by picking a role (L1 / L2 / L3 / Manager). The role controls which views
you can access, exactly like a real SOC.

---

## Run the backend (optional)

See **`socverse-backend/README.md`** for full details. Quick version with Docker:

```bash
cd socverse-backend
cp .env.example .env          # set a strong JWT_SECRET
docker compose up --build -d  # MongoDB + API on http://localhost:4000
docker compose run --rm seed  # demo users + initial alerts
```

Demo logins (password `Passw0rd!`): `l1@socverse.local`, `l2@…`, `l3@…`,
`manager@…`. Health check: `http://localhost:4000/api/health`.

---

## Project layout

```
socverse/
  socverse.html          ← the standalone simulator
  socverse-backend/      ← Express + MongoDB + Socket.IO API
    src/                 ← models, controllers, routes, middleware, services
    Dockerfile
    docker-compose.yml
    README.md            ← backend docs (endpoints, RBAC, sockets)
```

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: SOCVerse simulator + backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/socverse.git
git push -u origin main
```

`node_modules` and `.env` are git-ignored. Before pushing, run `git status` and
confirm you only see `.env.example` (never a real `.env`). Use a GitHub Personal
Access Token (not your password) when prompted over HTTPS.
