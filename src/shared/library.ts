import type { ConfiguredConsole, ConsoleDefinition, EmulatorProfile, LibrarySort } from './types'
import { getConsoleDefinition } from './data/consoles'

/** The emulator the Launch button will use, if any. */
export function getActiveEmulator(entry: ConfiguredConsole): EmulatorProfile | null {
  if (entry.emulators.length === 0) return null
  const active = entry.emulators.find((e) => e.id === entry.activeEmulatorId)
  return active ?? entry.emulators[0] ?? null
}

export function isConfigured(entry: ConfiguredConsole): boolean {
  return getActiveEmulator(entry) !== null
}

/** Label shown everywhere in the UI for a library entry. */
export function resolveDisplayName(entry: ConfiguredConsole, definition?: ConsoleDefinition): string {
  if (entry.displayName && entry.displayName.trim().length > 0) return entry.displayName
  const def = definition ?? getConsoleDefinition(entry.consoleId)
  return def?.name ?? entry.consoleId
}

/**
 * Turns an executable file name into a readable emulator name:
 * "PCSX2-qt.exe" -> "PCSX2 Qt", "dolphin-emu" -> "Dolphin Emu".
 */
export function deriveEmulatorName(executablePath: string, definition?: ConsoleDefinition): string {
  const fileName = executablePath.split(/[\\/]/).pop() ?? executablePath
  const base = fileName.replace(/\.(exe|com|bat|cmd|app|appimage|sh|desktop)$/i, '')

  const known = definition?.knownEmulators.find((name) => {
    const normalized = name.replace(/[^a-z0-9]/gi, '').toLowerCase()
    return normalized.length > 2 && base.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(normalized)
  })
  if (known) return known

  const cleaned = base
    .replace(/[_.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length === 0) return fileName

  return cleaned
    .split(' ')
    .map((word) => (/[A-Z]/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

/** Case-insensitive match across console name, manufacturer and aliases. */
export function matchesQuery(definition: ConsoleDefinition, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return true
  const haystack = [
    definition.name,
    definition.shortName,
    definition.manufacturer,
    ...definition.aliases,
    ...definition.knownEmulators,
    definition.generation ? `gen ${definition.generation}` : ''
  ]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((token) => haystack.includes(token))
}

export interface LibraryEntryView {
  entry: ConfiguredConsole
  definition: ConsoleDefinition | undefined
  emulator: EmulatorProfile | null
  displayName: string
}

export function toEntryView(entry: ConfiguredConsole): LibraryEntryView {
  const definition = getConsoleDefinition(entry.consoleId)
  return {
    entry,
    definition,
    emulator: getActiveEmulator(entry),
    displayName: resolveDisplayName(entry, definition)
  }
}

export function sortEntries(views: LibraryEntryView[], sort: LibrarySort): LibraryEntryView[] {
  const sorted = [...views]
  switch (sort) {
    case 'name':
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName))
      break
    case 'manufacturer':
      sorted.sort(
        (a, b) =>
          (a.definition?.manufacturer ?? '').localeCompare(b.definition?.manufacturer ?? '') ||
          a.displayName.localeCompare(b.displayName)
      )
      break
    case 'generation':
      sorted.sort(
        (a, b) =>
          (a.definition?.releaseYear ?? 0) - (b.definition?.releaseYear ?? 0) ||
          a.displayName.localeCompare(b.displayName)
      )
      break
    case 'launches':
      sorted.sort(
        (a, b) =>
          b.entry.launchCount - a.entry.launchCount ||
          (b.entry.lastLaunchedAt ?? '').localeCompare(a.entry.lastLaunchedAt ?? '')
      )
      break
    case 'recent':
    default:
      sorted.sort((a, b) => b.entry.addedAt.localeCompare(a.entry.addedAt))
      break
  }
  return sorted
}

export const SORT_LABELS: Record<LibrarySort, string> = {
  recent: 'Recently added',
  name: 'Name (A–Z)',
  manufacturer: 'Manufacturer',
  generation: 'Release year',
  launches: 'Most launched'
}
