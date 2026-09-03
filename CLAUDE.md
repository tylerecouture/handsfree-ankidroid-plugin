# CLAUDE.md — context handoff

Briefing for an AI coding session (Claude Code or similar) picking up this repo.
Read this first, then `docs/DECISIONS.md` for the deeper "why."

## What this is

A hands-free voice-review plugin for **AnkiDroid**, implemented as a single
JavaScript file (`_ankivoice.js`) that card templates load from
`collection.media`. It reads cards aloud (Android TTS) and takes voice commands
(Android SpeechRecognizer) through AnkiDroid's JS API. It is **AnkiDroid-only**;
on Desktop/AnkiWeb the API is absent and the script hides itself.

## The hard constraint (read before proposing anything)

**You cannot run or test the plugin from the CLI.** It depends on AnkiDroid's
WebView JS API, which only exists on-device. The dev loop is:

1. Edit `_ankivoice.js`.
2. `node --check _ankivoice.js` and `node test/test.js` (pure functions only).
3. Manual verification on a physical AnkiDroid device by the maintainer.

Do **not** assume browser/Node behavior maps to AnkiDroid's WebView. Several
past bugs came from exactly that. See `docs/DECISIONS.md` → "Dead ends" and
"Environment facts."

## Architecture

One IIFE in `_ankivoice.js`, roughly in this order:

- **Header comment**: version + changelog + usage + platform note.
- **`CFG`** — all settings + their defaults. Right after, defaults are captured
  into `CFG_DEFAULTS`, then overrides are loaded (cookie first, then
  `localStorage`), then any empty `words_*` list is refilled from defaults.
- **UI elements** (all ids are `av-*`, all excluded from spoken text):
  - `av-root` — the bottom status bar; it's also the on/off toggle (tap it).
  - `av-heard` — the Voice-test readout (hidden unless `CFG.voiceTest`).
  - `av-gear` — the ⚙ settings button (far right).
  - `av-settings` — the settings panel overlay (built lazily).
- **Persistence helpers**: `lsGet/lsSet`, `getCookie/setCookie`. Settings save to
  the cookie (survives the random server port; see DECISIONS).
- **Keep-awake**: `keepAwake()/letSleep()` — screen wake lock + a muted 1px
  looping video (belt and suspenders), held only while actively reviewing.
- **Text extraction**: `textWithBreaks` → `extractLines` → `speechJoin`
  (line breaks become spoken pauses; `<small>` and `av-*` excluded);
  `subtractLines` (answer = card lines minus question lines); `hrLines` fallback.
- **Interval → speech**: `expandIvl` (+ `unwrapValue`, `AV_UNITS`).
- **Vocab matching**: `said(heard, key)` — a command fires if the heard text
  contains any word from `CFG.words_<key>` (the editable list).
- **`commandsText`** — spoken command help / first-card prompt.
- **`startFlow()`** — the per-card state machine. Uses a generation counter
  (`window.__avGen` + local `myGen`, `dead()`) to invalidate stale async work, a
  per-flow `listening` flag to guarantee one recognizer at a time, `speak`,
  `grade`, `countdown`, `listen`, and the `window.ankiSttResult` handler.
- **`stopFlow`, `onTap`** — toggle/stop logic.
- **Settings panel** — `AV_SETTINGS` (spec list), `saveCfg/resetCfg`,
  `buildPanel`, `openSettings/closeSettings`. Setting types: `bool`, `num`,
  `words` (text field).
- **`visibilitychange`** — stop everything when Anki backgrounds; re-acquire wake
  lock on return.
- **init IIFE** — waits up to 2s for `AnkiDroidJS` (bare name!); if absent, hides
  the UI (Desktop/AnkiWeb) and returns; else starts the flow (or paints "off").

## Flow summary

Question side: read the question (+ full command list on the first card of a
session) → countdown → listen. Heard "answer" reveals. Answer side: read the
answer → say "Mark it" → short delay → listen → a grade word calls
`ankiAnswerEaseN`, speaks the next interval, advances. Session state
(`av_qdone`/`av_adone`) resets after 5 min idle.

## Conventions

- **ES5-ish only.** Runs in whatever Android System WebView the user has. No
  optional chaining, no `let`/`const` in the shipped file if avoidable, etc.
  (Existing code uses `var` and function declarations deliberately.)
- **Fixed filename `_ankivoice.js`.** Never rename — templates reference it.
- **Version** lives in the header comment (`VERSION:`) and `CHANGELOG.md`. Bump
  both on any change.
- **All injected DOM uses `av-*` ids** so `textWithBreaks` excludes it from
  speech. If you add UI, use an `av-` id.
- Unicode in strings is written as `\uXXXX` escapes (or literal) — be careful
  when generating the file so escapes survive.

## Known gotchas (each cost real time)

- `AnkiDroidJS` is a **lexical global class**, not `window.AnkiDroidJS`. Check the
  bare name.
- `ankiGetNextTimeN` returns **raw response text**; `JSON.parse` it, read
  `.value`.
- Intervals need Reviewing → "Show next review time above answer buttons" ON.
- `SpeechRecognizer` is leaked by AnkiDroid — never start a second mic without
  stopping the first; the `listening` flag + stop-on-new-flow handle it.
- Each card side is a **full page reload** — no memory persists across sides.
- Server port is **random per launch** — `localStorage` is not durable; settings
  use a cookie.

## How to make and ship a change

1. Edit `_ankivoice.js`; bump `VERSION:` and add a `CHANGELOG.md` entry (and the
   header changelog).
2. `node --check _ankivoice.js && node test/test.js`.
3. Deploy: replace `_ankivoice.js` in `collection.media` (desktop), sync desktop,
   sync AnkiDroid. Verify on device.

## Open threads / roadmap

- Optional raw-URL loader for auto-deploy-on-commit (CORS already works).
- Per-side TTS language for language decks (`ankiTtsSetLanguage`).
- Upstream AnkiDroid patch to reduce beeps (silence-length extras + recognizer
  `destroy()`), and a bigger one to enable `getUserMedia`
  (`MODIFY_AUDIO_SETTINGS` + `AudioManager` mode). Details in DECISIONS.
