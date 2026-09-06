import { promises as fs } from 'node:fs'
import type {
  AppSettings,
  BackupDocument,
  BackupSettings,
  ConfiguredConsole,
  LibraryData
} from '@shared/types'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, LIBRARY_SCHEMA_VERSION } from '@shared/defaults'
import { getConsoleDefinition } from '@shared/data/consoles'
import { UserFacingError } from '../errors'
import { normalizeConsoleEntry } from './libraryRepository'
import { normalizeBackupSettings } from './settingsRepository'

/** A backup file after it has been read, validated and repaired. */
export interface ParsedBackup {
  consoles: ConfiguredConsole[]
  /**
   * Entries this build has no catalog entry for. They are dropped rather than
   * restored: a console EmuHub no longer lists would only be a dead tile.
   */
  unknownConsoles: number
  settings: BackupSettings | null
  exportedAt: string | null
  appVersion: string | null
}

/** Suggested file name for a new backup, e.g. `emuhub-backup-2026-09-06.json`. */
export function suggestBackupFileName(now = new Date()): string {
  const date = now.toISOString().slice(0, 10)
  return `emuhub-backup-${date}.json`
}

export function buildBackup(
  consoles: ConfiguredConsole[],
  settings: AppSettings | null,
  appVersion: string
): BackupDocument {
  const library: LibraryData = { schemaVersion: LIBRARY_SCHEMA_VERSION, consoles }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    library,
    settings: settings ? { general: settings.general, appearance: settings.appearance, library: settings.library } : null
  }
}

export async function writeBackup(filePath: string, document: BackupDocument): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
}

/**
 * Reads a backup the user picked. Anything that is not an EmuHub backup is
 * refused before it can touch the library; a genuine backup written by an
 * older build is repaired the same way the store repairs its own documents.
 */
export async function readBackup(filePath: string): Promise<ParsedBackup> {
  const contents = await fs.readFile(filePath, 'utf8')

  let parsed: unknown
  try {
    parsed = JSON.parse(contents) as unknown
  } catch {
    throw new UserFacingError(
      'invalid-path',
      'That file could not be read as an EmuHub backup.',
      'Choose the .json file EmuHub wrote when you exported your library.'
    )
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new UserFacingError('invalid-path', 'That file is not an EmuHub backup.')
  }

  const document = parsed as Partial<BackupDocument>
  if (document.format !== BACKUP_FORMAT) {
    throw new UserFacingError(
      'invalid-path',
      'That file is not an EmuHub backup.',
      'Choose the .json file EmuHub wrote when you exported your library.'
    )
  }
  if (typeof document.formatVersion === 'number' && document.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new UserFacingError(
      'invalid-path',
      'That backup was written by a newer version of EmuHub.',
      'Update EmuHub, then import it again.'
    )
  }

  const rawConsoles = Array.isArray(document.library)
    ? (document.library as unknown[])
    : Array.isArray(document.library?.consoles)
      ? document.library.consoles
      : null
  if (!rawConsoles) {
    throw new UserFacingError('invalid-path', 'That backup does not contain a library.')
  }

  const repaired = rawConsoles
    .map((entry) => normalizeConsoleEntry(entry))
    .filter((entry): entry is ConfiguredConsole => entry !== null)
  const consoles = repaired.filter((entry) => getConsoleDefinition(entry.consoleId) !== undefined)

  return {
    consoles,
    unknownConsoles: repaired.length - consoles.length,
    settings: document.settings ? normalizeBackupSettings(document.settings) : null,
    exportedAt: typeof document.exportedAt === 'string' ? document.exportedAt : null,
    appVersion: typeof document.appVersion === 'string' ? document.appVersion : null
  }
}
