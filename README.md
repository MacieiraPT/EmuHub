# EmuHub

A modern desktop launcher that brings every console emulator installed on your PC
into one library.

EmuHub does not download, bundle or distribute emulators or games. It stores the
location of programs you already have and starts them for you.

![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## What it does

- **Guided first-run setup** — pick your platforms from a searchable catalog of
  55 consoles, then point EmuHub at each emulator you already have. Consoles can
  be skipped and configured later.
- **Only platforms you can actually emulate** — the catalog lists a console only
  where an emulator runs commercial software today. Machines with no working
  emulator (PlayStation 5, Xbox One, Xbox Series X|S) are left out rather than
  leading you to a dead end.
- **A visual library** — every configured console appears as a card with its own
  hardware illustration, its emulator, its status and a launch button.
- **One-click launching** — emulators start through the operating system's own
  process API, never a shell.
- **Graceful recovery** — if an emulator is moved or uninstalled, EmuHub says so
  in plain language and offers to locate it again.
- **Persistent configuration** — everything is stored in a versioned JSON
  document written atomically, with an automatic backup and corruption recovery.

## Getting started

```bash
npm install     # installs dependencies and the Electron runtime
npm run dev     # start with hot reload
npm run build   # type-check and produce the production bundles
npm start       # preview the production build
```

To produce an installer:

```bash
npm run dist:win     # NSIS installer (x64 + arm64)
npm run dist:linux   # AppImage and .deb
npm run dist:mac     # dmg
```

Application icons are generated, not vendored — `npm run icons` redraws
`resources/` from `scripts/generate-icons.mjs`.

## Architecture

EmuHub is an Electron application with three isolated layers. The renderer has
no Node access; every privileged action crosses a typed IPC bridge.

```
src/
├── shared/                  Domain model shared by all three processes
│   ├── types.ts             Strongly typed domain and IPC contracts
│   ├── ipc.ts               Channel names — the single source of truth
│   ├── defaults.ts          Default settings and schema versions
│   ├── library.ts           Pure helpers: sorting, search, name derivation
│   └── data/consoles.ts     The console catalog
│
├── main/                    Privileged process
│   ├── index.ts             Lifecycle, single-instance lock, wiring
│   ├── window.ts            Window creation and geometry persistence
│   ├── tray.ts, menu.ts     Optional tray icon, macOS menu
│   ├── errors.ts            Technical failures → human-readable messages
│   ├── ipc/register.ts      The complete IPC surface
│   └── services/
│       ├── jsonStore.ts     Atomic writes, backups, corruption recovery
│       ├── libraryRepository.ts    Console library + schema migration
│       ├── settingsRepository.ts   Settings + validation
│       ├── executables.ts   Path validation and inspection
│       ├── launcher.ts      Detached process launching
│       └── autoLaunch.ts    Start-with-system support
│
├── preload/index.ts         The only bridge the interface can reach
│
└── renderer/src/            The interface
    ├── components/          Reusable UI: buttons, dialogs, menus, cards…
    │   └── artwork/         One hardware illustration per console
    ├── features/            Onboarding, home, consoles, detail, settings
    ├── router/              A four-route hash router
    ├── state/               Library, settings and notification stores
    ├── hooks/, lib/         Appearance, shortcuts, formatting, API helpers
    └── styles/              Design tokens, base styles, component styles
```

### Adding a console

Append one entry to `CONSOLE_CATALOG` in `src/shared/data/consoles.ts` and its
illustration to `CONSOLE_GLYPHS` in
`src/renderer/src/components/artwork/glyphs.tsx`. Setup, search, filters and the
library pick it up with no other changes; a console with no illustration yet
falls back to a generic one.

```ts
{
  id: 'nintendo-64',
  name: 'Nintendo 64',
  shortName: 'N64',
  manufacturer: 'Nintendo',
  generation: 5,
  releaseYear: 1996,
  formFactor: 'home',
  media: 'cartridge',
  artwork: { from: '#2f6d3f', to: '#57b45f', ink: '#f2fff4' },
  aliases: ['n64', 'ultra 64'],
  knownEmulators: ['Project64', 'Mupen64Plus']
}
```

### Artwork

Each console is drawn as its own machine — the NES front-loading deck, the
GameCube's carry handle, the PS2 tower, the Game Boy's offset screen — as an
original vector illustration in a 100 x 100 box. Shapes are painted into an SVG
mask rather than filled: white is the body, grey recesses a screen or slot,
black cuts through to the console's gradient. One drawing therefore reads
correctly on every palette, in light and dark themes alike.

No manufacturer logo, console photograph or other third-party image ships with
EmuHub. Logos are trademarks, and reproducing them inside a distributed binary
is a risk the artwork does not need to take. The application icons are drawn the
same way, by `scripts/generate-icons.mjs`.

Every definition lives in one hidden SVG mounted once at the application root,
so a library of cards and a picker of fifty-five tiles share a single set of
gradients, masks and filters instead of each instance building its own.

### Room to grow

The stored model already carries the fields later features need: several
emulator profiles per console with a selected default, per-emulator command line
arguments and working directory, launch counts and timestamps, a favourite flag,
and a free-form `metadata` object on every console. Game libraries, ROM
scanning, controller profiles and per-game settings can be layered on without
reshaping what is stored today.

## Data and safety

- Configuration lives in the platform's standard per-user application data
  folder (`%APPDATA%/EmuHub` on Windows) as `library.json` and `settings.json`.
  Settings → About → *Open configuration folder* reveals it.
- Writes go to a temporary file and are renamed into place, so an interrupted
  save cannot truncate your configuration. The previous version is kept as
  `.bak`, and a file that cannot be parsed is preserved as `.corrupt-<date>`
  rather than being overwritten.
- Documents are versioned and repaired on read, so configuration written by an
  older build keeps working after an update.
- **Removing a console removes an EmuHub entry only.** No emulator is ever
  uninstalled, modified or deleted.
- Configured paths are treated as untrusted input: they are normalised and
  checked before use, and emulators are started with an argument vector rather
  than a shell command, so nothing in a stored path can be interpreted as a
  command. EmuHub requests no elevated privileges and scans no part of your
  file system on its own.

## Performance

EmuHub is meant to stay out of the way. With all 55 consoles configured, on a
containerised Linux test machine:

| | |
| --- | --- |
| Launch to a painted library | 0.7–0.9 s |
| Renderer JS heap | ~9.5 MB |
| DOM nodes (full library) | ~2,500 |
| Main-process CPU over 3 s idle | ~3 ms |
| Renderer bundle | 312 kB (90 kB gzipped) |

What keeps it there:

- **Nothing runs at idle.** No polling timers, no watchers, no background
  scanning. The app only touches the file system when you ask it to.
- **The emulator health check is debounced** and runs on a trailing edge, on
  window focus and after a launch failure — not once per console per change.
- **Batched writes.** Adding consoles during setup is a single call, a single
  file write and a single change notification, however many you picked.
- **Memoised cards and tiles** compare exactly what they render, so a launch or
  a health sweep does not re-render an entire library of SVG illustrations.
- **`content-visibility`** lets off-screen cards, rows and tiles skip layout,
  paint and rasterisation entirely.
- **No per-frame blur.** Backdrop filters are limited to the modal scrim, where
  one exists briefly, instead of sitting behind every card badge and the
  sidebar.
- **A four-route hash router** in place of a general-purpose routing library,
  which cost about a tenth of the bundle for a window with no URL bar.

## Keyboard

| Shortcut | Action |
| --- | --- |
| `Ctrl`/`Cmd` + `F` | Focus search |
| `Ctrl`/`Cmd` + `,` | Open Settings |
| `Esc` | Close a dialog or clear the search field |
| `Tab` / `Shift`+`Tab` | Move through controls in reading order |
| `Enter` / `Space` | Activate the focused control |

## Licence

MIT. EmuHub is a launcher: it ships no emulator binaries and no game content.
