# NPC cognition public demo

A small, runnable extraction/adaptation of the owner's private RPG NPC cognition design. This is real JavaScript with executable behavioral tests, not a screenshot or a hosted mockup.

## Run offline

Requires Node.js 20 or newer. No installation, API key, paid service or external dependency is needed.

```sh
npm test
npm run demo
```

## What it demonstrates

- A speaker-scoped context omits private memories and player-only knowledge.
- Speech proposals must match the current context, speaker, allowed priority and available evidence IDs.
- A resentful NPC can maintain a boundary rather than automatically agreeing.
- Only the engine commits accepted dialogue. Speech is attributed speech, not an authoritative world fact.
- Movement and intervening turns invalidate stale proposals. Dialogue stays bounded and isolated by speaker.
- Inventory and knowledge cannot be changed through proposal fields.

## Extraction and disclosure scope

The owner authorized a separate minimal public demonstration. `cognition.js` adapts the strict proposal shape, speaker/context checks, evidence checks, boundary rule and capped attributed-dialogue archive from `npc_cognition_v1.js`. The original `npc_cognition_v6.test.js` informed behavioral coverage; the tests and synthetic fixtures here were written for this standalone demo.

The original game remains private. This repository contains no game profiles, lore, artwork, private conversations, service configuration, credentials, original test logs, or original Git history. Names, locations and dialogue here are synthetic. Context construction and commit handling are simplified; hashing uses Node's built-in SHA-256. No license grant for the original private game is implied.

## Limits

This is an offline deterministic validation demo. The proposal in `demo.js` is a fixture, not a live model response. There are no model calls or subscriptions. Tests do not establish production security or truthfulness of arbitrary prose. Evidence IDs indicate allowed references, not semantic verification of claims. The original game's lore-specific and consent-language filters, integrations, and richer history retrieval are intentionally excluded. Rendering applications must still escape dialogue text.

See `TEST_RESULTS.txt` for the captured local test run. Run `npm test` to reproduce it.
