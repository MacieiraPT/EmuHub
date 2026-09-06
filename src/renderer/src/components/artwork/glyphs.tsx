import type { ReactElement } from 'react'

/**
 * Per-console hardware illustrations.
 *
 * Each entry draws that machine's own silhouette — the NES front-loading deck,
 * the GameCube's handle, the PS2 tower, the Game Boy's offset screen — as an
 * original vector drawing inside a 100 x 100 box. Nothing here reproduces a
 * manufacturer's logo, so no third-party trademark ships with the application.
 *
 * Shapes are painted into a mask rather than filled directly: white is the
 * machine's body, grey recesses it, black cuts a hole straight through to the
 * background gradient. That keeps every drawing readable whatever the palette.
 */
export const SOLID = '#ffffff'
export const HOLE = '#000000'
/** A recessed panel — screens, disc lids, cartridge slots. */
export const RECESS = '#4a4a4a'
/** A subtle surface detail — vents, seams, badges. */
export const SHADED = '#9a9a9a'

/** Drawn when a stored console is no longer in the catalog. */
export const FALLBACK_GLYPH: ReactElement = (
  <g>
    <circle cx="22" cy="66" r="18" fill={SOLID} />
    <circle cx="78" cy="66" r="18" fill={SOLID} />
    <rect x="10" y="28" width="80" height="38" rx="17" fill={SOLID} />
    <rect x="27" y="38" width="6" height="20" rx="2.8" fill={HOLE} />
    <rect x="20" y="45" width="20" height="6" rx="2.8" fill={HOLE} />
    <circle cx="70" cy="42" r="5" fill={HOLE} />
    <circle cx="79" cy="52" r="5" fill={HOLE} />
  </g>
)

export const NINTENDO_GLYPHS: Record<string, ReactElement> = {
  // Front-loading deck with the flip-down cartridge door.
  'nintendo-nes': (
    <g>
      <rect x="6" y="30" width="88" height="42" rx="4" fill={SOLID} />
      <rect x="6" y="30" width="88" height="9" rx="4" fill={SHADED} />
      <rect x="20" y="45" width="60" height="20" rx="2" fill={RECESS} />
      <rect x="24" y="49" width="52" height="4" rx="1" fill={HOLE} />
      <circle cx="12.5" cy="66" r="2.6" fill={HOLE} />
      <rect x="84" y="44" width="6" height="14" rx="1.5" fill={SHADED} />
      <rect x="14" y="72" width="72" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // Rounded deck with the top-loading slot and the two ridged front buttons.
  'nintendo-snes': (
    <g>
      <path d="M8 40a6 6 0 0 1 6-6h72a6 6 0 0 1 6 6v30a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill={SOLID} />
      <rect x="30" y="34" width="40" height="12" rx="3" fill={RECESS} />
      <rect x="35" y="37" width="30" height="4" rx="1.5" fill={HOLE} />
      <rect x="14" y="52" width="16" height="4" rx="2" fill={SHADED} />
      <rect x="14" y="59" width="16" height="4" rx="2" fill={SHADED} />
      <rect x="72" y="52" width="14" height="11" rx="3" fill={SHADED} />
      <circle cx="46" cy="62" r="4" fill={HOLE} />
      <circle cx="58" cy="62" r="4" fill={HOLE} />
    </g>
  ),

  // Trapezoid deck: top cartridge bay and the four controller ports.
  'nintendo-64': (
    <g>
      <path d="M16 36h68a6 6 0 0 1 6 6v26a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V42a6 6 0 0 1 6-6z" fill={SOLID} />
      <rect x="32" y="26" width="36" height="12" rx="3" fill={SOLID} />
      <rect x="37" y="29" width="26" height="5" rx="2" fill={RECESS} />
      <rect x="24" y="44" width="52" height="10" rx="3" fill={SHADED} />
      <g fill={HOLE}>
        <circle cx="24" cy="63" r="4.6" />
        <circle cx="40" cy="63" r="4.6" />
        <circle cx="60" cy="63" r="4.6" />
        <circle cx="76" cy="63" r="4.6" />
      </g>
    </g>
  ),

  // The cube: carry handle over the back, the round lid seam on top and the
  // four controller ports along the front.
  'nintendo-gamecube': (
    <g>
      <path
        d="M32 32V24a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v8"
        fill="none"
        stroke={SOLID}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="20" y="30" width="60" height="54" rx="8" fill={SOLID} />
      <circle cx="50" cy="48" r="15" fill={SHADED} />
      <circle cx="50" cy="48" r="11.5" fill={SOLID} />
      <rect x="47" y="62" width="6" height="4" rx="1.4" fill={RECESS} />
      <g fill={HOLE}>
        <rect x="26" y="71" width="10" height="7" rx="2" />
        <rect x="40" y="71" width="10" height="7" rx="2" />
        <rect x="54" y="71" width="10" height="7" rx="2" />
        <rect x="68" y="71" width="10" height="7" rx="2" />
      </g>
    </g>
  ),

  // The upright slab: slot-loading drive, memory-card door and stand.
  'nintendo-wii': (
    <g>
      <rect x="38" y="10" width="24" height="72" rx="4" fill={SOLID} />
      <rect x="42" y="24" width="16" height="3.4" rx="1.7" fill={HOLE} />
      <rect x="43" y="34" width="14" height="12" rx="2" fill={RECESS} />
      <circle cx="50" cy="58" r="4" fill={SHADED} />
      <rect x="30" y="82" width="40" height="6" rx="3" fill={SOLID} />
    </g>
  ),

  // The console alongside its screened GamePad.
  'nintendo-wii-u': (
    <g>
      <rect x="6" y="24" width="42" height="20" rx="5" fill={SOLID} />
      <rect x="11" y="31" width="22" height="3.4" rx="1.7" fill={HOLE} />
      <circle cx="41" cy="34" r="2.6" fill={SHADED} />
      <rect x="16" y="52" width="76" height="38" rx="9" fill={SOLID} />
      <rect x="34" y="58" width="40" height="26" rx="2.6" fill={RECESS} />
      <circle cx="25" cy="66" r="4" fill={HOLE} />
      <circle cx="83" cy="66" r="4" fill={HOLE} />
      <circle cx="25" cy="78" r="3.4" fill={HOLE} />
      <circle cx="83" cy="78" r="3.4" fill={HOLE} />
    </g>
  ),

  // Tablet docked between two detachable controllers.
  'nintendo-switch': (
    <g>
      <rect x="8" y="24" width="18" height="52" rx="8" fill={SOLID} />
      <rect x="74" y="24" width="18" height="52" rx="8" fill={SOLID} />
      <rect x="28" y="24" width="44" height="52" rx="4" fill={SOLID} />
      <rect x="32" y="29" width="36" height="42" rx="2.6" fill={RECESS} />
      <circle cx="17" cy="38" r="4.4" fill={HOLE} />
      <g fill={HOLE}>
        <circle cx="83" cy="34" r="3.2" />
        <circle cx="83" cy="48" r="3.2" />
        <circle cx="77" cy="41" r="3.2" />
        <circle cx="89" cy="41" r="3.2" />
      </g>
      <rect x="12" y="52" width="10" height="10" rx="2" fill={HOLE} />
      <circle cx="83" cy="62" r="4.4" fill={HOLE} />
    </g>
  ),

  // The original brick: offset screen, diagonal buttons, angled speaker.
  'nintendo-game-boy': (
    <g>
      <path d="M26 8h48a6 6 0 0 1 6 6v66a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6z" fill={SOLID} />
      <rect x="32" y="15" width="36" height="30" rx="3" fill={RECESS} />
      <rect x="37" y="20" width="26" height="20" rx="1.6" fill={HOLE} />
      <rect x="36.5" y="55" width="5.5" height="16" rx="2" fill={HOLE} />
      <rect x="31" y="60.5" width="16.5" height="5.5" rx="2" fill={HOLE} />
      <circle cx="61" cy="55" r="4" fill={HOLE} />
      <circle cx="70" cy="61" r="4" fill={HOLE} />
      <g fill={SHADED}>
        <rect x="58" y="72" width="16" height="2.4" rx="1.2" transform="rotate(-30 66 73)" />
        <rect x="60" y="77" width="16" height="2.4" rx="1.2" transform="rotate(-30 68 78)" />
      </g>
    </g>
  ),

  // Shorter, rounder shell with a centred screen and a round D-pad.
  'nintendo-game-boy-color': (
    <g>
      <rect x="28" y="10" width="44" height="80" rx="9" fill={SOLID} />
      <rect x="34" y="17" width="32" height="28" rx="3" fill={RECESS} />
      <rect x="38" y="21" width="24" height="20" rx="1.6" fill={HOLE} />
      <circle cx="41" cy="61" r="9" fill={SHADED} />
      <rect x="38.5" y="54" width="5" height="14" rx="1.6" fill={HOLE} />
      <rect x="34" y="58.5" width="14" height="5" rx="1.6" fill={HOLE} />
      <circle cx="60" cy="58" r="4" fill={HOLE} />
      <circle cx="68" cy="64" r="4" fill={HOLE} />
      <rect x="40" y="80" width="20" height="3" rx="1.5" fill={SHADED} />
    </g>
  ),

  // Landscape shell with shoulder bumps flanking a wide centred screen.
  'nintendo-game-boy-advance': (
    <g>
      <path d="M14 32h72a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10H14A10 10 0 0 1 4 62V42a10 10 0 0 1 10-10z" fill={SOLID} />
      <rect x="10" y="26" width="18" height="8" rx="4" fill={SHADED} />
      <rect x="72" y="26" width="18" height="8" rx="4" fill={SHADED} />
      <rect x="32" y="38" width="36" height="26" rx="2.6" fill={RECESS} />
      <rect x="36" y="41" width="28" height="20" rx="1.4" fill={HOLE} />
      <rect x="17" y="45" width="5" height="14" rx="1.6" fill={HOLE} />
      <rect x="12" y="49.5" width="15" height="5" rx="1.6" fill={HOLE} />
      <circle cx="86" cy="47" r="4" fill={HOLE} />
      <circle cx="78" cy="56" r="4" fill={HOLE} />
    </g>
  ),

  // Clamshell opened out: two stacked screens either side of the hinge.
  'nintendo-ds': (
    <g>
      <rect x="20" y="6" width="60" height="40" rx="5" fill={SOLID} />
      <rect x="27" y="12" width="46" height="28" rx="2.4" fill={RECESS} />
      <rect x="20" y="48" width="60" height="6" rx="3" fill={SHADED} />
      <rect x="20" y="56" width="60" height="38" rx="5" fill={SOLID} />
      <rect x="33" y="61" width="34" height="26" rx="2.4" fill={RECESS} />
      <rect x="24.5" y="66" width="4" height="12" rx="1.4" fill={HOLE} />
      <rect x="20.5" y="70" width="12" height="4" rx="1.4" fill={HOLE} />
      <circle cx="74" cy="68" r="3" fill={HOLE} />
      <circle cx="74" cy="79" r="3" fill={HOLE} />
    </g>
  ),

  // Clamshell with the widescreen top panel and the 3D depth slider.
  'nintendo-3ds': (
    <g>
      <rect x="12" y="6" width="76" height="40" rx="5" fill={SOLID} />
      <rect x="20" y="12" width="60" height="28" rx="2.4" fill={RECESS} />
      <rect x="12" y="48" width="76" height="5" rx="2.5" fill={SHADED} />
      <rect x="16" y="55" width="68" height="39" rx="5" fill={SOLID} />
      <rect x="36" y="60" width="28" height="28" rx="2.4" fill={RECESS} />
      <circle cx="26" cy="66" r="4.6" fill={SHADED} />
      <rect x="22" y="76" width="4" height="11" rx="1.4" fill={HOLE} />
      <rect x="18.5" y="79.5" width="11" height="4" rx="1.4" fill={HOLE} />
      <rect x="80" y="58" width="3.5" height="14" rx="1.75" fill={HOLE} />
      <circle cx="74" cy="79" r="3.2" fill={HOLE} />
    </g>
  ),

  // The tabletop headset on its wire stand.
  'nintendo-virtual-boy': (
    <g>
      <path d="M18 22h64a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z" fill={SOLID} />
      <circle cx="33" cy="40" r="10" fill={RECESS} />
      <circle cx="67" cy="40" r="10" fill={RECESS} />
      <rect x="44" y="36" width="12" height="8" rx="2" fill={SHADED} />
      <rect x="46" y="58" width="8" height="18" rx="2" fill={SOLID} />
      <rect x="26" y="76" width="48" height="6" rx="3" fill={SOLID} />
    </g>
  )
}

export const SONY_GLYPHS: Record<string, ReactElement> = {
  // Flat deck with the circular disc lid and the two front buttons.
  'sony-playstation': (
    <g>
      <path d="M10 36h80a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V41a5 5 0 0 1 5-5z" fill={SOLID} />
      <circle cx="42" cy="52" r="17" fill={SHADED} />
      <circle cx="42" cy="52" r="9" fill={RECESS} />
      <circle cx="42" cy="52" r="3" fill={HOLE} />
      <circle cx="74" cy="45" r="4" fill={HOLE} />
      <circle cx="74" cy="59" r="4" fill={HOLE} />
      <rect x="12" y="45" width="12" height="14" rx="2" fill={RECESS} />
    </g>
  ),

  // The upright tower: disc slot, memory-card bays and controller ports.
  'sony-playstation-2': (
    <g>
      <rect x="34" y="8" width="32" height="84" rx="4" fill={SOLID} />
      <rect x="34" y="24" width="32" height="14" rx="2" fill={RECESS} />
      <rect x="39" y="29" width="22" height="4" rx="2" fill={HOLE} />
      <rect x="38" y="52" width="10" height="8" rx="1.6" fill={HOLE} />
      <rect x="52" y="52" width="10" height="8" rx="1.6" fill={HOLE} />
      <circle cx="43" cy="72" r="4" fill={HOLE} />
      <circle cx="57" cy="72" r="4" fill={HOLE} />
      <rect x="38" y="84" width="24" height="3" rx="1.5" fill={SHADED} />
    </g>
  ),

  // The curved-top deck with its slot-loading Blu-ray drive.
  'sony-playstation-3': (
    <g>
      <path d="M8 44c0-8 6-12 14-12h56c8 0 14 4 14 12v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill={SOLID} />
      <rect x="24" y="47" width="52" height="3.6" rx="1.8" fill={HOLE} />
      <circle cx="16" cy="60" r="3" fill={SHADED} />
      <circle cx="26" cy="60" r="3" fill={SHADED} />
      <rect x="60" y="56" width="26" height="8" rx="2" fill={RECESS} />
      <rect x="8" y="70" width="84" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // The slanted parallelogram shell with the light strip along its seam.
  'sony-playstation-4': (
    <g>
      <path d="M14 62 24 34h62a4 4 0 0 1 4 4l-8 24a4 4 0 0 1-4 3H16a2.4 2.4 0 0 1-2-3z" fill={SOLID} />
      <path d="M19 48h66" stroke={HOLE} strokeWidth="3.4" strokeLinecap="round" />
      <rect x="30" y="66" width="52" height="5" rx="2.5" fill={SHADED} />
      <circle cx="76" cy="41" r="2.6" fill={HOLE} />
    </g>
  ),

  // Landscape handheld with the wide screen and the UMD hatch behind it.
  'sony-psp': (
    <g>
      <rect x="4" y="30" width="92" height="40" rx="12" fill={SOLID} />
      <rect x="30" y="36" width="40" height="28" rx="2.4" fill={RECESS} />
      <rect x="34" y="39" width="32" height="22" rx="1.4" fill={HOLE} />
      <rect x="14" y="43" width="5" height="14" rx="1.6" fill={HOLE} />
      <rect x="9" y="47.5" width="15" height="5" rx="1.6" fill={HOLE} />
      <circle cx="88" cy="43" r="3.6" fill={HOLE} />
      <circle cx="80" cy="50" r="3.6" fill={HOLE} />
      <circle cx="88" cy="57" r="3.6" fill={HOLE} />
      <circle cx="19" cy="63" r="3.4" fill={SHADED} />
    </g>
  ),

  // Landscape handheld with twin analogue sticks either side of the screen.
  'sony-ps-vita': (
    <g>
      <rect x="4" y="28" width="92" height="44" rx="16" fill={SOLID} />
      <rect x="28" y="34" width="44" height="30" rx="2.4" fill={RECESS} />
      <rect x="14" y="37" width="4.6" height="12" rx="1.5" fill={HOLE} />
      <rect x="9.7" y="41" width="13" height="4.6" rx="1.5" fill={HOLE} />
      <circle cx="86" cy="38" r="3.2" fill={HOLE} />
      <circle cx="79" cy="45" r="3.2" fill={HOLE} />
      <circle cx="16" cy="60" r="5.4" fill={SHADED} />
      <circle cx="84" cy="60" r="5.4" fill={SHADED} />
    </g>
  )
}

export const SEGA_GLYPHS: Record<string, ReactElement> = {
  // Wedge deck with the top cartridge slot and the front card slot.
  'sega-master-system': (
    <g>
      <path d="M8 42h84a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V46a4 4 0 0 1 4-4z" fill={SOLID} />
      <rect x="30" y="32" width="40" height="12" rx="2" fill={SOLID} />
      <rect x="35" y="35" width="30" height="5" rx="2" fill={RECESS} />
      <rect x="14" y="52" width="30" height="5" rx="2" fill={HOLE} />
      <circle cx="80" cy="55" r="4.4" fill={SHADED} />
      <rect x="14" y="63" width="52" height="3" rx="1.5" fill={SHADED} />
    </g>
  ),

  // Low deck with the top cart slot and the round volume dial.
  'sega-genesis': (
    <g>
      <path d="M8 40h84a5 5 0 0 1 5 5v24a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V45a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="26" y="30" width="34" height="12" rx="2" fill={SOLID} />
      <rect x="31" y="33" width="24" height="5" rx="2" fill={RECESS} />
      <circle cx="79" cy="55" r="11" fill={SHADED} />
      <circle cx="79" cy="55" r="4" fill={HOLE} />
      <rect x="12" y="50" width="26" height="4" rx="2" fill={SHADED} />
      <rect x="12" y="58" width="18" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // The CD base unit with the console docked on top of it.
  'sega-cd': (
    <g>
      <rect x="10" y="26" width="60" height="20" rx="3" fill={SOLID} />
      <rect x="18" y="32" width="30" height="4" rx="2" fill={RECESS} />
      <rect x="4" y="52" width="92" height="30" rx="4" fill={SOLID} />
      <rect x="14" y="60" width="52" height="14" rx="2" fill={RECESS} />
      <rect x="18" y="65" width="44" height="4" rx="2" fill={HOLE} />
      <circle cx="82" cy="67" r="6" fill={SHADED} />
    </g>
  ),

  // The mushroom-shaped pass-through cartridge.
  'sega-32x': (
    <g>
      <path d="M18 28h64a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5V33a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="24" y="35" width="52" height="12" rx="2" fill={RECESS} />
      <rect x="34" y="58" width="32" height="26" rx="3" fill={SOLID} />
      <rect x="40" y="76" width="20" height="8" rx="1.5" fill={HOLE} />
      <rect x="30" y="52" width="40" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // Deck with the oval disc lid and the two long front buttons.
  'sega-saturn': (
    <g>
      <path d="M8 34h84a5 5 0 0 1 5 5v30a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V39a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="22" y="40" width="56" height="20" rx="10" fill={RECESS} />
      <circle cx="50" cy="50" r="4" fill={HOLE} />
      <rect x="20" y="65" width="24" height="5" rx="2.5" fill={HOLE} />
      <rect x="56" y="65" width="24" height="5" rx="2.5" fill={HOLE} />
    </g>
  ),

  // Rounded deck with the circular GD-ROM lid and four controller ports.
  'sega-dreamcast': (
    <g>
      <path d="M14 36h72a8 8 0 0 1 8 8v20a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V44a8 8 0 0 1 8-8z" fill={SOLID} />
      <circle cx="50" cy="48" r="13" fill={RECESS} />
      <circle cx="50" cy="48" r="3.4" fill={HOLE} />
      <g fill={HOLE}>
        <rect x="18" y="60" width="12" height="6" rx="1.6" />
        <rect x="34" y="60" width="12" height="6" rx="1.6" />
        <rect x="54" y="60" width="12" height="6" rx="1.6" />
        <rect x="70" y="60" width="12" height="6" rx="1.6" />
      </g>
      <rect x="14" y="40" width="14" height="5" rx="2.5" fill={SHADED} />
    </g>
  ),

  // Landscape handheld with the centred screen and rounded grips.
  'sega-game-gear': (
    <g>
      <rect x="6" y="28" width="88" height="44" rx="14" fill={SOLID} />
      <rect x="32" y="35" width="36" height="30" rx="2.4" fill={RECESS} />
      <rect x="36" y="38" width="28" height="24" rx="1.4" fill={HOLE} />
      <circle cx="18" cy="50" r="9" fill={SHADED} />
      <rect x="15.5" y="43" width="5" height="14" rx="1.6" fill={HOLE} />
      <rect x="11" y="47.5" width="14" height="5" rx="1.6" fill={HOLE} />
      <circle cx="79" cy="45" r="4.2" fill={HOLE} />
      <circle cx="86" cy="55" r="4.2" fill={HOLE} />
    </g>
  ),

  // Small deck with the top cart slot and its fixed joystick.
  'sega-sg-1000': (
    <g>
      <rect x="10" y="44" width="60" height="28" rx="4" fill={SOLID} />
      <rect x="24" y="34" width="32" height="12" rx="2" fill={SOLID} />
      <rect x="29" y="37" width="22" height="5" rx="2" fill={RECESS} />
      <rect x="18" y="54" width="30" height="4" rx="2" fill={SHADED} />
      <rect x="18" y="62" width="20" height="4" rx="2" fill={SHADED} />
      <rect x="76" y="56" width="18" height="16" rx="3" fill={SOLID} />
      <rect x="83" y="42" width="4" height="16" rx="2" fill={SOLID} />
      <circle cx="85" cy="40" r="5" fill={SHADED} />
    </g>
  )
}

export const MICROSOFT_GLYPHS: Record<string, ReactElement> = {
  // The chunky original deck: disc tray, centre disc and four ports.
  'microsoft-xbox': (
    <g>
      <path d="M8 32h84a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V38a6 6 0 0 1 6-6z" fill={SOLID} />
      <circle cx="50" cy="46" r="11" fill={SHADED} />
      <circle cx="50" cy="46" r="4.4" fill={RECESS} />
      <rect x="24" y="62" width="52" height="6" rx="2" fill={RECESS} />
      <g fill={HOLE}>
        <circle cx="14" cy="47" r="4" />
        <circle cx="26" cy="52" r="4" />
        <circle cx="74" cy="52" r="4" />
        <circle cx="86" cy="47" r="4" />
      </g>
    </g>
  ),

  // The upright deck with its pinched waist and slot-loading drive.
  'microsoft-xbox-360': (
    <g>
      <path d="M36 8h28a4 4 0 0 1 4 4v18l4 8-4 8v36a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4V46l-4-8 4-8V12a4 4 0 0 1 4-4z" fill={SOLID} />
      <rect x="38" y="22" width="24" height="3.4" rx="1.7" fill={HOLE} />
      <circle cx="50" cy="48" r="9" fill={SHADED} />
      <circle cx="50" cy="48" r="4" fill={HOLE} />
      <rect x="40" y="70" width="20" height="4" rx="2" fill={SHADED} />
      <rect x="26" y="86" width="48" height="6" rx="3" fill={SOLID} />
    </g>
  )
}

export const ATARI_GLYPHS: Record<string, ReactElement> = {
  // The wedge with its six top switches and woodgrain front panel.
  'atari-2600': (
    <g>
      <path d="M10 36h80a4 4 0 0 1 4 4v6H6v-6a4 4 0 0 1 4-4z" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="16" y="38" width="5" height="6" rx="1.2" />
        <rect x="27" y="38" width="5" height="6" rx="1.2" />
        <rect x="38" y="38" width="5" height="6" rx="1.2" />
        <rect x="57" y="38" width="5" height="6" rx="1.2" />
        <rect x="68" y="38" width="5" height="6" rx="1.2" />
        <rect x="79" y="38" width="5" height="6" rx="1.2" />
      </g>
      <rect x="6" y="48" width="88" height="26" rx="3" fill={SOLID} />
      <g fill={SHADED}>
        <rect x="12" y="53" width="76" height="3" rx="1.5" />
        <rect x="12" y="60" width="76" height="3" rx="1.5" />
        <rect x="12" y="67" width="76" height="3" rx="1.5" />
      </g>
    </g>
  ),

  // The larger sloped deck with four switches and a centred cart bay.
  'atari-5200': (
    <g>
      <path d="M12 34h76a5 5 0 0 1 5 5l4 30a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4l4-30a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="34" y="38" width="32" height="10" rx="2" fill={RECESS} />
      <g fill={HOLE}>
        <rect x="14" y="55" width="6" height="6" rx="1.4" />
        <rect x="25" y="55" width="6" height="6" rx="1.4" />
        <rect x="69" y="55" width="6" height="6" rx="1.4" />
        <rect x="80" y="55" width="6" height="6" rx="1.4" />
      </g>
      <rect x="38" y="58" width="24" height="10" rx="2" fill={SHADED} />
    </g>
  ),

  // Low silver deck with the front cart slot and two switches.
  'atari-7800': (
    <g>
      <path d="M8 40h84a5 5 0 0 1 5 5v24a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V45a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="30" y="30" width="40" height="12" rx="2" fill={SOLID} />
      <rect x="35" y="33" width="30" height="5" rx="2" fill={RECESS} />
      <rect x="14" y="52" width="34" height="12" rx="2" fill={RECESS} />
      <g fill={HOLE}>
        <rect x="62" y="54" width="6" height="8" rx="1.4" />
        <rect x="74" y="54" width="6" height="8" rx="1.4" />
      </g>
    </g>
  ),

  // Landscape handheld with a centred screen and angled grips.
  'atari-lynx': (
    <g>
      <rect x="6" y="30" width="88" height="40" rx="10" fill={SOLID} />
      <rect x="32" y="36" width="36" height="28" rx="2.4" fill={RECESS} />
      <rect x="36" y="39" width="28" height="22" rx="1.4" fill={HOLE} />
      <rect x="17" y="43" width="5" height="14" rx="1.6" fill={HOLE} />
      <rect x="12" y="47.5" width="15" height="5" rx="1.6" fill={HOLE} />
      <circle cx="79" cy="45" r="4.2" fill={HOLE} />
      <circle cx="88" cy="52" r="4.2" fill={HOLE} />
      <rect x="74" y="60" width="18" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // Rounded black deck with the top cart slot and the front cartridge bay.
  'atari-jaguar': (
    <g>
      <path d="M12 40h76a10 10 0 0 1 10 10v16a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V50a10 10 0 0 1 10-10z" fill={SOLID} />
      <rect x="28" y="28" width="44" height="14" rx="4" fill={SOLID} />
      <rect x="34" y="32" width="32" height="6" rx="3" fill={RECESS} />
      <rect x="20" y="52" width="60" height="4" rx="2" fill={SHADED} />
      <circle cx="86" cy="60" r="4.4" fill={HOLE} />
      <rect x="20" y="62" width="26" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // Keyboard-and-monitor desktop machine.
  'atari-st': (
    <g>
      <rect x="24" y="8" width="52" height="38" rx="4" fill={SOLID} />
      <rect x="30" y="14" width="40" height="26" rx="2" fill={RECESS} />
      <rect x="44" y="46" width="12" height="8" fill={SHADED} />
      <path d="M10 60h80a4 4 0 0 1 4 4l3 22a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3l3-22a4 4 0 0 1 4-4z" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="14" y="66" width="72" height="4" rx="1.6" />
        <rect x="16" y="74" width="68" height="4" rx="1.6" />
        <rect x="30" y="82" width="40" height="4" rx="2" />
      </g>
    </g>
  )
}

export const OTHER_CONSOLE_GLYPHS: Record<string, ReactElement> = {
  // The home deck: top cart slot with the two large controller bays.
  'snk-neo-geo': (
    <g>
      <path d="M6 40h88a5 5 0 0 1 5 5v26a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V45a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="34" y="30" width="32" height="12" rx="2" fill={SOLID} />
      <rect x="39" y="33" width="22" height="5" rx="2" fill={RECESS} />
      <rect x="10" y="50" width="30" height="18" rx="3" fill={RECESS} />
      <rect x="60" y="50" width="30" height="18" rx="3" fill={RECESS} />
      <rect x="44" y="54" width="12" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // The coin-op cabinet: marquee, screen and a four-button panel.
  'snk-neo-geo-mvs': (
    <g>
      <path d="M22 8h56a5 5 0 0 1 5 5v78a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V13a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="24" y="13" width="52" height="12" rx="2" fill={SHADED} />
      <rect x="24" y="30" width="52" height="30" rx="2" fill={RECESS} />
      <rect x="24" y="64" width="52" height="14" rx="2" fill={SHADED} />
      <circle cx="34" cy="71" r="3.6" fill={HOLE} />
      <g fill={HOLE}>
        <circle cx="49" cy="69" r="2.8" />
        <circle cx="58" cy="69" r="2.8" />
        <circle cx="67" cy="69" r="2.8" />
      </g>
      <rect x="30" y="82" width="40" height="4" rx="2" fill={HOLE} />
    </g>
  ),

  // Vertical handheld with the clicky micro-stick and two buttons.
  'snk-neo-geo-pocket': (
    <g>
      <rect x="26" y="10" width="48" height="80" rx="8" fill={SOLID} />
      <rect x="32" y="18" width="36" height="28" rx="2.6" fill={RECESS} />
      <circle cx="40" cy="62" r="9" fill={SHADED} />
      <circle cx="40" cy="62" r="4" fill={HOLE} />
      <circle cx="60" cy="58" r="4.4" fill={HOLE} />
      <circle cx="68" cy="66" r="4.4" fill={HOLE} />
      <rect x="42" y="80" width="16" height="3" rx="1.5" fill={SHADED} />
    </g>
  ),

  // Small deck with the HuCard slot standing proud of the lid.
  'nec-turbografx-16': (
    <g>
      <rect x="18" y="44" width="64" height="28" rx="4" fill={SOLID} />
      <rect x="34" y="30" width="32" height="16" rx="2" fill={SOLID} />
      <rect x="38" y="34" width="24" height="4" rx="2" fill={RECESS} />
      <rect x="26" y="54" width="24" height="4" rx="2" fill={SHADED} />
      <circle cx="70" cy="60" r="5" fill={HOLE} />
      <rect x="26" y="62" width="16" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // The console docked into its CD-ROM base unit.
  'nec-pc-engine-cd': (
    <g>
      <rect x="18" y="24" width="34" height="20" rx="3" fill={SOLID} />
      <rect x="24" y="30" width="22" height="4" rx="2" fill={RECESS} />
      <rect x="6" y="50" width="88" height="32" rx="4" fill={SOLID} />
      <circle cx="34" cy="66" r="12" fill={RECESS} />
      <circle cx="34" cy="66" r="3.4" fill={HOLE} />
      <rect x="56" y="58" width="30" height="5" rx="2.5" fill={SHADED} />
      <rect x="56" y="68" width="20" height="5" rx="2.5" fill={SHADED} />
    </g>
  ),

  // Black deck with a front-loading tray and a tall vent column.
  'panasonic-3do': (
    <g>
      <path d="M8 34h84a5 5 0 0 1 5 5v32a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V39a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="14" y="44" width="50" height="22" rx="3" fill={RECESS} />
      <rect x="20" y="52" width="38" height="5" rx="2.5" fill={HOLE} />
      <g fill={SHADED}>
        <rect x="72" y="44" width="4" height="22" rx="2" />
        <rect x="80" y="44" width="4" height="22" rx="2" />
        <rect x="88" y="44" width="4" height="22" rx="2" />
      </g>
    </g>
  ),

  // Flat deck with the front drawer and its two indicator lights.
  'philips-cd-i': (
    <g>
      <path d="M4 38h92a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V42a4 4 0 0 1 4-4z" fill={SOLID} />
      <rect x="10" y="46" width="54" height="18" rx="2" fill={RECESS} />
      <rect x="16" y="53" width="42" height="4" rx="2" fill={HOLE} />
      <circle cx="76" cy="52" r="3" fill={HOLE} />
      <circle cx="86" cy="52" r="3" fill={HOLE} />
      <rect x="70" y="60" width="22" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // Vertical handheld with the square screen and stacked thumb pads.
  'bandai-wonderswan': (
    <g>
      <rect x="28" y="10" width="44" height="80" rx="7" fill={SOLID} />
      <rect x="34" y="17" width="32" height="30" rx="2.4" fill={RECESS} />
      <g fill={HOLE}>
        <rect x="38.5" y="52" width="4" height="11" rx="1.4" />
        <rect x="35" y="55.5" width="11" height="4" rx="1.4" />
        <rect x="38.5" y="68" width="4" height="11" rx="1.4" />
        <rect x="35" y="71.5" width="11" height="4" rx="1.4" />
      </g>
      <circle cx="60" cy="60" r="4" fill={HOLE} />
      <circle cx="60" cy="72" r="4" fill={HOLE} />
    </g>
  ),

  // Sloped deck with a cart slot and two controller storage wells.
  'coleco-colecovision': (
    <g>
      <path d="M10 38h80a5 5 0 0 1 5 5v28a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V43a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="36" y="42" width="28" height="10" rx="2" fill={RECESS} />
      <rect x="12" y="46" width="18" height="24" rx="3" fill={RECESS} />
      <rect x="70" y="46" width="18" height="24" rx="3" fill={RECESS} />
      <rect x="38" y="58" width="24" height="4" rx="2" fill={SHADED} />
      <rect x="38" y="66" width="16" height="4" rx="2" fill={SHADED} />
    </g>
  ),

  // Wood-fronted deck with the two keypad controllers docked at its sides.
  'mattel-intellivision': (
    <g>
      <rect x="26" y="34" width="48" height="38" rx="4" fill={SOLID} />
      <rect x="32" y="40" width="36" height="10" rx="2" fill={RECESS} />
      <g fill={SHADED}>
        <rect x="32" y="56" width="36" height="3" rx="1.5" />
        <rect x="32" y="63" width="36" height="3" rx="1.5" />
      </g>
      <rect x="4" y="38" width="18" height="32" rx="3" fill={SOLID} />
      <rect x="78" y="38" width="18" height="32" rx="3" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="8" y="44" width="10" height="16" rx="1.6" />
        <rect x="82" y="44" width="10" height="16" rx="1.6" />
      </g>
    </g>
  ),

  // Deck dominated by its membrane keyboard and cart slot.
  'magnavox-odyssey-2': (
    <g>
      <path d="M8 32h84a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V36a4 4 0 0 1 4-4z" fill={SOLID} />
      <rect x="34" y="36" width="32" height="9" rx="2" fill={RECESS} />
      <rect x="10" y="50" width="80" height="24" rx="2" fill={RECESS} />
      <g fill={HOLE}>
        <rect x="14" y="54" width="72" height="3.4" rx="1.4" />
        <rect x="14" y="61" width="72" height="3.4" rx="1.4" />
        <rect x="26" y="68" width="48" height="3.4" rx="1.7" />
      </g>
    </g>
  ),

  // The upright cabinet with its integrated vector screen.
  'gce-vectrex': (
    <g>
      <path d="M24 6h52a5 5 0 0 1 5 5v62a5 5 0 0 1-5 5H24a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5z" fill={SOLID} />
      <rect x="27" y="12" width="46" height="40" rx="3" fill={RECESS} />
      <path d="M36 42l8-18 8 12 8-16 6 22" fill="none" stroke={HOLE} strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="30" y="58" width="40" height="12" rx="2" fill={SHADED} />
      <rect x="28" y="82" width="44" height="12" rx="3" fill={SOLID} />
      <rect x="34" y="86" width="32" height="4" rx="2" fill={HOLE} />
    </g>
  )
}

export const COMPUTER_GLYPHS: Record<string, ReactElement> = {
  // The breadbin wedge with its function-key column.
  'commodore-64': (
    <g>
      <path d="M6 40h88a5 5 0 0 1 5 5v22a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6V45a5 5 0 0 1 5-5z" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="8" y="46" width="70" height="4" rx="1.6" />
        <rect x="10" y="54" width="68" height="4" rx="1.6" />
        <rect x="12" y="62" width="66" height="4" rx="1.6" />
      </g>
      <g fill={SHADED}>
        <rect x="84" y="46" width="9" height="5" rx="1.6" />
        <rect x="84" y="54" width="9" height="5" rx="1.6" />
        <rect x="84" y="62" width="9" height="5" rx="1.6" />
      </g>
    </g>
  ),

  // Keyboard unit with its mouse alongside.
  'commodore-amiga': (
    <g>
      <path d="M6 46h72a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V50a4 4 0 0 1 4-4z" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="9" y="52" width="66" height="4" rx="1.6" />
        <rect x="11" y="60" width="64" height="4" rx="1.6" />
        <rect x="24" y="68" width="38" height="4" rx="2" />
      </g>
      <rect x="86" y="52" width="12" height="20" rx="5" fill={SOLID} />
      <rect x="89" y="55" width="6" height="5" rx="1.4" fill={HOLE} />
      <rect x="30" y="30" width="40" height="12" rx="2" fill={SHADED} />
    </g>
  ),

  // The small rubber-key machine with its corner flash of colour bars.
  'sinclair-zx-spectrum': (
    <g>
      <path d="M10 42h80a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V47a5 5 0 0 1 5-5z" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="12" y="48" width="60" height="5" rx="2" />
        <rect x="14" y="57" width="58" height="5" rx="2" />
        <rect x="20" y="66" width="46" height="5" rx="2" />
      </g>
      <g fill={SHADED}>
        <rect x="78" y="62" width="3.6" height="10" rx="1.2" />
        <rect x="83" y="62" width="3.6" height="10" rx="1.2" />
        <rect x="88" y="62" width="3.6" height="10" rx="1.2" />
      </g>
    </g>
  ),

  // Keyboard machine with the cartridge slot standing at its right.
  msx: (
    <g>
      <path d="M6 44h76a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V48a4 4 0 0 1 4-4z" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="9" y="50" width="70" height="4" rx="1.6" />
        <rect x="11" y="58" width="68" height="4" rx="1.6" />
        <rect x="26" y="66" width="38" height="4" rx="2" />
      </g>
      <rect x="82" y="30" width="14" height="20" rx="3" fill={SOLID} />
      <rect x="85" y="34" width="8" height="4" rx="2" fill={RECESS} />
    </g>
  ),

  // Keyboard with the tape deck built into its right-hand side.
  'amstrad-cpc': (
    <g>
      <path d="M6 42h88a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V46a4 4 0 0 1 4-4z" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="9" y="48" width="54" height="4" rx="1.6" />
        <rect x="11" y="56" width="52" height="4" rx="1.6" />
        <rect x="20" y="64" width="43" height="4" rx="2" />
      </g>
      <rect x="68" y="48" width="26" height="22" rx="3" fill={RECESS} />
      <circle cx="75" cy="59" r="3.4" fill={HOLE} />
      <circle cx="87" cy="59" r="3.4" fill={HOLE} />
    </g>
  ),

  // The twin-tower desktop case with its carry handle.
  'sharp-x68000': (
    <g>
      <rect x="24" y="14" width="24" height="72" rx="4" fill={SOLID} />
      <rect x="52" y="14" width="24" height="72" rx="4" fill={SOLID} />
      <path d="M40 14v-5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5" fill="none" stroke={SOLID} strokeWidth="4" />
      <rect x="28" y="26" width="16" height="4" rx="2" fill={HOLE} />
      <rect x="28" y="36" width="16" height="4" rx="2" fill={HOLE} />
      <g fill={SHADED}>
        <rect x="56" y="26" width="16" height="3.4" rx="1.7" />
        <rect x="56" y="34" width="16" height="3.4" rx="1.7" />
        <rect x="56" y="42" width="16" height="3.4" rx="1.7" />
      </g>
      <circle cx="36" cy="72" r="3.4" fill={SHADED} />
    </g>
  ),

  // Desktop PC: monitor above, tower and keyboard below.
  'ms-dos': (
    <g>
      <rect x="14" y="8" width="56" height="42" rx="4" fill={SOLID} />
      <rect x="20" y="14" width="44" height="30" rx="2" fill={RECESS} />
      <g fill={HOLE}>
        <rect x="24" y="19" width="14" height="3.4" rx="1.2" />
        <rect x="24" y="26" width="26" height="3.4" rx="1.2" />
        <rect x="24" y="33" width="6" height="3.4" rx="1.2" />
      </g>
      <rect x="36" y="50" width="12" height="6" fill={SHADED} />
      <rect x="76" y="20" width="20" height="46" rx="3" fill={SOLID} />
      <rect x="80" y="27" width="12" height="4" rx="1.4" fill={HOLE} />
      <rect x="80" y="35" width="12" height="4" rx="1.4" fill={HOLE} />
      <circle cx="86" cy="56" r="3" fill={SHADED} />
      <rect x="8" y="62" width="60" height="22" rx="3" fill={SOLID} />
      <g fill={HOLE}>
        <rect x="12" y="67" width="52" height="3.6" rx="1.4" />
        <rect x="14" y="75" width="48" height="3.6" rx="1.4" />
      </g>
    </g>
  ),

  // The coin-op cabinet: marquee, screen, joystick and buttons.
  arcade: (
    <g>
      <path d="M18 6h64a6 6 0 0 1 6 6v82a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V12a6 6 0 0 1 6-6z" fill={SOLID} />
      <rect x="20" y="11" width="60" height="14" rx="2" fill={SHADED} />
      <rect x="20" y="30" width="60" height="34" rx="2" fill={RECESS} />
      <rect x="18" y="68" width="64" height="16" rx="2" fill={SHADED} />
      <circle cx="32" cy="76" r="4.4" fill={HOLE} />
      <g fill={HOLE}>
        <circle cx="50" cy="73" r="3" />
        <circle cx="60" cy="73" r="3" />
        <circle cx="70" cy="73" r="3" />
        <circle cx="55" cy="81" r="3" />
        <circle cx="65" cy="81" r="3" />
      </g>
      <rect x="26" y="88" width="48" height="4" rx="2" fill={HOLE} />
    </g>
  )
}

/** Every console illustration, keyed by catalog id. */
export const CONSOLE_GLYPHS: Record<string, ReactElement> = {
  ...NINTENDO_GLYPHS,
  ...SONY_GLYPHS,
  ...SEGA_GLYPHS,
  ...MICROSOFT_GLYPHS,
  ...ATARI_GLYPHS,
  ...OTHER_CONSOLE_GLYPHS,
  ...COMPUTER_GLYPHS
}
