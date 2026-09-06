import path from 'node:path'
import type { AppSettings, SettingsData } from '@shared/types'
import { createDefaultSettingsData, DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from '@shared/defaults'
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

  async setOnboardingCompleted(completed: boolean): Promise<AppSettings> {
    return this.update({
      onboarding: { completed, completedAt: completed ? new Date().toISOString() : null }
    })
  }
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

  if (!['dark', 'light', 'system'].includes(settings.appearance.theme)) {
    settings.appearance.theme = DEFAULT_SETTINGS.appearance.theme
  }
  if (!['violet', 'blue', 'emerald', 'amber', 'rose', 'cyan'].includes(settings.appearance.accent)) {
    settings.appearance.accent = DEFAULT_SETTINGS.appearance.accent
  }
  if (!['compact', 'comfortable', 'large'].includes(settings.appearance.cardSize)) {
    settings.appearance.cardSize = DEFAULT_SETTINGS.appearance.cardSize
  }
  if (!['recent', 'name', 'manufacturer', 'generation', 'launches'].includes(settings.library.defaultSort)) {
    settings.library.defaultSort = DEFAULT_SETTINGS.library.defaultSort
  }

  return settings
}
