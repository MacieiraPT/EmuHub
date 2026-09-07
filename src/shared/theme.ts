/*
 * Theme and accent helpers shared by both processes.
 *
 * The palette is expressed as a hue/saturation pair because every accent token
 * in `theme.css` derives its lightness from the active theme — that is what
 * keeps a custom colour readable on the light theme and on black alike. These
 * helpers are pure: no Node and no DOM APIs, so `src/shared` stays compilable
 * by both tsconfig projects.
 */

import type { ThemePreference } from './types'

/** Hue (0–360) and saturation (0–100) — the two values a theme needs. */
export interface AccentTone {
  hue: number
  saturation: number
}

/** The colour a fresh install uses for a custom accent before one is picked. */
export const DEFAULT_CUSTOM_ACCENT = '#8b6dff'

/**
 * Accepts `#rgb`, `#rrggbb` and the same without the hash, and returns the
 * canonical `#rrggbb` form. Anything else — including a CSS colour name — is
 * rejected, so only a value this app can parse is ever persisted.
 */
export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$/.test(raw) && !/^[0-9a-fA-F]{6}$/.test(raw)) return null
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => char + char)
          .join('')
      : raw
  return `#${full.toLowerCase()}`
}

/** Splits a validated `#rrggbb` string into 0–255 channels. */
function channels(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ]
}

/**
 * Hue and saturation of a hex colour. Lightness is deliberately dropped: the
 * theme supplies it. A grey has no meaningful hue, so its saturation comes back
 * as 0 and the interface simply renders a neutral accent.
 */
export function accentToneOf(hex: string): AccentTone | null {
  const normalized = normalizeHexColor(hex)
  if (!normalized) return null

  const [red, green, blue] = channels(normalized).map((channel) => channel / 255) as [
    number,
    number,
    number
  ]
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) return { hue: 0, saturation: 0 }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))

  let hue: number
  if (max === red) hue = ((green - blue) / delta) % 6
  else if (max === green) hue = (blue - red) / delta + 2
  else hue = (red - green) / delta + 4

  hue *= 60
  if (hue < 0) hue += 360

  return { hue: Math.round(hue), saturation: Math.round(saturation * 100) }
}

/**
 * The value Electron's `nativeTheme.themeSource` understands. OLED is a dark
 * theme as far as the OS is concerned — only EmuHub's own surfaces go black.
 */
export function nativeThemeSourceOf(theme: ThemePreference): 'system' | 'light' | 'dark' {
  if (theme === 'system') return 'system'
  return theme === 'light' ? 'light' : 'dark'
}
