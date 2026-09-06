import type { ConsoleDefinition } from '../types'

/**
 * The console catalog.
 *
 * Adding a platform to EmuHub means adding one entry here — no UI, storage or
 * navigation code needs to change. Artwork is generated from the `artwork`
 * palette and glyph, so no third-party imagery ships with the application.
 */
export const CONSOLE_CATALOG: ConsoleDefinition[] = [
  /* ---------------------------------------------------------------- */
  /* Nintendo                                                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'nintendo-nes',
    name: 'Nintendo Entertainment System',
    shortName: 'NES',
    manufacturer: 'Nintendo',
    generation: 3,
    releaseYear: 1983,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#8d8d94', to: '#c0392b', ink: '#f7f7f9', glyph: 'cartridge' },
    aliases: ['famicom', 'nes', 'family computer', '8-bit'],
    knownEmulators: ['Mesen', 'FCEUX', 'Nestopia', 'puNES', 'Nintaco']
  },
  {
    id: 'nintendo-snes',
    name: 'Super Nintendo Entertainment System',
    shortName: 'SNES',
    manufacturer: 'Nintendo',
    generation: 4,
    releaseYear: 1990,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#5a4a9c', to: '#8f7ad6', ink: '#f5f3ff', glyph: 'cartridge' },
    aliases: ['super famicom', 'snes', 'sfc', 'super nintendo', '16-bit'],
    knownEmulators: ['Snes9x', 'bsnes', 'Mesen-S', 'higan', 'RetroArch']
  },
  {
    id: 'nintendo-64',
    name: 'Nintendo 64',
    shortName: 'N64',
    manufacturer: 'Nintendo',
    generation: 5,
    releaseYear: 1996,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#2f6d3f', to: '#57b45f', ink: '#f2fff4', glyph: 'cartridge' },
    aliases: ['n64', 'ultra 64', 'project reality'],
    knownEmulators: ['Project64', 'Mupen64Plus', 'simple64', 'ParaLLEl N64', 'Ares']
  },
  {
    id: 'nintendo-gamecube',
    name: 'Nintendo GameCube',
    shortName: 'GameCube',
    manufacturer: 'Nintendo',
    generation: 6,
    releaseYear: 2001,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#4b3f9e', to: '#7d6ce0', ink: '#f3f1ff', glyph: 'disc' },
    aliases: ['gcn', 'ngc', 'gamecube', 'dolphin'],
    knownEmulators: ['Dolphin', 'Ishiiruka', 'RetroArch']
  },
  {
    id: 'nintendo-wii',
    name: 'Nintendo Wii',
    shortName: 'Wii',
    manufacturer: 'Nintendo',
    generation: 7,
    releaseYear: 2006,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#d7dde5', to: '#8fb6d8', ink: '#1d2733', glyph: 'disc' },
    aliases: ['wii', 'rvl'],
    knownEmulators: ['Dolphin', 'Ishiiruka']
  },
  {
    id: 'nintendo-wii-u',
    name: 'Nintendo Wii U',
    shortName: 'Wii U',
    manufacturer: 'Nintendo',
    generation: 8,
    releaseYear: 2012,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#2f7fd0', to: '#63b7f0', ink: '#f2faff', glyph: 'disc' },
    aliases: ['wiiu', 'wii u', 'cemu'],
    knownEmulators: ['Cemu', 'Decaf']
  },
  {
    id: 'nintendo-switch',
    name: 'Nintendo Switch',
    shortName: 'Switch',
    manufacturer: 'Nintendo',
    generation: 8,
    releaseYear: 2017,
    formFactor: 'hybrid',
    media: 'card',
    artwork: { from: '#c62b34', to: '#f0575f', ink: '#fff4f5', glyph: 'gamepad' },
    aliases: ['switch', 'nx', 'joy-con'],
    knownEmulators: ['Ryujinx', 'Sudachi', 'Yuzu']
  },
  {
    id: 'nintendo-game-boy',
    name: 'Game Boy',
    shortName: 'Game Boy',
    manufacturer: 'Nintendo',
    generation: 4,
    releaseYear: 1989,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#7f8b6a', to: '#b6c48e', ink: '#1f2617', glyph: 'handheld' },
    aliases: ['gb', 'dmg', 'gameboy'],
    knownEmulators: ['SameBoy', 'mGBA', 'BGB', 'Gambatte', 'Emulicious']
  },
  {
    id: 'nintendo-game-boy-color',
    name: 'Game Boy Color',
    shortName: 'GB Color',
    manufacturer: 'Nintendo',
    generation: 5,
    releaseYear: 1998,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#8d51c9', to: '#4bc3d4', ink: '#f8f4ff', glyph: 'handheld' },
    aliases: ['gbc', 'gameboy color'],
    knownEmulators: ['SameBoy', 'mGBA', 'BGB', 'Gambatte']
  },
  {
    id: 'nintendo-game-boy-advance',
    name: 'Game Boy Advance',
    shortName: 'GBA',
    manufacturer: 'Nintendo',
    generation: 6,
    releaseYear: 2001,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#3b3fa8', to: '#7a7fe8', ink: '#f2f3ff', glyph: 'handheld' },
    aliases: ['gba', 'agb', 'gameboy advance', 'sp'],
    knownEmulators: ['mGBA', 'VisualBoyAdvance-M', 'NanoBoyAdvance', 'no$gba']
  },
  {
    id: 'nintendo-ds',
    name: 'Nintendo DS',
    shortName: 'DS',
    manufacturer: 'Nintendo',
    generation: 7,
    releaseYear: 2004,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#3c4d63', to: '#7f93ad', ink: '#f5f8fb', glyph: 'dual-screen' },
    aliases: ['nds', 'ds lite', 'dsi', 'nintendo ds'],
    knownEmulators: ['melonDS', 'DeSmuME', 'no$gba']
  },
  {
    id: 'nintendo-3ds',
    name: 'Nintendo 3DS',
    shortName: '3DS',
    manufacturer: 'Nintendo',
    generation: 8,
    releaseYear: 2011,
    formFactor: 'handheld',
    media: 'card',
    artwork: { from: '#b32b45', to: '#f0687f', ink: '#fff3f5', glyph: 'dual-screen' },
    aliases: ['3ds', 'n3ds', 'new 3ds', 'ctr'],
    knownEmulators: ['Azahar', 'Lime3DS', 'Citra', 'Panda3DS']
  },
  {
    id: 'nintendo-virtual-boy',
    name: 'Virtual Boy',
    shortName: 'Virtual Boy',
    manufacturer: 'Nintendo',
    generation: 5,
    releaseYear: 1995,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#8e1b1b', to: '#e0403f', ink: '#fff0f0', glyph: 'cartridge' },
    aliases: ['vb', 'virtualboy'],
    knownEmulators: ['Mednafen', 'RetroArch', 'Red Dragon']
  },

  /* ---------------------------------------------------------------- */
  /* Sony                                                              */
  /* ---------------------------------------------------------------- */
  {
    id: 'sony-playstation',
    name: 'PlayStation',
    shortName: 'PS1',
    manufacturer: 'Sony',
    generation: 5,
    releaseYear: 1994,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#4a4f57', to: '#9aa3ae', ink: '#f6f8fa', glyph: 'disc' },
    aliases: ['ps1', 'psx', 'psone', 'playstation 1'],
    knownEmulators: ['DuckStation', 'PCSX-Redux', 'Beetle PSX', 'ePSXe']
  },
  {
    id: 'sony-playstation-2',
    name: 'PlayStation 2',
    shortName: 'PS2',
    manufacturer: 'Sony',
    generation: 6,
    releaseYear: 2000,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#1b2a6b', to: '#4361c9', ink: '#eef2ff', glyph: 'disc' },
    aliases: ['ps2', 'playstation 2', 'pcsx2'],
    knownEmulators: ['PCSX2', 'Play!', 'AetherSX2']
  },
  {
    id: 'sony-playstation-3',
    name: 'PlayStation 3',
    shortName: 'PS3',
    manufacturer: 'Sony',
    generation: 7,
    releaseYear: 2006,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#141821', to: '#414b60', ink: '#eef1f7', glyph: 'disc' },
    aliases: ['ps3', 'playstation 3', 'rpcs3'],
    knownEmulators: ['RPCS3']
  },
  {
    id: 'sony-playstation-4',
    name: 'PlayStation 4',
    shortName: 'PS4',
    manufacturer: 'Sony',
    generation: 8,
    releaseYear: 2013,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#12365e', to: '#2f76c4', ink: '#eff6ff', glyph: 'disc' },
    aliases: ['ps4', 'playstation 4', 'orbis'],
    knownEmulators: ['shadPS4', 'fpPS4']
  },
  {
    id: 'sony-playstation-5',
    name: 'PlayStation 5',
    shortName: 'PS5',
    manufacturer: 'Sony',
    generation: 9,
    releaseYear: 2020,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#e8ecf3', to: '#8fa8c8', ink: '#16202e', glyph: 'tower' },
    aliases: ['ps5', 'playstation 5'],
    knownEmulators: []
  },
  {
    id: 'sony-psp',
    name: 'PlayStation Portable',
    shortName: 'PSP',
    manufacturer: 'Sony',
    generation: 7,
    releaseYear: 2004,
    formFactor: 'handheld',
    media: 'disc',
    artwork: { from: '#22262e', to: '#5c6577', ink: '#f2f4f8', glyph: 'handheld' },
    aliases: ['psp', 'playstation portable', 'umd'],
    knownEmulators: ['PPSSPP']
  },
  {
    id: 'sony-ps-vita',
    name: 'PlayStation Vita',
    shortName: 'PS Vita',
    manufacturer: 'Sony',
    generation: 8,
    releaseYear: 2011,
    formFactor: 'handheld',
    media: 'card',
    artwork: { from: '#1a1d24', to: '#3f7fd8', ink: '#eff5ff', glyph: 'handheld' },
    aliases: ['vita', 'psvita', 'playstation vita'],
    knownEmulators: ['Vita3K']
  },

  /* ---------------------------------------------------------------- */
  /* Sega                                                              */
  /* ---------------------------------------------------------------- */
  {
    id: 'sega-master-system',
    name: 'Sega Master System',
    shortName: 'Master System',
    manufacturer: 'Sega',
    generation: 3,
    releaseYear: 1985,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#1f2329', to: '#4b5563', ink: '#f4f6f8', glyph: 'cartridge' },
    aliases: ['sms', 'master system', 'mark iii'],
    knownEmulators: ['Emulicious', 'Kega Fusion', 'BlastEm', 'RetroArch']
  },
  {
    id: 'sega-genesis',
    name: 'Sega Genesis / Mega Drive',
    shortName: 'Genesis',
    manufacturer: 'Sega',
    generation: 4,
    releaseYear: 1988,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#16181d', to: '#3d6bd4', ink: '#eef2ff', glyph: 'cartridge' },
    aliases: ['mega drive', 'megadrive', 'genesis', 'md', 'sega 16-bit'],
    knownEmulators: ['BlastEm', 'Kega Fusion', 'Genesis Plus GX', 'Exodus']
  },
  {
    id: 'sega-cd',
    name: 'Sega CD / Mega CD',
    shortName: 'Sega CD',
    manufacturer: 'Sega',
    generation: 4,
    releaseYear: 1991,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#1b1f27', to: '#7a5fd3', ink: '#f3f0ff', glyph: 'disc' },
    aliases: ['mega cd', 'segacd', 'sega cd'],
    knownEmulators: ['Kega Fusion', 'Genesis Plus GX', 'Ares']
  },
  {
    id: 'sega-32x',
    name: 'Sega 32X',
    shortName: '32X',
    manufacturer: 'Sega',
    generation: 4,
    releaseYear: 1994,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#20232a', to: '#c4472f', ink: '#fff2ef', glyph: 'cartridge' },
    aliases: ['32x', 'mega drive 32x', 'mushroom'],
    knownEmulators: ['Kega Fusion', 'PicoDrive', 'Ares']
  },
  {
    id: 'sega-saturn',
    name: 'Sega Saturn',
    shortName: 'Saturn',
    manufacturer: 'Sega',
    generation: 5,
    releaseYear: 1994,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#242833', to: '#5f6b8c', ink: '#f2f4fa', glyph: 'disc' },
    aliases: ['saturn', 'ss'],
    knownEmulators: ['Mednafen', 'SSF', 'Kronos', 'Yabause']
  },
  {
    id: 'sega-dreamcast',
    name: 'Sega Dreamcast',
    shortName: 'Dreamcast',
    manufacturer: 'Sega',
    generation: 6,
    releaseYear: 1998,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#e9eef3', to: '#e2643c', ink: '#20262d', glyph: 'disc' },
    aliases: ['dc', 'dreamcast', 'gd-rom'],
    knownEmulators: ['Flycast', 'redream', 'DEmul']
  },
  {
    id: 'sega-game-gear',
    name: 'Sega Game Gear',
    shortName: 'Game Gear',
    manufacturer: 'Sega',
    generation: 4,
    releaseYear: 1990,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#1d2026', to: '#5b6270', ink: '#f4f6f9', glyph: 'handheld' },
    aliases: ['gg', 'game gear'],
    knownEmulators: ['Emulicious', 'Kega Fusion', 'Genesis Plus GX']
  },
  {
    id: 'sega-sg-1000',
    name: 'Sega SG-1000',
    shortName: 'SG-1000',
    manufacturer: 'Sega',
    generation: 3,
    releaseYear: 1983,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#2b2f36', to: '#b23a48', ink: '#fff1f3', glyph: 'cartridge' },
    aliases: ['sg1000', 'sg-1000'],
    knownEmulators: ['Kega Fusion', 'BlueMSX', 'RetroArch']
  },

  /* ---------------------------------------------------------------- */
  /* Microsoft                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'microsoft-xbox',
    name: 'Xbox',
    shortName: 'Xbox',
    manufacturer: 'Microsoft',
    generation: 6,
    releaseYear: 2001,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#14361d', to: '#3f9a4a', ink: '#f0fff2', glyph: 'disc' },
    aliases: ['xbox', 'original xbox', 'xbox classic'],
    knownEmulators: ['xemu', 'Cxbx-Reloaded']
  },
  {
    id: 'microsoft-xbox-360',
    name: 'Xbox 360',
    shortName: 'Xbox 360',
    manufacturer: 'Microsoft',
    generation: 7,
    releaseYear: 2005,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#e6ebe8', to: '#69b544', ink: '#1b2a1e', glyph: 'disc' },
    aliases: ['360', 'xbox360', 'xenon'],
    knownEmulators: ['Xenia']
  },
  {
    id: 'microsoft-xbox-one',
    name: 'Xbox One',
    shortName: 'Xbox One',
    manufacturer: 'Microsoft',
    generation: 8,
    releaseYear: 2013,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#15181b', to: '#4c9a52', ink: '#f1fbf2', glyph: 'disc' },
    aliases: ['xbone', 'xbox one', 'durango'],
    knownEmulators: []
  },
  {
    id: 'microsoft-xbox-series',
    name: 'Xbox Series X|S',
    shortName: 'Xbox Series',
    manufacturer: 'Microsoft',
    generation: 9,
    releaseYear: 2020,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#101315', to: '#2f7d3b', ink: '#effaf0', glyph: 'tower' },
    aliases: ['series x', 'series s', 'xbox series'],
    knownEmulators: []
  },

  /* ---------------------------------------------------------------- */
  /* Atari                                                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'atari-2600',
    name: 'Atari 2600',
    shortName: 'Atari 2600',
    manufacturer: 'Atari',
    generation: 2,
    releaseYear: 1977,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#5b3a1e', to: '#c98a3e', ink: '#fff8ee', glyph: 'cartridge' },
    aliases: ['vcs', '2600', 'atari vcs'],
    knownEmulators: ['Stella', 'RetroArch', 'Gopher2600']
  },
  {
    id: 'atari-5200',
    name: 'Atari 5200',
    shortName: 'Atari 5200',
    manufacturer: 'Atari',
    generation: 2,
    releaseYear: 1982,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#2a2622', to: '#8c6f4a', ink: '#fdf6ec', glyph: 'cartridge' },
    aliases: ['5200', 'supersystem'],
    knownEmulators: ['Altirra', 'Atari800', 'RetroArch']
  },
  {
    id: 'atari-7800',
    name: 'Atari 7800',
    shortName: 'Atari 7800',
    manufacturer: 'Atari',
    generation: 3,
    releaseYear: 1986,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#1f2a35', to: '#c0453a', ink: '#fff2f0', glyph: 'cartridge' },
    aliases: ['7800', 'prosystem'],
    knownEmulators: ['A7800', 'ProSystem', 'RetroArch']
  },
  {
    id: 'atari-lynx',
    name: 'Atari Lynx',
    shortName: 'Lynx',
    manufacturer: 'Atari',
    generation: 4,
    releaseYear: 1989,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#22262b', to: '#c8952f', ink: '#fff8e9', glyph: 'handheld' },
    aliases: ['lynx', 'handy'],
    knownEmulators: ['Mednafen', 'Handy', 'RetroArch']
  },
  {
    id: 'atari-jaguar',
    name: 'Atari Jaguar',
    shortName: 'Jaguar',
    manufacturer: 'Atari',
    generation: 5,
    releaseYear: 1993,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#181b1f', to: '#b8332b', ink: '#fff1ef', glyph: 'cartridge' },
    aliases: ['jaguar', 'jag', 'jaguar cd'],
    knownEmulators: ['BigPEmu', 'Virtual Jaguar', 'Phoenix']
  },
  {
    id: 'atari-st',
    name: 'Atari ST',
    shortName: 'Atari ST',
    manufacturer: 'Atari',
    generation: null,
    releaseYear: 1985,
    formFactor: 'computer',
    media: 'disc',
    artwork: { from: '#3b3f46', to: '#9aa2ad', ink: '#f7f9fb', glyph: 'keyboard' },
    aliases: ['st', 'atari st', 'ste', 'falcon'],
    knownEmulators: ['Hatari', 'Steem SSE']
  },

  /* ---------------------------------------------------------------- */
  /* SNK / NEC / other console makers                                  */
  /* ---------------------------------------------------------------- */
  {
    id: 'snk-neo-geo',
    name: 'Neo Geo AES',
    shortName: 'Neo Geo',
    manufacturer: 'SNK',
    generation: 4,
    releaseYear: 1990,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#1a1c21', to: '#d8b23c', ink: '#fffaeb', glyph: 'cartridge' },
    aliases: ['neogeo', 'aes', 'neo-geo', 'neo geo'],
    knownEmulators: ['FinalBurn Neo', 'MAME', 'Kawaks']
  },
  {
    id: 'snk-neo-geo-mvs',
    name: 'Neo Geo MVS',
    shortName: 'Neo Geo MVS',
    manufacturer: 'SNK',
    generation: 4,
    releaseYear: 1990,
    formFactor: 'arcade',
    media: 'cartridge',
    artwork: { from: '#201c17', to: '#c2582c', ink: '#fff3ec', glyph: 'arcade' },
    aliases: ['mvs', 'multi video system', 'neo geo arcade'],
    knownEmulators: ['FinalBurn Neo', 'MAME']
  },
  {
    id: 'snk-neo-geo-pocket',
    name: 'Neo Geo Pocket Color',
    shortName: 'NGPC',
    manufacturer: 'SNK',
    generation: 5,
    releaseYear: 1998,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#1d2733', to: '#3f9fb5', ink: '#effbff', glyph: 'handheld' },
    aliases: ['ngp', 'ngpc', 'neo geo pocket'],
    knownEmulators: ['Mednafen', 'RetroArch', 'NeoPop']
  },
  {
    id: 'nec-turbografx-16',
    name: 'TurboGrafx-16 / PC Engine',
    shortName: 'TurboGrafx-16',
    manufacturer: 'NEC',
    generation: 4,
    releaseYear: 1987,
    formFactor: 'home',
    media: 'card',
    artwork: { from: '#22242a', to: '#d0562f', ink: '#fff3ee', glyph: 'card' },
    aliases: ['pc engine', 'pce', 'tg16', 'turbografx', 'hucard'],
    knownEmulators: ['Mednafen', 'Beetle PCE', 'Ootake']
  },
  {
    id: 'nec-pc-engine-cd',
    name: 'PC Engine CD / TurboGrafx-CD',
    shortName: 'PC Engine CD',
    manufacturer: 'NEC',
    generation: 4,
    releaseYear: 1988,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#23262d', to: '#6f7fd6', ink: '#f1f3ff', glyph: 'disc' },
    aliases: ['turbo cd', 'super cd-rom', 'pce cd', 'turboduo'],
    knownEmulators: ['Mednafen', 'Beetle PCE', 'Ootake']
  },
  {
    id: 'panasonic-3do',
    name: '3DO Interactive Multiplayer',
    shortName: '3DO',
    manufacturer: 'Panasonic',
    generation: 5,
    releaseYear: 1993,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#1d2024', to: '#8a919c', ink: '#f6f8fa', glyph: 'disc' },
    aliases: ['3do', 'fz-1', 'panasonic 3do'],
    knownEmulators: ['Opera', '4DO', 'Phoenix']
  },
  {
    id: 'philips-cd-i',
    name: 'Philips CD-i',
    shortName: 'CD-i',
    manufacturer: 'Philips',
    generation: 4,
    releaseYear: 1991,
    formFactor: 'home',
    media: 'disc',
    artwork: { from: '#1b1e24', to: '#4f7f9c', ink: '#f0f7fb', glyph: 'disc' },
    aliases: ['cdi', 'cd-i', 'compact disc interactive'],
    knownEmulators: ['CD-i Emulator', 'MAME']
  },
  {
    id: 'bandai-wonderswan',
    name: 'Bandai WonderSwan Color',
    shortName: 'WonderSwan',
    manufacturer: 'Bandai',
    generation: 5,
    releaseYear: 1999,
    formFactor: 'handheld',
    media: 'cartridge',
    artwork: { from: '#2b2f38', to: '#c9a05c', ink: '#fff8ec', glyph: 'handheld' },
    aliases: ['ws', 'wsc', 'wonderswan'],
    knownEmulators: ['Mednafen', 'RetroArch', 'Ares']
  },
  {
    id: 'coleco-colecovision',
    name: 'ColecoVision',
    shortName: 'ColecoVision',
    manufacturer: 'Coleco',
    generation: 2,
    releaseYear: 1982,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#22262d', to: '#b4483f', ink: '#fff2f0', glyph: 'cartridge' },
    aliases: ['coleco', 'colecovision', 'cv'],
    knownEmulators: ['BlueMSX', 'MAME', 'RetroArch']
  },
  {
    id: 'mattel-intellivision',
    name: 'Intellivision',
    shortName: 'Intellivision',
    manufacturer: 'Mattel',
    generation: 2,
    releaseYear: 1979,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#31281d', to: '#a8823f', ink: '#fff8ea', glyph: 'cartridge' },
    aliases: ['intv', 'intellivision'],
    knownEmulators: ['jzIntv', 'Nostalgia', 'MAME']
  },
  {
    id: 'magnavox-odyssey-2',
    name: 'Magnavox Odyssey²',
    shortName: 'Odyssey²',
    manufacturer: 'Magnavox',
    generation: 2,
    releaseYear: 1978,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#26221c', to: '#7e6a4a', ink: '#fdf8ef', glyph: 'keyboard' },
    aliases: ['odyssey 2', 'videopac', 'o2'],
    knownEmulators: ['O2EM', 'MAME', 'RetroArch']
  },
  {
    id: 'gce-vectrex',
    name: 'Vectrex',
    shortName: 'Vectrex',
    manufacturer: 'GCE',
    generation: 2,
    releaseYear: 1982,
    formFactor: 'home',
    media: 'cartridge',
    artwork: { from: '#12151b', to: '#4b6ea8', ink: '#eef4ff', glyph: 'arcade' },
    aliases: ['vectrex', 'vector'],
    knownEmulators: ['ParaJVE', 'MAME', 'RetroArch']
  },

  /* ---------------------------------------------------------------- */
  /* Home computers & arcade                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'commodore-64',
    name: 'Commodore 64',
    shortName: 'C64',
    manufacturer: 'Commodore',
    generation: null,
    releaseYear: 1982,
    formFactor: 'computer',
    media: 'tape',
    artwork: { from: '#3d3a33', to: '#9c8d6f', ink: '#fdfaf2', glyph: 'keyboard' },
    aliases: ['c64', 'commodore 64', 'cbm'],
    knownEmulators: ['VICE', 'Hoxs64', 'Denise']
  },
  {
    id: 'commodore-amiga',
    name: 'Commodore Amiga',
    shortName: 'Amiga',
    manufacturer: 'Commodore',
    generation: null,
    releaseYear: 1985,
    formFactor: 'computer',
    media: 'disc',
    artwork: { from: '#2c2f38', to: '#d2593f', ink: '#fff3ef', glyph: 'keyboard' },
    aliases: ['amiga', 'a500', 'a1200', 'aga'],
    knownEmulators: ['WinUAE', 'FS-UAE', 'Amiberry']
  },
  {
    id: 'sinclair-zx-spectrum',
    name: 'ZX Spectrum',
    shortName: 'ZX Spectrum',
    manufacturer: 'Sinclair',
    generation: null,
    releaseYear: 1982,
    formFactor: 'computer',
    media: 'tape',
    artwork: { from: '#17191d', to: '#c4324a', ink: '#fff0f2', glyph: 'keyboard' },
    aliases: ['spectrum', 'zx', 'speccy'],
    knownEmulators: ['Fuse', 'ZEsarUX', 'Spectaculator']
  },
  {
    id: 'msx',
    name: 'MSX',
    shortName: 'MSX',
    manufacturer: 'Multiple',
    generation: null,
    releaseYear: 1983,
    formFactor: 'computer',
    media: 'mixed',
    artwork: { from: '#1d2229', to: '#3f7f8c', ink: '#eefbff', glyph: 'keyboard' },
    aliases: ['msx2', 'msx turbo r', 'msx'],
    knownEmulators: ['openMSX', 'BlueMSX']
  },
  {
    id: 'amstrad-cpc',
    name: 'Amstrad CPC',
    shortName: 'Amstrad CPC',
    manufacturer: 'Amstrad',
    generation: null,
    releaseYear: 1984,
    formFactor: 'computer',
    media: 'tape',
    artwork: { from: '#26231d', to: '#8f7a3f', ink: '#fdf8e9', glyph: 'keyboard' },
    aliases: ['cpc', 'cpc464', 'amstrad'],
    knownEmulators: ['WinAPE', 'Caprice32', 'Arnold']
  },
  {
    id: 'sharp-x68000',
    name: 'Sharp X68000',
    shortName: 'X68000',
    manufacturer: 'Sharp',
    generation: null,
    releaseYear: 1987,
    formFactor: 'computer',
    media: 'disc',
    artwork: { from: '#22252b', to: '#616b7d', ink: '#f4f6fa', glyph: 'tower' },
    aliases: ['x68k', 'x68000', 'sharp'],
    knownEmulators: ['XM6 Pro-68k', 'MAME', 'PX68k']
  },
  {
    id: 'ms-dos',
    name: 'MS-DOS',
    shortName: 'DOS',
    manufacturer: 'Microsoft',
    generation: null,
    releaseYear: 1981,
    formFactor: 'computer',
    media: 'disc',
    artwork: { from: '#14171c', to: '#4a5563', ink: '#eef2f7', glyph: 'keyboard' },
    aliases: ['dos', 'pc dos', 'dosbox'],
    knownEmulators: ['DOSBox-X', 'DOSBox Staging', 'DOSBox']
  },
  {
    id: 'arcade',
    name: 'Arcade',
    shortName: 'Arcade',
    manufacturer: 'Multiple',
    generation: null,
    releaseYear: 1971,
    formFactor: 'arcade',
    media: 'mixed',
    artwork: { from: '#241a2e', to: '#8a4bd4', ink: '#f7f0ff', glyph: 'arcade' },
    aliases: ['mame', 'coin-op', 'cabinet', 'fbneo'],
    knownEmulators: ['MAME', 'FinalBurn Neo', 'Supermodel', 'Demul']
  }
]

/** Catalog indexed by id for O(1) lookups. */
export const CONSOLE_BY_ID: ReadonlyMap<string, ConsoleDefinition> = new Map(
  CONSOLE_CATALOG.map((entry) => [entry.id, entry])
)

export function getConsoleDefinition(consoleId: string): ConsoleDefinition | undefined {
  return CONSOLE_BY_ID.get(consoleId)
}

/** Distinct manufacturers, alphabetically, for filter controls. */
export function listManufacturers(): string[] {
  return [...new Set(CONSOLE_CATALOG.map((c) => c.manufacturer))].sort((a, b) => a.localeCompare(b))
}

/** Distinct generations present in the catalog, ascending. */
export function listGenerations(): number[] {
  return [...new Set(CONSOLE_CATALOG.map((c) => c.generation).filter((g): g is number => g !== null))].sort(
    (a, b) => a - b
  )
}
