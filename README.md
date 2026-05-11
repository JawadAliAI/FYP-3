# FYP-3 — AI Fitness Trainer

Final-year monorepo: React frontend plus three Python APIs (exercise tracking, workout plans, FitBot assistant).

## Repository layout

| Folder | Role | Default local port |
|--------|------|--------------------|
| `AI-Fintess-Trainer-Frontend-V3-main` | React + Vite + Supabase | `8080` (`npm run dev`) |
| `AI-Fitness-Trainer-Exercises-main` | Pose / rep counting API (FastAPI) | `11003` |
| `AI-Workout-Suggestion-main` | Gemini workout generator (FastAPI) | `11002` |
| `FYP-Assistent--main` | FitBot chat + voice (FastAPI, Groq) | `11001` |
| `scripts/` | Local dev helpers | — |
| `AI-Workout-Suggestion-main/devtools/` | Optional Gemini debug scripts | — |

Production can use **Render** (each service has `render.yaml`) or **Docker** (`docker-compose.yml` at repo root).

---

## Run everything locally

### 1. API keys

1. Copy `/.env.example` to `/.env` in the repo root.
2. Set `GROQ_API_KEY` (Groq console) and `GEMINI_API_KEY` (Google AI Studio).

### 2. Python dependencies (once per service)

Use a **virtual environment per service** if your global Python already has conflicting packages (for example MCP or Open Interpreter).

```powershell
cd AI-Fitness-Trainer-Exercises-main; pip install -r requirements.txt
cd ..\AI-Workout-Suggestion-main;     pip install -r requirements.txt
cd ..\FYP-Assistent--main;            pip install -r requirements.txt
```

FitBot uses audio libraries; on Linux install `ffmpeg` and PortAudio dev packages if imports fail (see that service’s `Dockerfile`).

### 3. Start the three APIs

**Windows (separate windows):**

```powershell
.\scripts\run-local.ps1
```

**macOS / Linux / WSL (one terminal, background jobs):**

```bash
bash scripts/run-local.sh
```

Health checks: `http://127.0.0.1:11001/health`, `...11002/health`, `...11003/health`.

### 4. Frontend

```powershell
cd AI-Fintess-Trainer-Frontend-V3-main
copy .env.development.example .env.development.local
```

Edit `.env.development.local`: add your **Supabase** URL and anon key. API URLs default to `127.0.0.1:1100x` in the example file; adjust if you use Docker ports instead.

```powershell
npm install
npm run dev
```

Open **http://localhost:8080**. Login and Supabase-backed features need valid Supabase env vars.

---

## Docker (all services)

From repo root (after filling `.env`):

```bash
docker compose build
docker compose up -d
```

- Open the UI at **http://localhost:11000** (or `http://YOUR_SERVER_IP:11000` on Contabo).
- The nginx container proxies **`/api/exercises`**, **`/api/workout`**, **`/api/assistant`** to the three FastAPI services, so the browser only needs port **11000** for API calls (no wrong IP baked into the JS build).
- Ports `11001`–`11003` remain exposed for debugging; you may firewall them on Contabo if you rely only on the proxy.

### Camera on Contabo

Browsers treat **`http://a.public.ip.address`** as an insecure origin: **the camera will not open** (only rep counting / mock flow works). To get a live camera preview you need **HTTPS** with a real certificate, for example:

1. Point a domain (e.g. `fitness.example.com`) A-record to your Contabo IP.
2. Put Caddy or nginx + Certbot in front of port 11000 (or terminate TLS on a host reverse proxy) with Let’s Encrypt.

Edit `AI-Fintess-Trainer-Frontend-V3-main/.env.production` with your **Supabase** URL and anon key before `docker compose build`, then run `bash deploy.sh` on the server.

---

## Deploy script (Contabo)

`deploy.sh` patches the frontend production env with `SERVER_IP` then runs `docker compose`. Use on a Linux server with Docker installed.

---

## Security note

If you ever committed API keys, **rotate them** in the provider consoles and rely on `.env` / Render secrets only. Dev helpers under `AI-Workout-Suggestion-main/devtools/` read `GEMINI_API_KEY` from the environment or that service’s `.env` file — never hardcode keys in source.
