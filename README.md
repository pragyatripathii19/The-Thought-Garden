# The Thought Garden

A calm personal space for capturing unfinished thoughts and discovering useful relationships between them over time.

> *Every thought has a home, even when you don't know what that home is yet.*

---

## Repository Structure

```
├── docs/                     # Specifications, plans, UX references, and product briefs
│   ├── Frontend_Docs/        # Detailed phase implementation plans
│   ├── thought-garden-starter/# Core product brief, MVP spec, technical & build plans
│   └── Visual_Feel_References/# Visual style guides, card references, flow diagrams
├── frontend/                 # React 18 + Vite + TypeScript + Tailwind CSS application
└── backend/                  # Express + PostgreSQL: accounts, gardens, feedback, Smart organising
```

---

## Getting Started

You need Node.js 22.9 or newer and PostgreSQL (16 or newer).

### 1. Create the databases (once)

In `psql` as the `postgres` user:

```sql
CREATE ROLE thought_garden LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE thought_garden_dev OWNER thought_garden;
CREATE DATABASE thought_garden_test OWNER thought_garden;
```

### 2. Configure

Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `TEST_DATABASE_URL` and `ADMIN_EMAILS` (your email, to get the admin dashboard). `.env` is git-ignored.

### 3. Run

```bash
npm install                      # root: server dependencies
npm run dev:backend              # http://localhost:3001, applies migrations on start
npm run dev:frontend             # http://localhost:5173 (proxies /api to the server)
```

Open http://localhost:5173 and create an account.

### Tests

```bash
npm test                         # frontend unit tests
npm run test:backend             # API tests against TEST_DATABASE_URL (wiped each run)
```

### Forgotten passwords

There are no reset emails yet. Run `npm run reset-password -- someone@example.com`, which prints a temporary password to send them privately.

## Accounts & Privacy

Everyone signs up with an email and password. Their garden is stored in Postgres under their account, so nothing is lost when a browser is cleared, and the same garden appears on every device they log in from.

| Data | Where it goes | Notes |
|---|---|---|
| Thoughts, collections, connections, organiser history | Server (Postgres), per account | Only the owner sees them in the app. Whoever runs the server can access the database, so tell testers this |
| Name, email, password, "why I'm here" reasons | Server | Passwords are stored only as scrypt hashes |
| Feedback | Server | Only what the user submits |
| Embeddings for automatic organising | This browser (IndexedDB) | A per-device cache; rebuilt as needed and cleared on logout |
| Smart organising requests | Server → LLM provider | Opt-in; forwarded, not stored or logged |

The admin dashboard (for emails in `ADMIN_EMAILS`) shows counts per user: thoughts, activity per day and feedback. It never shows thought text. Users can delete their account, and everything in it, from **Data & Settings**.

Gardens saved in a browser before accounts existed show a card offering to add them to the signed-in account. Exported JSON backups import with **Data & Settings → Import Backup**.

See `backend/README.md` for the security model and API.

### Automatic Organising
New thoughts are grouped into collections automatically, with an "Auto" badge and Undo on every change.

- **On this device (default):** a small embedding model (`Xenova/all-MiniLM-L6-v2` via Transformers.js, ~25 MB, downloaded once and cached) runs in a Web Worker to find similar thoughts. Clear matches join a collection; close pairs are offered as a "group these?" card.
- **Smart organising (opt-in):** when the user turns it on, the new thought, up to 10 similar thoughts and collection names are sent via `POST /api/classify` to an OpenAI-compatible LLM, which can also create and name new collections. Configure the server with:

| Variable | Default | Purpose |
|---|---|---|
| `LLM_API_KEY` | *(unset → feature disabled)* | Provider API key, e.g. a free [Groq](https://console.groq.com) key |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint (Groq, OpenRouter, Ollama, …) |
| `LLM_MODEL` | `llama-3.1-8b-instant` | Model name at that provider |
| `CLASSIFY_RATE_LIMIT` | `10` | Requests per user per minute |

The server forwards requests without storing or logging thought text. Check your provider's free-tier limits and data terms before inviting testers.

## Deploying (Render + Neon, free tiers)

1. **Database:** create a project at [neon.tech](https://neon.tech) and copy its connection string (it ends in `?sslmode=require`).
2. **App:** on [render.com](https://render.com), create a **Web Service** from this GitHub repo:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment variables:
     - `DATABASE_URL`: the Neon string
     - `NODE_ENV`: `production`
     - `ADMIN_EMAILS`: your email
     - optionally `LLM_API_KEY`
3. Open the Render URL and sign up. Migrations run automatically on every start.

Render's free tier goes to sleep after a period without visits, so the first visit afterwards can take up to a minute. The app shows a "Can't reach the garden" screen with **Try again** while it wakes. Check both providers' current free-tier terms before relying on them.
