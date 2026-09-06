import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppSettings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/defaults'
import { bridge, unwrap } from '../lib/api'

export type SettingsPatch = { [K in keyof AppSettings]?: Partial<AppSettings[K]> }

interface SettingsContextValue {
  settings: AppSettings
  loading: boolean
  update: (patch: SettingsPatch) => Promise<AppSettings>
  resetDefaults: () => Promise<AppSettings>
  resetOnboarding: () => Promise<AppSettings>
  completeOnboarding: () => Promise<AppSettings>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void unwrap(bridge.settings.get())
      .then((value) => {
        if (active) setSettings(value)
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = bridge.events.onSettingsChanged((next) => setSettings(next))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const update = useCallback(async (patch: SettingsPatch) => {
    const next = await unwrap(bridge.settings.update(patch))
    setSettings(next)
    return next
  }, [])

  const resetDefaults = useCallback(async () => {
    const next = await unwrap(bridge.settings.reset())
    setSettings(next)
    return next
  }, [])

  const resetOnboarding = useCallback(async () => {
    const next = await unwrap(bridge.settings.resetOnboarding())
    setSettings(next)
    return next
  }, [])

  const completeOnboarding = useCallback(async () => {
    const next = await unwrap(bridge.settings.completeOnboarding())
    setSettings(next)
    return next
  }, [])

  const value = useMemo(
    () => ({ settings, loading, update, resetDefaults, resetOnboarding, completeOnboarding }),
    [settings, loading, update, resetDefaults, resetOnboarding, completeOnboarding]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}
