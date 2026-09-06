import type { AppSettings, LibraryData, SettingsData } from './types'

/** Bump when the persisted shape changes; migrations live in the store. */
export const LIBRARY_SCHEMA_VERSION = 1
export const SETTINGS_SCHEMA_VERSION = 1

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    launchOnStartup: false,
    minimizeToTray: false,
    closeToTray: false,
    startMinimized: false,
    confirmBeforeRemoving: true
  },
  appearance: {
    theme: 'dark',
    accent: 'violet',
    cardSize: 'comfortable',
    reduceMotion: false
  },
  library: {
    defaultSort: 'recent',
    showMissingWarnings: true
  },
  onboarding: {
    completed: false,
    completedAt: null
  }
}

export function createDefaultSettingsData(): SettingsData {
  return { schemaVersion: SETTINGS_SCHEMA_VERSION, ...structuredClone(DEFAULT_SETTINGS) }
}

export function createDefaultLibraryData(): LibraryData {
  return { schemaVersion: LIBRARY_SCHEMA_VERSION, consoles: [] }
}
