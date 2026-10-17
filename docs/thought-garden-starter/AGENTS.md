# Instructions for AI Coding Agents

## First steps

- Read `README.md` and every file in `docs/` before making architectural decisions.
- Inspect the existing repository before creating or replacing files.
- If the repository already has a stack or conventions, preserve them unless there is a concrete reason to change them.
- Build a working, polished prototype, not just a static mockup.

## Product constraints

- The product is **The Thought Garden**: a calm, local-first place to capture unfinished thoughts and discover relationships over time.
- The primary action is quick capture. Do not require metadata, tags, folders, or choosing a collection before saving.
- Preserve each original thought verbatim unless the user explicitly edits it.
- Suggested collections and connections must be reviewable and reversible. Never silently move, merge, rewrite, or delete thoughts.
- A thought does not need to become a task. Avoid streaks, productivity guilt, forced goals, or excessive notifications.
- Do not describe keyword similarity as semantic AI understanding.
- Automatic organising (added after the MVP) must stay visible and reversible: every automatic change carries an "Auto" marker, an Undo, and an activity-log entry; thoughts the user organised by hand are never changed again. Smart organising (thought text sent to an AI service) is on by default for the pilot. It must stay disclosed at sign-up with a visible way to turn it off, be stored per account, and be refused by the server for accounts that turned it off.
- Clearly communicate where data is stored (the user's account on the server) and who can access it. Provide export and import.

## Pilot exception (current state)

For the v1 pilot with a few invited users, the repository deliberately adds accounts (email and password) and stores each user's garden in PostgreSQL, so data survives cleared browsers and follows the user across devices. It also has feedback, an admin dashboard (counts only, never thought text), and Smart organising (on by default, disclosed at sign-up, falls back to on-device organising whenever the AI is unavailable). Streak numbers are internal telemetry only and must not be shown to users. Keep what is stored, and who can access it, disclosed in the UI (Data & Settings, sign-up screen) and documented in the root `README.md` ("Accounts & Privacy"); do not expand it without updating both.

## Scope discipline

Implement only the MVP in `docs/MVP_SPEC.md`. Do not add accounts, cloud sync, paid AI APIs, voice capture, collaboration, mobile apps, browser extensions, or elaborate graph visualizations unless explicitly requested.

## Engineering expectations

- Use TypeScript and accessible, semantic UI where compatible with the existing project.
- Keep components small and responsibilities clear. Separate UI, storage, search, and connection-suggestion logic.
- Handle empty, loading, error, and first-run states.
- Persist data safely; validate imported JSON and handle malformed or unsupported files without overwriting existing data.
- Add tests for core data operations, export/import, search, and connection suggestions.
- Avoid collecting analytics or sending thought content to any server.
- Do not add dependencies without explaining why they are needed.
- Keep the app responsive and keyboard-friendly. Support Enter to save when appropriate, but do not hijack Enter inside multiline editing.
- Run available checks and report what passed, what failed, and what remains unverified.

## Visual direction

Use warm off-white backgrounds, muted sage/leaf greens, restrained botanical details, generous spacing, readable typography, and quiet interactions. The app should feel thoughtful and modern, not childish, overly decorative, or like a corporate dashboard. Maintain contrast and visible focus states.

## Working style

Before a substantial change, state a short implementation plan. Make small coherent changes, verify them, and summarize changed files and test results. Do not claim a feature works unless you ran or otherwise verified it.
