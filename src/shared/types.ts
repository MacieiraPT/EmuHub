/**
 * Domain model shared by the main process, the preload bridge and the renderer.
 * Everything that crosses the IPC boundary is described here.
 */

/* ------------------------------------------------------------------ */
/* Console catalog                                                     */
/* ------------------------------------------------------------------ */

export type ConsoleFormFactor = 'home' | 'handheld' | 'hybrid' | 'computer' | 'arcade'
export type ConsoleMedia = 'cartridge' | 'disc' | 'card' | 'tape' | 'digital' | 'mixed'

/**
 * Palette for a console's generated artwork. The illustration itself lives in
 * `renderer/components/artwork/glyphs.tsx`, keyed by console id.
 */
export interface ConsoleArtwork {
  /** Gradient start colour. */
  from: string
  /** Gradient end colour. */
  to: string
  /** Foreground colour the console's illustration is drawn in. */
  ink: string
}

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
  /** Look for a newer EmuHub each time the application starts. */
  checkForUpdates: boolean
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
/* Backup and restore                                                  */
/* ------------------------------------------------------------------ */

/** The preferences a backup carries. Onboarding state is deliberately left out. */
export type BackupSettings = Omit<AppSettings, 'onboarding'>

/**
 * The document written to the file the user picks. Self-describing so a file
 * that is not an EmuHub backup can be refused before anything is overwritten.
 */
export interface BackupDocument {
  format: string
  formatVersion: number
  exportedAt: string
  appVersion: string
  library: LibraryData
  /** Null when the backup was written without preferences. */
  settings: BackupSettings | null
}

/** How an imported backup is applied to the existing library. */
export type BackupImportMode = 'replace' | 'merge'

export interface BackupExportResult {
  filePath: string
  consoleCount: number
}

export interface BackupImportResult {
  filePath: string
  mode: BackupImportMode
  /** Consoles actually written into the library. */
  imported: number
  /** Consoles already in the library, left as they were (merge only). */
  skippedDuplicates: number
  /** Consoles in the backup this build no longer has a catalog entry for. */
  skippedUnknown: number
  settingsRestored: boolean
}

/* ------------------------------------------------------------------ */
/* Updates                                                             */
/* ------------------------------------------------------------------ */

/**
 * Where the update flow currently stands. The main process owns this state so
 * a check or a download survives the interface reloading, and broadcasts it
 * whenever it moves.
 */
export type UpdateStage =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'

/** The file of a release that belongs to this machine. */
export interface UpdateAsset {
  name: string
  sizeBytes: number
  /** True when EmuHub can start this file itself to install the update. */
  installable: boolean
}

export interface UpdateRelease {
  /** Normalised version, e.g. `1.0.1`. */
  version: string
  /** The release title as published. */
  name: string
  /** Release notes as written, plain text — never rendered as markup. */
  notes: string
  releaseUrl: string
  publishedAt: string | null
  /** Null when the release carries nothing for this platform. */
  asset: UpdateAsset | null
}

export interface UpdateProgress {
  receivedBytes: number
  /** Null while the server has not said how large the download is. */
  totalBytes: number | null
  /** 0-100, or null while the total is unknown. */
  percent: number | null
}

export interface UpdateDownload {
  filePath: string
  installable: boolean
}

export interface UpdateState {
  stage: UpdateStage
  /** The version running right now. */
  currentVersion: string
  /** The newer release, once one has been found. */
  release: UpdateRelease | null
  progress: UpdateProgress | null
  download: UpdateDownload | null
  /** Why the last check or download failed, in words safe to show. */
  error: AppError | null
  checkedAt: string | null
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
  | 'network'
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

export interface BulkAddResult {
  added: ConfiguredConsole[]
  /** Consoles that could not be added, each with a message safe to display. */
  rejected: { consoleId: string; reason: string }[]
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
