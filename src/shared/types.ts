/**
 * Domain model shared by the main process, the preload bridge and the renderer.
 * Everything that crosses the IPC boundary is described here.
 */

/* ------------------------------------------------------------------ */
/* Console catalog                                                     */
/* ------------------------------------------------------------------ */

export type ConsoleFormFactor = 'home' | 'handheld' | 'hybrid' | 'computer' | 'arcade'
export type ConsoleMedia = 'cartridge' | 'disc' | 'card' | 'tape' | 'digital' | 'mixed'

/** Visual identity used to render generated (non-copyrighted) console artwork. */
export interface ConsoleArtwork {
  /** Gradient start colour. */
  from: string
  /** Gradient end colour. */
  to: string
  /** Foreground colour used for the generated glyph. */
  ink: string
  /** Glyph shape family drawn by the artwork component. */
  glyph: ConsoleGlyph
}

export type ConsoleGlyph =
  | 'cartridge'
  | 'disc'
  | 'handheld'
  | 'dual-screen'
  | 'gamepad'
  | 'tower'
  | 'keyboard'
  | 'arcade'
  | 'card'

/** A console the application knows about. Pure metadata, never user state. */
export interface ConsoleDefinition {
  id: string
  name: string
  shortName: string
  manufacturer: string
  /** Hardware generation (1-9). `null` for platforms where it does not apply. */
  generation: number | null
  releaseYear: number
  formFactor: ConsoleFormFactor
  media: ConsoleMedia
  artwork: ConsoleArtwork
  /** Extra search terms: regional names, abbreviations, nicknames. */
  aliases: string[]
  /**
   * Emulators commonly used for this platform. Used only to recognise a
   * chosen executable and to hint at what to look for. EmuHub never
   * downloads, bundles or installs any of them.
   */
  knownEmulators: string[]
}

/* ------------------------------------------------------------------ */
/* User configuration                                                  */
/* ------------------------------------------------------------------ */

/** A single emulator entry. A console may hold several (future ready). */
export interface EmulatorProfile {
  id: string
  /** Display name, derived from the executable unless the user renames it. */
  name: string
  executablePath: string
  /** Extra command line arguments passed to the emulator on launch. */
  args: string[]
  /** Working directory override; defaults to the executable's folder. */
  workingDirectory: string | null
  addedAt: string
  updatedAt: string
}

/** A console the user has added to their library. */
export interface ConfiguredConsole {
  /** Stable identifier of this library entry. */
  id: string
  /** Reference into the console catalog. */
  consoleId: string
  /** Overridable label; falls back to the catalog name. */
  displayName: string | null
  emulators: EmulatorProfile[]
  /** Which emulator the Launch button uses. */
  activeEmulatorId: string | null
  addedAt: string
  updatedAt: string
  lastLaunchedAt: string | null
  launchCount: number
  favorite: boolean
  /** Free-form slot reserved for future features (ROM folders, art, notes...). */
  metadata: Record<string, unknown>
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export type ThemePreference = 'dark' | 'light' | 'system'
export type AccentColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan'
export type CardSize = 'compact' | 'comfortable' | 'large'
export type LibrarySort = 'recent' | 'name' | 'manufacturer' | 'generation' | 'launches'

export interface GeneralSettings {
  launchOnStartup: boolean
  minimizeToTray: boolean
  closeToTray: boolean
  startMinimized: boolean
  confirmBeforeRemoving: boolean
}

export interface AppearanceSettings {
  theme: ThemePreference
  accent: AccentColor
  cardSize: CardSize
  reduceMotion: boolean
}

export interface LibrarySettings {
  defaultSort: LibrarySort
  showMissingWarnings: boolean
}

export interface OnboardingState {
  completed: boolean
  completedAt: string | null
}

export interface AppSettings {
  general: GeneralSettings
  appearance: AppearanceSettings
  library: LibrarySettings
  onboarding: OnboardingState
}

/* ------------------------------------------------------------------ */
/* Persistence envelopes                                               */
/* ------------------------------------------------------------------ */

export interface LibraryData {
  schemaVersion: number
  consoles: ConfiguredConsole[]
}

export interface SettingsData extends AppSettings {
  schemaVersion: number
}

/* ------------------------------------------------------------------ */
/* IPC payloads and results                                            */
/* ------------------------------------------------------------------ */

/** Every fallible main-process call answers with this envelope. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError }

export type AppErrorCode =
  | 'not-found'
  | 'invalid-path'
  | 'not-executable'
  | 'permission-denied'
  | 'launch-failed'
  | 'cancelled'
  | 'storage-failed'
  | 'duplicate'
  | 'unknown'

export interface AppError {
  code: AppErrorCode
  /** Human readable, safe to show directly in the UI. */
  message: string
  /** Optional short suggestion of what the user can do next. */
  hint?: string
}

export interface ExecutableInfo {
  path: string
  fileName: string
  /** Name without extension, cleaned up for display. */
  suggestedName: string
  directory: string
  sizeBytes: number
  /** True when the file looks launchable on the current platform. */
  executable: boolean
}

export interface AddConsoleInput {
  consoleId: string
  executablePath?: string | null
  emulatorName?: string | null
  displayName?: string | null
}

export interface UpdateConsoleInput {
  id: string
  displayName?: string | null
  favorite?: boolean
  metadata?: Record<string, unknown>
}

export interface SetEmulatorInput {
  consoleEntryId: string
  executablePath: string
  emulatorName?: string | null
  args?: string[]
}

export interface LaunchResult {
  consoleEntryId: string
  emulatorName: string
  pid: number | null
}

/** Reported once at startup when stored data could not be read cleanly. */
export interface StorageHealth {
  libraryRecovered: boolean
  settingsRecovered: boolean
  /** Path of the backup written when a corrupt file was replaced. */
  backupPath: string | null
}

export interface AppInfo {
  version: string
  electronVersion: string
  platform: NodeJS.Platform
  configDirectory: string
  isPackaged: boolean
}

export type WindowState = {
  maximized: boolean
  focused: boolean
  fullScreen: boolean
}
