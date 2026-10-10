# Build Plan

## Guiding rule

Build the smallest complete experience first. Do not start with connection algorithms or decorative visuals before capture and persistence work reliably.

## Phase 0: Inspect and plan

- Inspect repository and current framework, scripts, and conventions.
- Read all product documentation.
- Identify the smallest file/folder structure compatible with the repo.
- Confirm how the app will be run and tested.

**Done when:** a concise plan exists and no unnecessary stack migration is proposed.

## Phase 1: App shell and visual foundation

- Create the responsive app shell and navigation.
- Establish color tokens, typography, spacing, card styles, focus states, and button variants.
- Build realistic empty states and responsive layout.

**Done when:** the app looks coherent at desktop and mobile sizes and controls are accessible.

## Phase 2: Capture and local persistence

- Implement create, edit, delete, list, and IndexedDB persistence.
- Add keyboard-friendly capture and save feedback.
- Add first-run and local-storage explanation.

**Done when:** thoughts survive refresh, are editable, and never require metadata to save.

## Phase 3: Search and collections

- Add local search.
- Implement collection create/rename/delete and thought membership.
- Ensure deleting a collection never deletes its thoughts.

**Done when:** users can find a thought and intentionally group related thoughts.

## Phase 4: Suggested connections

- Implement local candidate scoring and concise explanations.
- Add accept/dismiss actions and persist decisions.
- Keep accepted connections distinct from suggestions.

**Done when:** no self-links or duplicate pairs appear, dismissals are respected, and explanations are grounded in visible text overlap.

## Phase 5: Rediscovery and data portability

- Add a restrained older-thought card.
- Add validated JSON export/import.
- Test malformed imports and round-trip preservation.

**Done when:** rediscovery is useful but not repetitive, and users can back up and restore their data safely.

## Phase 6: Polish and deploy

- Verify keyboard navigation, mobile layout, empty states, error states, and contrast.
- Remove fake buttons, dead links, console noise, and unneeded dependencies.
- Run lint, type-check, tests, and production build.
- Deploy to a free static host and verify the deployed URL.

**Done when:** core flows work in the deployed version and known limitations are documented.

## Manual test checklist

- [ ] Save a thought with no title, tag, or collection.
- [ ] Refresh and confirm it remains.
- [ ] Edit the thought and verify original content changes only through explicit edit.
- [ ] Search by a partial phrase and different capitalization.
- [ ] Create a collection and add/remove a thought.
- [ ] Delete a collection and confirm its thoughts remain.
- [ ] Accept a suggested connection and confirm it persists.
- [ ] Dismiss a suggestion and confirm it does not immediately return.
- [ ] Export all data and inspect the JSON structure.
- [ ] Import a valid export and confirm all records are preserved.
- [ ] Try malformed JSON and confirm existing data remains untouched.
- [ ] Use the app at narrow mobile width and by keyboard only.
- [ ] Confirm no thought content is sent over the network.

## Initial user validation

Use the prototype personally with 30 real thoughts before inviting testers. Then test with 5-10 people who have scattered notes. Observe tasks rather than asking only whether they like the design. Focus on speed of capture, retrieval success, quality of connections, repeat use, and whether the value feels worth paying for.
