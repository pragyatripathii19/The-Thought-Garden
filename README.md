# The Thought Garden

A calm, local-first personal space for capturing unfinished thoughts and discovering useful relationships between them over time.

> *Every thought has a home, even when you don't know what that home is yet.*

---

## Repository Structure

```
├── docs/                     # Specifications, plans, UX references, and product briefs
│   ├── Frontend_Docs/        # Detailed phase implementation plans
│   ├── thought-garden-starter/# Core product brief, MVP spec, technical & build plans
│   └── Visual_Feel_References/# Visual style guides, card references, flow diagrams
├── frontend/                 # React 18 + Vite + TypeScript + Tailwind CSS application
│   ├── src/                  # Components, views, design system, and domain types
│   ├── package.json          # Frontend dependencies & scripts
│   └── ...
└── backend/                  # Pilot server: Express + SQLite (profiles, activity, feedback, Smart organising)
    ├── server.cjs
    └── test-backend.cjs
```

---

## Getting Started

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running the Pilot Backend
```bash
npm install          # root: express + cors
npm run dev:backend  # http://localhost:3001 (Vite proxies /api to it)
```

The app works without the backend; pilot sync, feedback and Smart organising simply stay offline.

To use the admin dashboard, set a passcode first (there is no default; without it the admin API is disabled):
```powershell
$env:ADMIN_PASSCODE = "choose-a-long-passcode"; npm run dev:backend
```

Run the backend tests with `node backend/test-backend.cjs` (uses a temporary database).

## Pilot Layer & Privacy

The original MVP had no accounts or analytics. For the pilot, a small optional layer was added — this is a deliberate, disclosed exception to the rules in `docs/thought-garden-starter/AGENTS.md`:

| Data | Where it goes | Notes |
|---|---|---|
| Thoughts, collections, connections | This browser only (IndexedDB) | Never sent to the server, except the opt-in Smart organising request below |
| Name, optional email, "why I'm here" reasons | Pilot server (SQLite) | Collected at onboarding |
| Daily counts (thoughts today, total, consecutive active days) | Pilot server | Numbers only, no text. Streaks are internal telemetry and are never shown to users |
| Feedback messages | Pilot server | Only what the user submits |
| Smart organising requests | Pilot server → LLM provider | Opt-in; forwarded, not stored or logged |

**Access control.** Each browser generates a random secret when the profile is created; the server stores only its SHA-256 hash and requires it (`x-user-secret` header) for profile updates, activity pings, attributed feedback, Smart organising and self-service deletion. Admin endpoints require `ADMIN_PASSCODE` and lock out an IP after 10 wrong attempts for 15 minutes. Users can delete their profile and all server-side records from **Data & Settings**.

### Automatic Organising
New thoughts are grouped into collections automatically, with an "Auto" badge and Undo on every change.

- **On this device (default):** a small embedding model (`Xenova/all-MiniLM-L6-v2` via Transformers.js, ~25 MB, downloaded once and cached) runs in a Web Worker to find similar thoughts. Clear matches join a collection; close pairs are offered as a "group these?" card. No thought text leaves the browser.
- **Smart organising (opt-in):** when the user turns it on, the new thought, up to 10 similar thoughts and collection names are sent via `POST /api/classify` to an OpenAI-compatible LLM, which can also create and name new collections. Configure the server with:

| Variable | Default | Purpose |
|---|---|---|
| `LLM_API_KEY` | *(unset → feature disabled)* | Provider API key, e.g. a free [Groq](https://console.groq.com) key |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint (Groq, OpenRouter, Ollama, …) |
| `LLM_MODEL` | `llama-3.1-8b-instant` | Model name at that provider |
| `CLASSIFY_RATE_LIMIT` | `10` | Requests per user per minute |

The server forwards requests without storing or logging thought text. Check your provider's free-tier limits and data terms before inviting testers.

### Building for Production
```bash
cd frontend
npm run build
```
