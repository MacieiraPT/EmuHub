# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

EmuHub is an Electron desktop app that catalogues the console emulators a user already has installed and launches them. It never downloads, bundles or installs emulator software, and it ships no game content.

## Commands

```bash
npm run dev              # electron-vite dev server with hot reload
npm run build            # typecheck (both projects) then build all three bundles
npm run typecheck        # typecheck:node + typecheck:web — run this before any push
npm start                # preview the production build
npm run icons            # regenerate resources/ from scripts/generate-icons.mjs
npm run dist:win         # NSIS installer; also dist:linux, dist:mac
```

There is **no test suite and no linter configured**. `npm run typecheck` is the only automated check, so lean on it: both tsconfig projects run in strict mode with `noUnusedLocals` and `noUncheckedIndexedAccess`. Do not invent a `npm test` invocation.

`src/shared/` is compiled by *both* tsconfig projects, so a change there must satisfy the Node and DOM lib sets at once.

## Architecture

Three isolated processes with one shared contract. The renderer has no Node access; everything privileged crosses a typed IPC bridge.

```
src/shared/     Domain model, IPC channel names, console catalog, pure helpers
src/main/       Privileged: window/tray, IPC router, persistence, process launching
src/preload/    The only surface the renderer can reach (contextBridge)
src/renderer/   React interface (~7.6k lines — the bulk of the code)
```

### The IPC path

A mutation flows: renderer store → `bridge.*` (preload) → channel in `src/shared/ipc.ts` → handler in `src/main/ipc/register.ts` → repository → JSON store.

Two invariants make this work:

- **Every handler is wrapped by `handle()`**, which catches everything and returns a `Result<T>` (`{ok:true,data}` or `{ok:false,error}`). No exception crosses the boundary raw, and `src/main/errors.ts` converts technical failures (`ENOENT`, `EACCES`, spawn errors) into sentences safe to show a user. Never let a stack trace reach the UI.
- **The main process broadcasts `libraryChanged` after a mutation** and the renderer store reloads from that. Renderer mutators must *not* also call `refresh()` themselves — that was removed deliberately, and re-adding it doubles the work on every change.

Channel names live only in `src/shared/ipc.ts`. Adding a call means touching that file, `register.ts`, and `src/preload/index.ts` together.

### Persistence

`src/main/services/jsonStore.ts` is a dependency-free document store: atomic write (temp + rename), previous version kept as `.bak`, an unparseable file quarantined as `.corrupt-<timestamp>` rather than overwritten.

Each repository supplies a `migrate(raw: unknown) => T | null` that **repairs** a document rather than rejecting it — missing ids are generated, invalid enum values fall back to defaults, unknown fields are dropped. This is what lets configuration written by an older build survive an update. When the persisted shape changes, bump the schema version in `src/shared/defaults.ts` and extend the migrate function; do not assume the file on disk matches the current type.

### Updates

EmuHub checks its own GitHub releases page at startup and prompts before
downloading anything. There is deliberately **no `electron-updater`** — the
project ships no runtime dependencies, and the published releases carry neither
`latest.yml` nor a version tag (the version lives in the release *title*), which
is what `src/shared/updates.ts` parses.

The flow is owned by `UpdateController` in the main process, not the renderer:
it holds one `UpdateState`, broadcasts it on `IpcEvent.updateStateChanged`, and
the interface only renders it. That is what lets a download survive the renderer
reloading. `src/main/services/updater.ts` does the network and disk work;
`src/shared/updates.ts` holds the pure parts (version comparison, asset
matching) and must stay free of Node and DOM APIs.

Constraints worth keeping: every URL, redirects included, is checked against
`UPDATE_ALLOWED_HOSTS` before it is fetched; a download lands in a `.part` file
and is only renamed once its published SHA-256 matches; and an installer is
started only from EmuHub's own updates folder, with an argument vector and no
shell.

### Security constraints (do not regress these)

- **Emulators are launched with an argument vector, never a shell** (`spawn(path, args, { shell: false, detached: true })`). Configured paths are untrusted input: `src/main/services/executables.ts` normalises and validates before anything touches them.
- **The preload must stay CommonJS.** `sandbox: true` is set on the window, and a sandboxed preload cannot be an ES module. `electron.vite.config.ts` forces `format: 'cjs'` / `index.cjs` for that bundle only; `window.ts` loads `../preload/index.cjs`. Switching it to `.mjs` silently leaves `window.emuhub` undefined at runtime — the app loads but nothing works.
- **CSP lives in `src/renderer/index.html`.** Production keeps it strict; the `devFriendlyCsp` plugin in `electron.vite.config.ts` relaxes `script-src`/`connect-src` for the dev server only, because Vite injects an inline preamble.
- Removing a console removes an EmuHub entry only. Nothing in this codebase should ever delete or modify a user's emulator files.

## Adding a console

Two files, no UI changes:

1. An entry in `CONSOLE_CATALOG` (`src/shared/data/consoles.ts`)
2. Its illustration in `CONSOLE_GLYPHS` (`src/renderer/src/components/artwork/glyphs.tsx`), keyed by the same id

Setup, search, filters and the library pick it up automatically. A console with no illustration falls back to a generic one.

**Catalog policy:** list a platform only where an emulator actually runs commercial software today. PlayStation 5, Xbox One and Xbox Series X|S were deliberately removed — offering a console nobody can emulate leads the user to a dead end. Verify current emulator status before adding a recent platform.

## Artwork

Each console is drawn as its own hardware in a 100×100 box. Shapes are painted into an **SVG mask**, not filled directly: white is the body, grey (`RECESS`/`SHADED`) recesses a screen or slot, black cuts through to the console's gradient. One drawing therefore reads correctly on any palette in either theme — a filled detail in the same colour as the body is invisible, which is the mistake this system exists to prevent.

No manufacturer logo, console photo or other third-party image ships with EmuHub. Logos are trademarks; the app icons are generated too (`scripts/generate-icons.mjs` writes PNG and ICO by hand).

Every gradient, mask and filter is defined once in `ConsoleArtSprite`, mounted at the app root, and referenced cross-SVG by id. **It must stay mounted in both the onboarding and main branches of `App.tsx`** or every illustration renders blank.

## Renderer conventions

- **Cards, rows and picker tiles are memoised with explicit comparators** listing exactly the fields they render. `library.list()` returns fresh objects over IPC every reload, so reference equality never holds — if you add something to a card's visible output, add it to that comparator or it will not update.
- **`useConsoleActions()` returns one object with a stable identity**, and the library store's callbacks read entries through `entriesRef` rather than depending on `entries`. Adding an `entries` dependency to those callbacks breaks memoisation for every card at once.
- Routing is a local three-route hash router (`src/renderer/src/router/`), not react-router. There are no runtime dependencies at all — keep it that way unless there's a strong reason.
- Styling is plain CSS with design tokens in `styles/theme.css`. Components read `var(--…)`; never hard-code a colour. Themes and accents only swap token values.
- Avoid `backdrop-filter` on anything that repeats (cards, list rows) or persists (sidebar) — it repaints continuously. The modal scrim is the one accepted use.
