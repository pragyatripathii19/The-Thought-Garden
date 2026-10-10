# MVP Specification

## 1. MVP outcome

A user can quickly capture thoughts, browse and search them, review suggested connections, group related thoughts into collections, revisit an older thought, and export/import their data. The experience must work without an account or paid API.

## 2. Primary user stories

### Capture
- As a user, I can type a thought and save it immediately without assigning a title, tag, folder, or collection.
- As a user, I can edit or delete my own thought.
- As a user, I can distinguish when a thought was captured and last edited.

### Browse and search
- As a user, I can see recent thoughts in reverse chronological order.
- As a user, I can search thought text and collection names.
- As a user, I can open a thought and see its current collection membership and confirmed connections.

### Connections and collections
- As a user, I can see a suggested connection with a short explanation of the shared words or themes.
- As a user, I can accept or dismiss a suggestion.
- As a user, I can create, rename, and delete a collection.
- As a user, I can add or remove thoughts from a collection without losing the original thought.
- A thought may exist without a collection and may belong to more than one collection if the data model supports it cleanly.

### Rediscovery
- As a user, I can see one older thought on the home screen when enough thoughts exist.
- I can open it, dismiss it for now, or revisit its collection.
- Rediscovery must not repeat the same thought on every page load without an explicit reason.

### Data ownership
- As a user, I can export all thoughts, collections, and confirmed connections to a JSON file.
- As a user, I can import a valid export with a clear preview/confirmation step.
- Import must validate data and must not silently overwrite existing data.
- The app clearly explains that data lives in this browser and is not automatically synced or backed up.

## 3. Required screens

1. **Garden / Home**: quick-capture field, recent thoughts, a small rediscovery card, and suggested connections when available.
2. **Thought detail/edit**: full text, timestamps, related collections, confirmed connections, edit/delete controls.
3. **Collection view**: collection title, description optional, member thoughts, and add/remove controls.
4. **Search results**: matching thoughts and collections with clear empty state.
5. **Settings / Data**: export, import, and local-storage explanation.

A responsive single-page app is sufficient. Avoid adding a large navigation system.

## 4. Suggested first-run experience

- Briefly explain the promise in one sentence.
- Show a prominent input with placeholder: “What's on your mind?”
- Include 2-3 optional sample thoughts only if users can remove them easily. Never insert fake content without telling the user.
- Explain local storage and export in a short, accessible notice.

## 5. Connection suggestion rules for v1

- Use lightweight local text similarity; no external API and no network call with thought content.
- Normalize text, remove common stop words, and compare token overlap or TF-IDF/cosine similarity. Choose the simplest reliable implementation for the repository.
- Do not suggest a thought as connected to itself or repeatedly show an already accepted/dismissed pair.
- Set a conservative threshold. If no plausible match exists, show no suggestion rather than a weak one.
- Give a transparent explanation such as “Both thoughts mention writing and publishing.” Do not claim to understand deeper meaning.
- Suggestions must be accepted or dismissed by the user. Dismissal should be remembered so the same pair is not immediately suggested again.
- Keep confirmed relationships separate from suggestions.

## 6. Acceptance criteria

- A new thought can be saved with one primary action and no required metadata.
- Saved thoughts survive refresh in the same browser.
- Search returns relevant matching content and has a useful no-results state.
- Original text is not changed by the connection algorithm.
- Accepting a suggestion creates a persistent relationship; dismissing it prevents immediate reappearance.
- Collections can be created and edited; membership changes do not duplicate or delete thoughts.
- Export contains all user-created content and can be validated by a round-trip import test.
- Invalid imports produce a clear error and leave current data unchanged.
- The interface works on desktop and mobile widths and is usable with keyboard navigation.
- The local-only limitation is disclosed in the UI.

## 7. Explicitly out of scope

Voice, transcription, login, cloud sync, collaboration, reminders, external integrations, AI-generated summaries, AI chat, automatic content rewriting, public sharing, subscriptions/payments, and complex graph visualizations.

## 8. Prototype validation

Use the app personally with at least 30 real thoughts from different areas of life. Then recruit around 5-10 people who experience scattered notes. Watch them capture, search, judge suggestions, and return to an older idea. Ask what they would use it for and what they would stop using; do not lead them toward praise. Offer paid early access only after being clear about the prototype's actual limitations.
