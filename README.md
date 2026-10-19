# 🌱 The Thought Garden

> *Every thought has a home, even when you don't know what that home is yet.*

**A little space for all the things on your mind.** Write a thought down the moment it arrives, without deciding where it belongs. The Thought Garden files it for you, helps it grow, and brings it back when it matters.

### 👉 [Try it: the-thought-garden.onrender.com](https://the-thought-garden.onrender.com)

Free, works in any browser, and installs on your phone like an app.

---

## Why The Thought Garden?

Ever had a brilliant idea, scribbled it somewhere, and never found it again?

- **The notebook graveyard.** Ideas in margins and loose pages, never to be found again.
- **The endless notes app.** Hundreds of notes called "Ideas" and "Random". All saved, none findable.
- **The organizing rabbit hole.** More time building the perfect system than actually thinking.

Most tools ask you to organize *before* you write. That's backwards, especially for busy minds, people with ADHD, or anyone with more ideas than time. The Thought Garden flips it: **capture first, and let the garden do the sorting.** Not every thought needs to become a project. Some thoughts are seeds; some are just flowers.

## How it works

1. **🌰 Let it out.** Write it down as it is: messy, half-formed, unfinished.
2. **🌿 Let it find its place.** It settles into the right collection on its own. No folders, no tags.
3. **🌸 Come back when you're ready.** Old ideas resurface, connect, and grow as you return to them.

---

## Features

### ✍️ Capture without friction
- A capture box right on Home, plus a **New Thought** button everywhere (`Ctrl + N` on a laptop).
- Gentle writing prompts matched to why you're here (writing, research, startup ideas, mindfulness…).
- Room for long thoughts: up to 20,000 characters.

### 🗂️ Automatic organising
- New thoughts are **filed into collections for you**, each with an "Auto" badge and **Undo**.
- **Smart organising** (on by default) uses an AI model to choose, or even create and name, the right collection.
- **On-device organising** backs it up: a small embedding model running in your browser finds similar thoughts, files clear matches and suggests "group these?" for close pairs.
- Switch Smart organising off any time in Settings; your thoughts are then organised only on your device.

### 🌱 Thoughts that grow
Every thought has a growth stage that follows how you tend it:

| Stage | When |
|---|---|
| 🌰 **Seed** | Every new thought |
| 🌿 **Sprout** | You came back to it: edited, saved, collected or connected it |
| 🌸 **Bloom** | It's connected *and* has grown (edited more, longer, or in several collections) |
| 🌳 **Mature** | When you decide it's done |

### 🔗 Rediscovery & connections
- **Rediscovery:** Home brings back an older thought you may have forgotten.
- **Connections:** related thoughts are suggested so you can link them (or dismiss the suggestion) and see an idea's neighbours.

### 📚 Collections
- Starter collections based on why you joined, plus your own.
- Choose a colour and an icon for each (with a suggested icon from its name).
- Removing a collection never deletes its thoughts.

### 🔎 Find your way back
- **Search** by words, phrases or collection names.
- **Saved** keeps the thoughts you've bookmarked one tap away.
- **All Thoughts** shows your whole garden in one place.

### 📱 Feels like an app on your phone
- **Add to Home Screen** on iPhone and Android: your own icon, full screen, no browser bar, no App Store.
- Opens instantly from the home screen, even while the server wakes up.
- Long-press the icon (Android) for a **Plant a thought** shortcut.
- **Daily reminder:** add a gentle repeating nudge to your own calendar; tapping it opens a new thought.
- Built for phones: bottom navigation, sheets that slide up, no zoom-on-tap.

### 🔐 Your account, your data
- Email and password accounts, so your garden is the same on every device.
- **Export** a full backup (JSON) and **import** it any time.
- **Delete your account** and everything in it from Settings.
- Passwords are stored only as salted scrypt hashes, and sessions use secure, http-only cookies.

### 💬 Built with its first gardeners
- In-app **feedback** (idea, bug, love, question) goes straight to the maker.
- An **admin dashboard** for the pilot shows usage counts, organising health and feature use. It **never shows anyone's thought text**.

---

## Get it on your phone

- **iPhone:** open the link in **Safari** → tap **Share** → **Add to Home Screen**. Log in once inside the app.
- **Android:** open the link in **Chrome** → tap **Install app** (or menu → *Add to Home screen*).
- **Daily nudge:** in the app, go to **Settings → Daily reminder → Add to my calendar**.

## Good to know

- **Pilot stage.** The Thought Garden is in a small, free pilot. Expect rough edges, and please use **Feedback** in the app.
- **First visit after a quiet spell can be slow.** It runs on a free server that sleeps when unused, so waking can take up to a minute. The app shows a friendly "Can't reach the garden" screen with **Try again** meanwhile.
- **Privacy.** Your thoughts are stored on the server under your account and shown only to you in the app; the person running the server can access the database. With Smart organising on, a new thought, up to 10 similar ones and your collection names are sent to the AI provider to choose a collection. They are not stored or logged by our server. You can turn it off in Settings.
- **Forgotten password?** There are no reset emails yet. Ask the maker for a temporary password.
- **Back up anytime** with Settings → Export backup.

---

## Tech stack

| Layer | What's used |
|---|---|
| **Frontend** | React 18, TypeScript (strict), Vite 6, Tailwind CSS 3, lucide-react icons |
| **On-device AI** | Transformers.js running `Xenova/all-MiniLM-L6-v2` embeddings in a Web Worker; IndexedDB cache |
| **Smart organising** | Any OpenAI-compatible LLM API (default: Groq, `openai/gpt-oss-20b`), with rate limits and automatic fallback to on-device organising |
| **Backend** | Node.js 22, Express 4 |
| **Database** | PostgreSQL via `pg`, numbered SQL migrations applied on start; hosted on **Neon** (pooled connection for the app, direct for migrations) |
| **Auth & security** | Email + password, scrypt hashing, hashed session tokens in http-only, SameSite, Secure cookies; login lockout; JSON-only CSRF guard |
| **App on phones** | Progressive Web App: web manifest, maskable icons, service worker (never caches `/api`), install prompts, `.ics` calendar reminders |
| **Testing** | Vitest (frontend unit tests); an end-to-end API suite against a real Postgres test database |
| **Hosting** | **Render** (web service: the API and the built frontend from one origin) + **Neon** Postgres, both on free tiers |

---

## Developer guide

### Repository structure

```
├── docs/                      # Specifications, plans, UX references and product briefs
├── frontend/                  # React + Vite + TypeScript + Tailwind app (and the PWA files in public/)
└── backend/                   # Express + PostgreSQL: accounts, gardens, feedback, Smart organising, reminders
```

### Getting started

You need Node.js 22.9 or newer and PostgreSQL 16 or newer.

**1. Create the databases (once).** In `psql` as the `postgres` user:

```sql
CREATE ROLE thought_garden LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE thought_garden_dev OWNER thought_garden;
CREATE DATABASE thought_garden_test OWNER thought_garden;
```

**2. Configure.** Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `TEST_DATABASE_URL` and `ADMIN_EMAILS` (your email, to get the admin dashboard). `.env` is git-ignored.

**3. Run.**

```bash
npm install                      # root: server dependencies
npm run dev:backend              # http://localhost:3001, applies migrations on start
npm run dev:frontend             # http://localhost:5173 (proxies /api to the server)
```

Open http://localhost:5173 and create an account. The service worker only runs in production builds, so development always serves fresh code.

### Tests

```bash
npm test                         # frontend unit tests
npm run test:backend             # API tests against TEST_DATABASE_URL (wiped each run)
```

### Forgotten passwords

Run `npm run reset-password -- someone@example.com`. It prints a temporary password to send to them privately.

### Accounts & privacy

| Data | Where it goes | Notes |
|---|---|---|
| Thoughts, collections, connections, organiser history | Server (Postgres), per account | Only the owner sees them in the app. Whoever runs the server can access the database, so tell testers this |
| Name, email, password, "why I'm here" reasons | Server | Passwords are stored only as scrypt hashes |
| Feedback | Server | Only what the user submits |
| Embeddings for automatic organising | This browser (IndexedDB) | A per-device cache; rebuilt as needed and cleared on logout |
| Smart organising requests | Server → LLM provider | On by default for new accounts; switchable in Settings (saved on the account). Forwarded, not stored or logged |
| App files (not data) | The device (service worker cache) | Lets the installed app open instantly. `/api` responses are never cached |

**Admins.** The admin dashboard opens from the avatar menu for admins: accounts with `is_admin = true` in the `users` table, or emails listed in `ADMIN_EMAILS`. To make someone an admin, run `UPDATE users SET is_admin = true WHERE email = 'them@example.com';`. The dashboard shows counts per user (thoughts, activity per day, feedback) and never thought text.

**Old local gardens and backups.** Gardens saved in a browser before accounts existed show a card offering to add them to the signed-in account. Exported JSON backups import with **Settings → Your data → Import backup**.

See `backend/README.md` for the security model and API.

### Automatic organising

**On this device:** a small embedding model (~25 MB, downloaded once and cached) runs in a Web Worker to find similar thoughts. Clear matches join a collection; close pairs are offered as a "group these?" card.

**Smart organising:** sends the new thought, up to 10 similar thoughts and the collection names via `POST /api/classify` to an OpenAI-compatible LLM, which can also create and name new collections. The server refuses AI requests for accounts that turned it off.

**Fallback:** whenever the AI can't be used, the thought is organised on-device instead, and the AI is paused:
- a rate limit pauses it for as long as the provider asks; a provider-wide limit pauses it for all users;
- errors, timeouts (20 s) and network failures pause it for 30 s, doubling each time up to 10 minutes;
- an unusable answer (invented ids, no name) is replaced by the on-device decision.

Settings shows when it's paused and until when.

| Variable | Default | Purpose |
|---|---|---|
| `LLM_API_KEY` | *(unset → feature disabled)* | Provider API key, e.g. a free [Groq](https://console.groq.com) key |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint (Groq, OpenRouter, Ollama, …) |
| `LLM_MODEL` | `openai/gpt-oss-20b` | Model name at that provider |
| `LLM_REASONING_EFFORT` | `low` for gpt-oss models, otherwise unset | Sent as `reasoning_effort`; reasoning models otherwise spend their output budget thinking |
| `CLASSIFY_RATE_LIMIT` | `10` | Requests per user per minute |

Check your provider's free-tier limits and data terms before inviting testers.

### Deploying (Render + Neon, free tiers)

1. **Database:** create a project at [neon.tech](https://neon.tech). Copy its **pooled** connection string (the host contains `-pooler`) and its **direct** one.
2. **App:** on [render.com](https://render.com), create a **Web Service** from this GitHub repo:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment variables:
     - `DATABASE_URL`: the pooled Neon string, used by the app
     - `DATABASE_URL_UNPOOLED`: the direct Neon string, used for migrations
     - `NODE_ENV`: `production`
     - `ADMIN_EMAILS`: your email
     - optionally `LLM_API_KEY`
3. Open the Render URL and sign up. Migrations run automatically on every start.

**Branches:** tested work goes to `local-dev` first. `main` is what users get, and Render deploys from it.

Render's free tier sleeps after a period without visits, so the first visit afterwards can take up to a minute. Check both providers' current free-tier terms before relying on them.

---

<p align="center"><i>The Thought Garden. Every thought has a home.</i><br/>Grown with care by Pragya</p>
