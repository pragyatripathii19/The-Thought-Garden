# Thought Garden: Server

Express + PostgreSQL. It stores accounts and each user's garden: thoughts, collections, connections and the organiser's activity log. It also serves the built frontend from the same address.

## Layout

| File | Purpose |
|---|---|
| `server.cjs` | Entry point: runs migrations, then listens |
| `app.cjs` | Builds the Express app (used by the server and the tests) |
| `config.cjs` | Reads environment variables |
| `db.cjs`, `migrate.cjs`, `migrations/*.sql` | Connection pool and schema migrations (applied automatically on start) |
| `auth.cjs` | Password hashing (scrypt), session cookies |
| `garden.cjs` | Validation and per-user SQL for the garden |
| `routes/*.cjs` | HTTP routes |
| `scripts/reset-password.cjs` | Sets a new temporary password for an account |
| `test-backend.cjs` | End-to-end API tests against a test database |

## Run locally

```bash
cp .env.example .env        # then fill in DATABASE_URL etc.
npm install                 # from the repo root
npm run dev:backend         # http://localhost:3001 (migrations run on start)
npm run test:backend        # needs TEST_DATABASE_URL; wipes that database
npm run reset-password -- someone@example.com
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | *(required)* | Postgres connection string |
| `TEST_DATABASE_URL` | *(tests only)* | Must name a database containing "test"; its tables are dropped each run |
| `ADMIN_EMAILS` | *(empty)* | Comma-separated emails that can open the admin dashboard. Accounts with `users.is_admin = true` can too |
| `PORT` | `3001` | HTTP port |
| `NODE_ENV` | | Set to `production` when deployed: secure cookies and trusting the hosting proxy for client IPs |
| `LLM_API_KEY` | *(unset → Smart organising off)* | OpenAI-compatible provider key (e.g. Groq) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Provider endpoint |
| `LLM_MODEL` | `openai/gpt-oss-20b` | Model name |
| `LLM_REASONING_EFFORT` | `low` for gpt-oss models | Sent as `reasoning_effort` when set |
| `LLM_MAX_TOKENS` | `600` | Output token limit per request |
| `CLASSIFY_RATE_LIMIT` | `10` | Smart organising requests per user per minute |

## Security model

- **Passwords** are hashed with scrypt and a random salt. **Sessions** are random tokens in an `HttpOnly`, `SameSite=Lax` cookie (also `Secure` in production). They last 30 days and are extended when used; only a SHA-256 hash of each token is stored.
- **Every garden query is scoped by the user id from the session.** Ids in URLs and bodies only pick rows inside that user's garden. Garden tables use `(user_id, id)` keys because the browser generates ids and every account has the same starter collection ids.
- **CSRF:** write requests must be `application/json`. Combined with `SameSite=Lax` and no CORS, other sites can't make the browser send authenticated writes.
- **Login** locks an email for 15 minutes after 10 wrong passwords, and an IP after 30. Signups are limited to 10 per IP per hour. These limits live in memory and reset when the server restarts.
- **Deleting an account** needs the password, and cascades to every row the account owns.
- The **admin dashboard** shows counts only, never thought text.

## Endpoints

All `/api` routes except health, signup and login need a session.

| Method & path | Purpose |
|---|---|
| `GET /api/health` | Status, database reachability, whether Smart organising is configured |
| `POST /api/auth/signup` · `login` · `logout` | Accounts and sessions |
| `GET` / `PATCH /api/auth/me` | Current user; update name and reasons |
| `DELETE /api/auth/account` | Delete the account (body: `{ password }`) |
| `GET /api/thoughts` · `PUT /api/thoughts/:id` · `DELETE /api/thoughts/:id` | Thoughts (PUT creates or replaces) |
| `GET` · `PUT /:id` · `DELETE /:id` on `/api/collections`, `/api/connections` | Same pattern |
| `GET /api/organize-events` · `PUT /api/organize-events/:id` | Organiser activity log and Undo |
| `DELETE /api/{thoughts,collections,connections,organize-events}` | Clear one resource |
| `POST /api/garden/import` | Import a backup (`{ garden, strategy: "merge" or "replace" }`) in one transaction |
| `POST /api/feedback` | Submit feedback |
| `POST /api/classify` | Smart organising (forwards to the LLM, stores nothing). 403 if the account turned it off; 429 with `retryAfterSeconds` for per-user limits or a provider rate limit (which pauses all users); 502 provider error; 504 timeout; 503 not configured |
| `GET /api/admin/overview` · `DELETE /api/admin/users/:id` | Admin only |
