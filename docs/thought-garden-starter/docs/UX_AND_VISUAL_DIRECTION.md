# UX and Visual Direction

## 1. Experience goal

The product should feel like a calm place to put down a thought, not a productivity system demanding maintenance. It should be warm and distinctive without sacrificing speed, readability, or clarity.

## 2. Brand language

**Name:** The Thought Garden  
**Tagline:** Every thought has a home, even when you don't know what that home is yet.

Supporting line: “Plant a thought. Let the garden grow.”

Use the garden metaphor lightly. It should create emotional warmth, not turn the interface into a literal gardening simulation.

## 3. Visual direction

- Background: warm off-white / parchment.
- Accent: muted sage and leaf green.
- Secondary accents: soft clay, pale moss, muted ochre used sparingly.
- Typography: highly readable sans-serif for UI; optional restrained editorial serif for the brand heading only.
- Shapes: gently rounded cards and soft dividers, not pills everywhere.
- Illustrations: subtle botanical line art or small sprout details used sparingly.
- Motion: brief, quiet transitions only; respect reduced-motion preferences.
- Density: generous whitespace, but enough information visible to make browsing efficient.
- Accessibility: strong text contrast, visible keyboard focus, semantic headings, labelled controls, and comfortable touch targets.

Avoid neon gradients, excessive glassmorphism, cartoon plants, floating decorative particles, and dashboards full of metrics.

## 4. Information hierarchy

Home screen priority:
1. Capture thought.
2. See a useful rediscovery or connection, if one exists.
3. Browse recent thoughts.
4. Navigate to collections or search.
5. Access data controls without hiding the fact that data is local.

Capture must remain the clearest primary action.

## 5. Copy principles

- Calm, clear, human, and non-judgmental.
- Never shame users for unfinished or old thoughts.
- Avoid productivity jargon such as “crush your goals,” “inbox zero,” or “optimize your mind.”
- Explain suggestions as possibilities, not facts.
- Use concise copy; avoid lengthy onboarding.

Suggested UI copy:
- Capture placeholder: “What's on your mind?”
- Save action: “Plant thought” or simply “Save thought” if metaphor reduces clarity.
- Unsorted state: “This thought hasn't found a collection yet. That's okay.”
- Connection heading: “This might connect to…”
- Connection explanation: “Both thoughts mention…”
- Empty garden: “Your garden starts with one thought.”
- Rediscovery: “A thought to revisit”
- Local storage notice: “Your thoughts are saved in this browser. Export a backup to keep a copy.”

Prefer clarity over metaphor in destructive actions and data controls.

## 6. Interaction rules

- Saving a thought should require as few steps as possible.
- Preserve multiline input when the user needs it; don't hijack Enter unexpectedly.
- Provide a clear saved state without a blocking modal.
- Editing should be explicit and reversible where feasible.
- Confirm destructive actions such as deleting a thought or replacing data on import.
- Explain why a connection is suggested and offer clear accept/dismiss actions.
- No forced onboarding, streaks, badges, or reminders in v1.

## 7. Responsive behaviour

Desktop can use a compact sidebar or top navigation and a central content area. Mobile should prioritize the capture field and a simple list; avoid desktop layouts squeezed into a narrow screen. Do not make the botanical visuals consume more space than the thoughts themselves.

## 8. Quality bar

The interface should feel intentionally designed, not like a default component library demo. Every screen needs thoughtful spacing, clear hierarchy, useful empty states, and realistic example content. Avoid placeholder links and controls that appear interactive but do nothing.
