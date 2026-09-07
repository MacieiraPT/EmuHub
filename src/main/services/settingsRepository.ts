import path from 'node:path'
import type { AppSettings, BackupSettings, SettingsData } from '@shared/types'
import { createDefaultSettingsData, DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from '@shared/defaults'
import { normalizeHexColor } from '@shared/theme'
import { JsonStore } from './jsonStore'

/** A partial settings patch: any subset of any section. */
export type SettingsPatch = {
  [K in keyof AppSettings]?: Partial<AppSettings[K]>
}

/** Owns application settings, keeping unknown/legacy keys from breaking startup. */
export class SettingsRepository {
  private readonly store: JsonStore<SettingsData>

  constructor(configDirectory: string) {
    this.store = new JsonStore<SettingsData>({
      filePath: path.join(configDirectory, 'settings.json'),
      createDefault: createDefaultSettingsData,
      migrate: migrateSettings
    })
  }

  get filePath(): string {
    return this.store.filePath
  }

  load() {
    return this.store.load()
  }

  async get(): Promise<AppSettings> {
    const { schemaVersion: _schemaVersion, ...settings } = await this.store.read()
    return settings
  }

  async update(patch: SettingsPatch): Promise<AppSettings> {
    const next = await this.store.update((current) => ({
      ...current,
      general: { ...current.general, ...(patch.general ?? {}) },
      appearance: { ...current.appearance, ...(patch.appearance ?? {}) },
      library: { ...current.library, ...(patch.library ?? {}) },
      onboarding: { ...current.onboarding, ...(patch.onboarding ?? {}) }
    }))
    const { schemaVersion: _schemaVersion, ...settings } = next
    return settings
  }

  /** Restores defaults but keeps onboarding state, so setup is not repeated. */
  async resetToDefaults(): Promise<AppSettings> {
    const current = await this.store.read()
    const next = await this.store.replace({
      ...createDefaultSettingsData(),
      onboarding: current.onboarding
    })
    const { schemaVersion: _schemaVersion, ...settings } = next
    return settings
  }

  /**
   * Applies preferences from a backup. Onboarding state stays as it is, so
   * restoring on a configured machine never sends the user back through setup.
   */
  async restore(settings: BackupSettings): Promise<AppSettings> {
    return this.update({
      general: settings.general,
      appearance: settings.appearance,
      library: settings.library
    })
  }

  async setOnboardingCompleted(completed: boolean): Promise<AppSettings> {
    return this.update({
      onboarding: { completed, completedAt: completed ? new Date().toISOString() : null }
    })
  }
}

/**
 * Reads the preferences section of a backup. Every value is validated by the
 * same migration the store uses, so a hand-edited or older file can only ever
 * produce settings this build understands.
 */
export function normalizeBackupSettings(raw: unknown): BackupSettings | null {
  const settings = migrateSettings(raw)
  if (!settings) return null
  const { schemaVersion: _schemaVersion, onboarding: _onboarding, ...rest } = settings
  return rest
}

function migrateSettings(raw: unknown): SettingsData | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>

  const merge = <T extends object>(defaults: T, value: unknown): T => {
    if (!value || typeof value !== 'object') return { ...defaults }
    const result = { ...defaults } as Record<string, unknown>
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const candidate = (value as Record<string, unknown>)[key]
      if (candidate !== undefined && typeof candidate === typeof defaultValue) {
        result[key] = candidate
      }
    }
    return result as T
  }

  const settings: SettingsData = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    general: merge(DEFAULT_SETTINGS.general, source.general),
    appearance: merge(DEFAULT_SETTINGS.appearance, source.appearance),
    library: merge(DEFAULT_SETTINGS.library, source.library),
    onboarding: merge(DEFAULT_SETTINGS.onboarding, source.onboarding)
  }

  if (!['oled', 'dark', 'light', 'system'].includes(settings.appearance.theme)) {
    settings.appearance.theme = DEFAULT_SETTINGS.appearance.theme
  }
  if (
    !['violet', 'blue', 'emerald', 'amber', 'rose', 'cyan', 'custom'].includes(
      settings.appearance.accent
    )
  ) {
    settings.appearance.accent = DEFAULT_SETTINGS.appearance.accent
  }
  // A custom accent is written straight into a CSS variable, so only a colour
  // this build can parse is ever kept.
  settings.appearance.customAccent =
    normalizeHexColor(settings.appearance.customAccent) ?? DEFAULT_SETTINGS.appearance.customAccent
  if (!['compact', 'comfortable', 'large'].includes(settings.appearance.cardSize)) {
    settings.appearance.cardSize = DEFAULT_SETTINGS.appearance.cardSize
  }
  if (!['recent', 'name', 'manufacturer', 'generation', 'launches'].includes(settings.library.defaultSort)) {
    settings.library.defaultSort = DEFAULT_SETTINGS.library.defaultSort
  }

  return settings
}
