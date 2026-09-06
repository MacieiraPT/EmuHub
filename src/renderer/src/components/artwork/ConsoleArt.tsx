import type { ConsoleDefinition } from '@shared/types'
import { CONSOLE_CATALOG } from '@shared/data/consoles'
import { CONSOLE_GLYPHS, FALLBACK_GLYPH } from './glyphs'

const FALLBACK_ARTWORK = { from: '#3a3f4c', to: '#5b6272', ink: '#f2f4f8' }

// Thumbnails zoom in harder: at 56px the drawing has to carry the tile.
const GLYPH_SCALE = { thumb: 1.5, card: 1.28, hero: 1.5 } as const

export type ConsoleArtVariant = keyof typeof GLYPH_SCALE

/**
 * One hidden SVG holding every gradient, mask and filter the artwork needs.
 *
 * Mounted once at the application root, so a library of cards and a picker of
 * fifty-five tiles share a single set of definitions instead of each instance
 * building its own. Individual artworks then cost four rectangles apiece.
 */
export function ConsoleArtSprite() {
  return (
    <svg className="console-art-sprite" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="emuhub-art-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#ffffff" fillOpacity="0.07" />
        </pattern>
        <radialGradient id="emuhub-art-glow" cx="0.24" cy="0.1" r="0.92">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emuhub-art-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05060a" stopOpacity="0" />
          <stop offset="100%" stopColor="#05060a" stopOpacity="0.34" />
        </linearGradient>
        <filter id="emuhub-art-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="2" floodColor="#05060a" floodOpacity="0.34" />
        </filter>

        <linearGradient id="emuhub-art-bg-fallback" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={FALLBACK_ARTWORK.from} />
          <stop offset="100%" stopColor={FALLBACK_ARTWORK.to} />
        </linearGradient>
        <mask id="emuhub-art-glyph-fallback" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          {FALLBACK_GLYPH}
        </mask>

        {CONSOLE_CATALOG.map((console) => (
          <linearGradient key={console.id} id={`emuhub-art-bg-${console.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={console.artwork.from} />
            <stop offset="100%" stopColor={console.artwork.to} />
          </linearGradient>
        ))}
        {CONSOLE_CATALOG.map((console) => (
          <mask
            key={console.id}
            id={`emuhub-art-glyph-${console.id}`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100"
            height="100"
          >
            {CONSOLE_GLYPHS[console.id] ?? FALLBACK_GLYPH}
          </mask>
        ))}
      </defs>
    </svg>
  )
}

interface ConsoleArtProps {
  definition: ConsoleDefinition | undefined
  className?: string
  variant?: ConsoleArtVariant
}

/**
 * Artwork for one console: its palette as a gradient, its hardware drawn on
 * top. EmuHub ships no console photography or manufacturer logos — every
 * illustration in `glyphs.tsx` is drawn from scratch.
 */
export function ConsoleArt({ definition, className = '', variant = 'card' }: ConsoleArtProps) {
  const key = definition && CONSOLE_GLYPHS[definition.id] ? definition.id : 'fallback'
  const ink = definition?.artwork.ink ?? FALLBACK_ARTWORK.ink
  const scale = GLYPH_SCALE[variant]
  // Centre the 100 x 100 drawing inside the 320 x 200 artwork.
  const originX = 160 - 50 * scale
  const originY = 100 - 50 * scale

  return (
    <svg
      className={`console-art ${className}`.trim()}
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={definition ? `${definition.name} artwork` : 'Console artwork'}
    >
      <rect width="320" height="200" fill={`url(#emuhub-art-bg-${key})`} />
      <rect width="320" height="200" fill="url(#emuhub-art-dots)" />
      <rect width="320" height="200" fill="url(#emuhub-art-glow)" />
      <g
        transform={`translate(${originX} ${originY}) scale(${scale})`}
        /* The drop shadow is skipped at thumbnail size: dozens are on screen at
           once in the picker, and the softening is invisible at 56px anyway. */
        filter={variant === 'thumb' ? undefined : 'url(#emuhub-art-shadow)'}
      >
        <rect width="100" height="100" fill={ink} fillOpacity="0.95" mask={`url(#emuhub-art-glyph-${key})`} />
      </g>
      <rect width="320" height="200" fill="url(#emuhub-art-fade)" />
    </svg>
  )
}
