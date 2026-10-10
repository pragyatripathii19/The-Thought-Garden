# Technical Plan

## 1. Technical goals

- Build and host the first prototype with minimal or zero recurring infrastructure cost.
- Keep user content in the browser by default.
- Make core flows reliable before adding AI features.
- Keep code simple enough for a weekend prototype but structured enough to extend.

## 2. Suggested stack

Use the repository's existing stack if one exists. For a new project, a reasonable default is:

- React + TypeScript + Vite.
- CSS modules, plain CSS, or the existing styling system; avoid adding a heavy UI framework solely for the prototype.
- IndexedDB for persisted user data; use a small wrapper/library only if it materially reduces complexity.
- Local text similarity for connection suggestions.
- Static hosting on a free tier such as GitHub Pages, Cloudflare Pages, or Netlify, subject to their current plan limits.

No backend, database server, authentication, analytics, or paid LLM API is required for v1.

## 3. Suggested module boundaries

- `components/`: capture, thought card, collection card, connection suggestion, rediscovery card, dialogs.
- `pages/` or `views/`: garden/home, collection detail, search, settings/data.
- `data/`: IndexedDB schema, repository methods, export/import validation.
- `lib/search/`: local search and text normalization.
- `lib/connections/`: candidate generation, scoring, explanation, dismissal rules.
- `types/`: shared domain types.

Adapt this to the actual repository rather than imposing folders blindly.

## 4. Data model (initial proposal)

### Thought
- `id`: stable unique identifier.
- `text`: original user-authored text.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.
- `collectionIds`: IDs of collections this thought belongs to; can be empty.

### Collection
- `id`: stable unique identifier.
- `name`: user-visible collection name.
- `description`: optional short description.
- `createdAt`, `updatedAt`: ISO timestamps.

### Connection
- `id`: stable unique identifier.
- `sourceThoughtId`, `targetThoughtId`: IDs of two different thoughts.
- `status`: `suggested`, `accepted`, or `dismissed`.
- `score`: optional internal similarity score; not presented as a confidence percentage.
- `reason`: plain-language explanation based on observable text overlap.
- `createdAt`, `updatedAt`: timestamps.

If storing dismissed suggestions separately simplifies candidate generation, use a dedicated dismissed-pair record. Avoid duplicate relationship records for the same unordered pair.

## 5. Persistence and data safety

- Use IndexedDB for thoughts, collections, and connection states.
- Handle storage errors visibly; do not silently pretend a save succeeded.
- Provide JSON export containing a schema version and all user-created data.
- Validate imported JSON before making changes. Show a summary and require confirmation.
- Prefer a merge strategy with duplicate-ID handling, or clearly describe replace behaviour and require confirmation. Never silently replace the existing garden.
- Keep an import/export round-trip test.
- Do not send note content to any server or third-party API.
- Explain that clearing browser data may remove local content and that local storage does not automatically sync across devices.

## 6. Search

Start with normalized local substring/token matching. Search should be tolerant enough to find content without exact punctuation or capitalization. If the corpus grows, improve ranking later. No external search service is needed.

## 7. Connection suggestion algorithm

Start with a transparent baseline such as normalized token overlap or TF-IDF with cosine similarity. Use a stop-word list, minimum token lengths, and a conservative threshold. Return a reason derived from shared meaningful terms. Do not use the phrase “AI understands your thoughts” or imply deep semantic reasoning.

Potential future upgrade: a browser-local embedding model or optional remote embeddings with explicit consent. Do not implement this before testing whether suggestions are useful.

## 8. Error and edge cases

- Empty or whitespace-only thought cannot be saved.
- Long text remains readable and editable.
- Deleting a thought cleans up associated connections and collection membership.
- Deleting a collection should not delete its thoughts.
- Imported data may contain unknown schema versions, missing fields, duplicate IDs, or broken references.
- Connection candidates must exclude self-links and duplicate pairs.
- If storage is unavailable or quota is reached, show an actionable error and offer export where possible.

## 9. Privacy and security

- No account or tracking by default.
- No external requests containing thought text.
- Avoid logging user content to the console.
- Treat imported files as untrusted input and validate types, sizes, IDs, and references.
- Do not render thought text as HTML.

## 10. Hosting

Build as a static client-side app and deploy to a free static host. Confirm the host's current free-tier terms before public launch. Since data is browser-local, hosting the app does not mean the user's thoughts are uploaded to the host, but the privacy statement should accurately describe static assets and any requests the app makes.
