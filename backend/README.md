# Thought Garden — Pilot Backend

A small Express + SQLite (`node:sqlite`) server that supports the pilot. **Thoughts themselves stay in the browser**; see "Pilot Layer & Privacy" in the root `README.md` for exactly what this server stores.

## Run

```bash
npm install                 # from the repo root
npm run dev:backend         # http://localhost:3001
node backend/test-backend.cjs
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `PILOT_DB_PATH` | `backend/pilot_garden.sqlite` | SQLite file (git-ignored; holds names, emails, feedback) |
| `ADMIN_PASSCODE` | *(unset → admin API disabled)* | Passcode for the admin dashboard |
| `LLM_API_KEY` | *(unset → Smart organising disabled)* | OpenAI-compatible provider key (e.g. Groq) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Provider endpoint |
| `LLM_MODEL` | `llama-3.1-8b-instant` | Model name |
| `CLASSIFY_RATE_LIMIT` | `10` | Smart organising requests per user per minute |

## Endpoints

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | — | Status; reports whether Smart organising is configured |
| `POST /api/pilot/signup` | per-user secret in body (first sync claims it) | Create/update a pilot profile |
| `POST /api/pilot/ping` | `x-user-secret` | Daily activity numbers |
| `POST /api/pilot/feedback` | `x-user-secret` if `userId` is given | Submit feedback (may be anonymous) |
| `DELETE /api/pilot/users/:id` | `x-user-secret` | Self-service deletion of profile, activity and feedback |
| `POST /api/classify` | `x-user-secret` | Smart organising (forwards to the LLM, stores nothing) |
| `GET /api/pilot/admin/overview` | `x-admin-passcode` | Admin dashboard data (never includes secret hashes) |
| `DELETE /api/pilot/admin/users/:id` | `x-admin-passcode` | Admin deletion of a pilot user |

When `frontend/dist` exists, the server also serves the built app.
