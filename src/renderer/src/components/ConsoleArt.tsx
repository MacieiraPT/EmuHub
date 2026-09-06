import { useId, type ReactElement } from 'react'
import type { ConsoleDefinition, ConsoleGlyph } from '@shared/types'

interface ConsoleArtProps {
  definition: ConsoleDefinition | undefined
  className?: string
  /** Larger variants draw a bigger glyph. */
  variant?: 'thumb' | 'card' | 'hero'
}

const FALLBACK: ConsoleDefinition['artwork'] = {
  from: '#3a3f4c',
  to: '#5b6272',
  ink: '#f2f4f8',
  glyph: 'gamepad'
}

const GLYPH_SCALE: Record<NonNullable<ConsoleArtProps['variant']>, number> = {
  thumb: 0.92,
  card: 1.26,
  hero: 1.48
}

/**
 * Console artwork generated from the catalog palette.
 *
 * Each platform gets a recognisable, original illustration built at run time —
 * EmuHub ships no console photography, logos or other third-party imagery.
 *
 * The glyph is painted as a single shape in the console's ink colour and its
 * details are cut out through a mask, so the background gradient shows through
 * and the artwork reads at every size, whatever the palette.
 */
export function ConsoleArt({ definition, className = '', variant = 'card' }: ConsoleArtProps) {
  const id = useId().replace(/:/g, '')
  const art = definition?.artwork ?? FALLBACK
  const scale = GLYPH_SCALE[variant]
  // Centre the 100 x 100 glyph box inside the 320 x 200 artwork.
  const originX = 160 - 50 * scale
  const originY = 100 - 50 * scale
  const glyph = GLYPHS[art.glyph] ?? GLYPHS.gamepad

  return (
    <svg
      className={`console-art ${className}`.trim()}
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={definition ? `${definition.name} artwork` : 'Console artwork'}
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={art.from} />
          <stop offset="100%" stopColor={art.to} />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="0.24" cy="0.1" r="0.92">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <pattern id={`dots-${id}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#ffffff" fillOpacity="0.07" />
        </pattern>
        <linearGradient id={`fade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05060a" stopOpacity="0" />
          <stop offset="100%" stopColor="#05060a" stopOpacity="0.34" />
        </linearGradient>
        <mask id={`glyph-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          {glyph}
        </mask>
        <filter id={`shadow-${id}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="2" floodColor="#05060a" floodOpacity="0.34" />
        </filter>
      </defs>

      <rect width="320" height="200" fill={`url(#bg-${id})`} />
      <rect width="320" height="200" fill={`url(#dots-${id})`} />
      <rect width="320" height="200" fill={`url(#glow-${id})`} />

      <g transform={`translate(${originX} ${originY}) scale(${scale})`} filter={`url(#shadow-${id})`}>
        <rect x="0" y="0" width="100" height="100" fill={art.ink} fillOpacity="0.95" mask={`url(#glyph-${id})`} />
      </g>

      <rect width="320" height="200" fill={`url(#fade-${id})`} />
    </svg>
  )
}

/*
 * Mask artwork. White paints the console shape, black punches a hole straight
 * through to the gradient and mid greys leave a translucent recess — which is
 * how screens, labels and buttons stay readable on light and dark palettes
 * alike.
 */
const SOLID = '#ffffff'
const HOLE = '#000000'
const RECESS = '#4a4a4a'
const SHADED = '#9a9a9a'

const GLYPHS: Record<ConsoleGlyph, ReactElement> = {
  cartridge: (
    <g>
      <rect x="22" y="10" width="56" height="70" rx="6" fill={SOLID} />
      <rect x="32" y="76" width="36" height="14" rx="3" fill={SOLID} />
      <rect x="30" y="18" width="40" height="26" rx="3" fill={RECESS} />
      <rect x="30" y="51" width="40" height="4" rx="2" fill={SHADED} />
      <rect x="30" y="59" width="40" height="4" rx="2" fill={SHADED} />
      <rect x="30" y="67" width="27" height="4" rx="2" fill={SHADED} />
      <rect x="37" y="81" width="4" height="9" fill={HOLE} />
      <rect x="48" y="81" width="4" height="9" fill={HOLE} />
      <rect x="59" y="81" width="4" height="9" fill={HOLE} />
    </g>
  ),
  disc: (
    <g>
      <circle cx="50" cy="50" r="44" fill={SOLID} />
      <circle cx="50" cy="50" r="13" fill={HOLE} />
      <circle cx="50" cy="50" r="20" fill={RECESS} />
      <path
        d="M50 12a38 38 0 0 0-26.9 11.1l5 5A31 31 0 0 1 50 19z"
        fill={SHADED}
      />
      <circle cx="50" cy="50" r="30" fill="none" stroke={SHADED} strokeWidth="1.4" />
    </g>
  ),
  handheld: (
    <g>
      <rect x="26" y="6" width="48" height="88" rx="10" fill={SOLID} />
      <rect x="33" y="13" width="34" height="32" rx="3" fill={RECESS} />
      <rect x="36" y="16" width="12" height="6" rx="2" fill={SHADED} />
      <rect x="38.5" y="57" width="6" height="18" rx="2.6" fill={HOLE} />
      <rect x="32.5" y="63" width="18" height="6" rx="2.6" fill={HOLE} />
      <circle cx="60" cy="60" r="4.4" fill={HOLE} />
      <circle cx="66" cy="69" r="4.4" fill={HOLE} />
      <rect x="40" y="84" width="20" height="4" rx="2" fill={RECESS} />
    </g>
  ),
  'dual-screen': (
    <g>
      <rect x="16" y="6" width="68" height="40" rx="6" fill={SOLID} />
      <rect x="24" y="12" width="52" height="28" rx="3" fill={RECESS} />
      <rect x="16" y="49" width="68" height="6" rx="3" fill={SHADED} />
      <rect x="16" y="56" width="68" height="40" rx="6" fill={SOLID} />
      <rect x="24" y="62" width="42" height="28" rx="3" fill={RECESS} />
      <circle cx="75" cy="70" r="3.4" fill={HOLE} />
      <circle cx="75" cy="82" r="3.4" fill={HOLE} />
    </g>
  ),
  gamepad: (
    <g>
      <circle cx="22" cy="66" r="18" fill={SOLID} />
      <circle cx="78" cy="66" r="18" fill={SOLID} />
      <rect x="10" y="28" width="80" height="38" rx="17" fill={SOLID} />
      <rect x="27" y="38" width="6" height="20" rx="2.8" fill={HOLE} />
      <rect x="20" y="45" width="20" height="6" rx="2.8" fill={HOLE} />
      <circle cx="70" cy="42" r="5" fill={HOLE} />
      <circle cx="79" cy="52" r="5" fill={HOLE} />
      <rect x="44" y="41" width="12" height="6" rx="3" fill={RECESS} />
    </g>
  ),
  tower: (
    <g>
      <rect x="30" y="4" width="40" height="92" rx="7" fill={SOLID} />
      <rect x="37" y="13" width="12" height="52" rx="6" fill={RECESS} />
      <rect x="54" y="13" width="5" height="34" rx="2.5" fill={HOLE} />
      <rect x="61" y="13" width="5" height="34" rx="2.5" fill={HOLE} />
      <rect x="54" y="53" width="12" height="5" rx="2.5" fill={HOLE} />
      <circle cx="50" cy="82" r="4.4" fill={HOLE} />
    </g>
  ),
  keyboard: (
    <g>
      <rect x="12" y="10" width="76" height="50" rx="6" fill={SOLID} />
      <rect x="19" y="17" width="62" height="36" rx="3" fill={RECESS} />
      <rect x="25" y="23" width="26" height="4" rx="2" fill={SHADED} />
      <rect x="25" y="31" width="38" height="4" rx="2" fill={SHADED} />
      <rect x="42" y="60" width="16" height="8" fill={SOLID} />
      <rect x="6" y="70" width="88" height="26" rx="5" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="13" y="76" width="10" height="5" rx="1.6" />
        <rect x="27" y="76" width="10" height="5" rx="1.6" />
        <rect x="41" y="76" width="10" height="5" rx="1.6" />
        <rect x="55" y="76" width="10" height="5" rx="1.6" />
        <rect x="69" y="76" width="18" height="5" rx="1.6" />
        <rect x="24" y="85" width="52" height="5" rx="2.5" />
      </g>
    </g>
  ),
  arcade: (
    <g>
      <path d="M20 14a8 8 0 0 1 8-8h44a8 8 0 0 1 8 8v78a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill={SOLID} />
      <rect x="28" y="16" width="44" height="32" rx="4" fill={RECESS} />
      <rect x="34" y="22" width="18" height="5" rx="2.5" fill={SHADED} />
      <rect x="26" y="56" width="48" height="16" rx="4" fill={SHADED} />
      <circle cx="38" cy="64" r="4.4" fill={HOLE} />
      <circle cx="54" cy="62" r="3.2" fill={HOLE} />
      <circle cx="64" cy="66" r="3.2" fill={HOLE} />
      <rect x="30" y="80" width="40" height="10" rx="3" fill={RECESS} />
    </g>
  ),
  card: (
    <g>
      <path d="M24 12a5 5 0 0 1 5-5h30l17 17v64a5 5 0 0 1-5 5H29a5 5 0 0 1-5-5z" fill={SOLID} />
      <path d="M59 7v12a5 5 0 0 0 5 5h12z" fill={RECESS} />
      <rect x="33" y="34" width="34" height="20" rx="3" fill={RECESS} />
      <g fill={HOLE}>
        <rect x="37" y="38" width="4" height="12" />
        <rect x="44" y="38" width="4" height="12" />
        <rect x="51" y="38" width="4" height="12" />
        <rect x="58" y="38" width="4" height="12" />
      </g>
      <rect x="33" y="63" width="34" height="4.5" rx="2.25" fill={SHADED} />
      <rect x="33" y="72" width="24" height="4.5" rx="2.25" fill={SHADED} />
    </g>
  )
}
