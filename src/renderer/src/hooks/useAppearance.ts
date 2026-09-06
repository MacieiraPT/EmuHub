import { useEffect, useState } from 'react'
import type { AppearanceSettings } from '@shared/types'
import { bridge } from '../lib/api'

/**
 * Applies the appearance settings to the document root. Themes are plain data
 * attributes, so every component reacts through CSS variables alone.
 */
export function useAppearance(appearance: AppearanceSettings): void {
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  )

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent): void => setSystemDark(event.matches)
    media?.addEventListener('change', onChange)
    const unsubscribe = bridge.events.onSystemTheme((dark) => setSystemDark(dark))
    return () => {
      media?.removeEventListener('change', onChange)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const resolved = appearance.theme === 'system' ? (systemDark ? 'dark' : 'light') : appearance.theme
    root.dataset['theme'] = resolved
    root.dataset['accent'] = appearance.accent
    root.dataset['cardSize'] = appearance.cardSize
    root.dataset['reduceMotion'] = String(appearance.reduceMotion)
  }, [appearance, systemDark])
}
