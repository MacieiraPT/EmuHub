import { randomUUID } from 'node:crypto'
import path from 'node:path'
import type {
  AddConsoleInput,
  BackupImportMode,
  ConfiguredConsole,
  EmulatorProfile,
  LibraryData,
  SetEmulatorInput,
  UpdateConsoleInput
} from '@shared/types'
import { createDefaultLibraryData, LIBRARY_SCHEMA_VERSION } from '@shared/defaults'
import { getConsoleDefinition } from '@shared/data/consoles'
import { deriveEmulatorName } from '@shared/library'
import { UserFacingError } from '../errors'
import { JsonStore } from './jsonStore'
import { inspectExecutable, verifyExecutable } from './executables'

const nowIso = (): string => new Date().toISOString()

export interface BulkAddResult {
  added: ConfiguredConsole[]
  /** Consoles that could not be added, with a message safe to show. */
  rejected: { consoleId: string; reason: string }[]
}

function createEntry(consoleId: string, displayName: string | null, emulators: EmulatorProfile[]): ConfiguredConsole {
  const timestamp = nowIso()
  return {
    id: randomUUID(),
    consoleId,
    displayName: displayName?.trim() || null,
    emulators,
    activeEmulatorId: emulators[0]?.id ?? null,
    addedAt: timestamp,
    updatedAt: timestamp,
    lastLaunchedAt: null,
    launchCount: 0,
    favorite: false,
    metadata: {}
  }
}

/** Owns every read and write of the user's console library. */
export class LibraryRepository {
  private readonly store: JsonStore<LibraryData>

  constructor(configDirectory: string) {
    this.store = new JsonStore<LibraryData>({
      filePath: path.join(configDirectory, 'library.json'),
      createDefault: createDefaultLibraryData,
      migrate: migrateLibrary
    })
  }

  get filePath(): string {
    return this.store.filePath
  }

  load() {
    return this.store.load()
  }

  async list(): Promise<ConfiguredConsole[]> {
    const data = await this.store.read()
    return data.consoles
  }

  async get(id: string): Promise<ConfiguredConsole> {
    const consoles = await this.list()
    const entry = consoles.find((item) => item.id === id)
    if (!entry) {
      throw new UserFacingError('not-found', 'That console is no longer part of your library.')
    }
    return entry
  }

  async add(input: AddConsoleInput): Promise<ConfiguredConsole> {
    const definition = getConsoleDefinition(input.consoleId)
    if (!definition) {
      throw new UserFacingError('invalid-path', 'That console is not recognised by EmuHub.')
    }

    const existing = await this.list()
    if (existing.some((entry) => entry.consoleId === input.consoleId)) {
      throw new UserFacingError(
        'duplicate',
        `${definition.name} is already in your library.`,
        'Open it from your library to change its emulator.'
      )
    }

    const timestamp = nowIso()
    let emulators: EmulatorProfile[] = []

    if (input.executablePath) {
      const info = await inspectExecutable(input.executablePath)
      emulators = [
        {
          id: randomUUID(),
          name: input.emulatorName?.trim() || deriveEmulatorName(info.path, definition),
          executablePath: info.path,
          args: [],
          workingDirectory: null,
          addedAt: timestamp,
          updatedAt: timestamp
        }
      ]
    }

    const entry = createEntry(definition.id, input.displayName ?? null, emulators)

    await this.store.update((data) => ({ ...data, consoles: [...data.consoles, entry] }))
    return entry
  }

  /**
   * Adds several consoles in one pass.
   *
   * First-run setup and "add console" both submit a batch. Doing it as one
   * store update means a single file write and a single change broadcast
   * instead of one of each per console, which is what made adding five
   * consoles feel slower than adding one.
   */
  async addMany(inputs: AddConsoleInput[]): Promise<BulkAddResult> {
    const existing = await this.list()
    const taken = new Set(existing.map((entry) => entry.consoleId))
    const added: ConfiguredConsole[] = []
    const rejected: BulkAddResult['rejected'] = []

    for (const input of inputs) {
      const definition = getConsoleDefinition(input.consoleId)
      if (!definition) {
        rejected.push({ consoleId: input.consoleId, reason: 'That console is not recognised by EmuHub.' })
        continue
      }
      if (taken.has(definition.id)) {
        rejected.push({ consoleId: input.consoleId, reason: `${definition.name} is already in your library.` })
        continue
      }

      let emulators: EmulatorProfile[] = []
      if (input.executablePath) {
        try {
          const info = await inspectExecutable(input.executablePath)
          const stamp = nowIso()
          emulators = [
            {
              id: randomUUID(),
              name: input.emulatorName?.trim() || deriveEmulatorName(info.path, definition),
              executablePath: info.path,
              args: [],
              workingDirectory: null,
              addedAt: stamp,
              updatedAt: stamp
            }
          ]
        } catch (error) {
          // The console is still worth adding; the user can point it at an
          // emulator later from the library.
          rejected.push({
            consoleId: input.consoleId,
            reason: error instanceof Error ? error.message : 'That emulator file could not be used.'
          })
        }
      }

      taken.add(definition.id)
      added.push(createEntry(definition.id, input.displayName ?? null, emulators))
    }

    if (added.length > 0) {
      await this.store.update((data) => ({ ...data, consoles: [...data.consoles, ...added] }))
    }
    return { added, rejected }
  }

  async update(input: UpdateConsoleInput): Promise<ConfiguredConsole> {
    await this.get(input.id)
    const data = await this.store.update((current) => ({
      ...current,
      consoles: current.consoles.map((entry) =>
        entry.id === input.id
          ? {
              ...entry,
              displayName: input.displayName === undefined ? entry.displayName : input.displayName,
              favorite: input.favorite ?? entry.favorite,
              metadata: input.metadata ? { ...entry.metadata, ...input.metadata } : entry.metadata,
              updatedAt: nowIso()
            }
          : entry
      )
    }))
    return data.consoles.find((entry) => entry.id === input.id) as ConfiguredConsole
  }

  /**
   * Points a console at an emulator executable. Replaces the active profile so
   * the common "one emulator per console" case stays simple, while the model
   * keeps room for several profiles per console.
   */
  async setEmulator(input: SetEmulatorInput): Promise<ConfiguredConsole> {
    const entry = await this.get(input.consoleEntryId)
    const definition = getConsoleDefinition(entry.consoleId)
    const info = await verifyExecutable(input.executablePath)
    const timestamp = nowIso()

    const activeId = entry.activeEmulatorId ?? entry.emulators[0]?.id ?? null
    const profile: EmulatorProfile = {
      id: activeId ?? randomUUID(),
      name: input.emulatorName?.trim() || deriveEmulatorName(info.path, definition),
      executablePath: info.path,
      args: Array.isArray(input.args) ? input.args : [],
      workingDirectory: null,
      addedAt: entry.emulators.find((e) => e.id === activeId)?.addedAt ?? timestamp,
      updatedAt: timestamp
    }

    const emulators = activeId
      ? entry.emulators.map((item) => (item.id === activeId ? profile : item))
      : [...entry.emulators, profile]

    const data = await this.store.update((current) => ({
      ...current,
      consoles: current.consoles.map((item) =>
        item.id === entry.id
          ? { ...item, emulators, activeEmulatorId: profile.id, updatedAt: timestamp }
          : item
      )
    }))
    return data.consoles.find((item) => item.id === entry.id) as ConfiguredConsole
  }

  /** Records a successful launch. Never blocks the launch itself. */
  async recordLaunch(id: string): Promise<ConfiguredConsole | null> {
    const data = await this.store.update((current) => ({
      ...current,
      consoles: current.consoles.map((entry) =>
        entry.id === id
          ? { ...entry, lastLaunchedAt: nowIso(), launchCount: entry.launchCount + 1 }
          : entry
      )
    }))
    return data.consoles.find((entry) => entry.id === id) ?? null
  }

  /** Removes the EmuHub entry only — the emulator itself is never touched. */
  async remove(id: string): Promise<void> {
    await this.get(id)
    await this.store.update((current) => ({
      ...current,
      consoles: current.consoles.filter((entry) => entry.id !== id)
    }))
  }

  async clear(): Promise<void> {
    await this.store.update((current) => ({ ...current, consoles: [] }))
  }

  /**
   * Applies console entries read from a backup. `replace` swaps the library for
   * the backup, `merge` keeps what is already configured and adds only the
   * consoles that are missing. Entry ids are regenerated so a restored entry
   * can never collide with one already in the library, and a console can still
   * only appear once — the same rule `add` enforces.
   */
  async restore(
    consoles: ConfiguredConsole[],
    mode: BackupImportMode
  ): Promise<{ imported: number; skippedDuplicates: number }> {
    const taken = new Set(mode === 'merge' ? (await this.list()).map((entry) => entry.consoleId) : [])
    const accepted: ConfiguredConsole[] = []
    let skippedDuplicates = 0

    for (const entry of consoles) {
      if (taken.has(entry.consoleId)) {
        skippedDuplicates += 1
        continue
      }
      taken.add(entry.consoleId)
      accepted.push({ ...entry, id: randomUUID() })
    }

    await this.store.update((current) => ({
      ...current,
      consoles: mode === 'merge' ? [...current.consoles, ...accepted] : accepted
    }))
    return { imported: accepted.length, skippedDuplicates }
  }
}

/**
 * Accepts any previously written document and returns it in the current shape.
 * Unknown or partial records are repaired rather than dropped so a library
 * written by an older build keeps working after an update.
 */
function migrateLibrary(raw: unknown): LibraryData | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Partial<LibraryData>
  if (!Array.isArray(source.consoles)) return null

  const consoles = source.consoles
    .map(normalizeConsoleEntry)
    .filter((entry): entry is ConfiguredConsole => entry !== null)

  return { schemaVersion: LIBRARY_SCHEMA_VERSION, consoles }
}

/**
 * Repairs one console entry from any source — the store on disk or a backup
 * file — into the current shape. Returns `null` only when the record carries
 * nothing usable.
 */
export function normalizeConsoleEntry(value: unknown): ConfiguredConsole | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const consoleId = typeof raw.consoleId === 'string' ? raw.consoleId : null
  if (!consoleId) return null

  const emulators = Array.isArray(raw.emulators)
    ? raw.emulators.map(normalizeEmulator).filter((item): item is EmulatorProfile => item !== null)
    : []
  const timestamp = typeof raw.addedAt === 'string' ? raw.addedAt : nowIso()
  const activeEmulatorId =
    typeof raw.activeEmulatorId === 'string' && emulators.some((e) => e.id === raw.activeEmulatorId)
      ? raw.activeEmulatorId
      : (emulators[0]?.id ?? null)

  return {
    id: typeof raw.id === 'string' ? raw.id : randomUUID(),
    consoleId,
    displayName: typeof raw.displayName === 'string' ? raw.displayName : null,
    emulators,
    activeEmulatorId,
    addedAt: timestamp,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : timestamp,
    lastLaunchedAt: typeof raw.lastLaunchedAt === 'string' ? raw.lastLaunchedAt : null,
    launchCount: typeof raw.launchCount === 'number' && raw.launchCount >= 0 ? raw.launchCount : 0,
    favorite: raw.favorite === true,
    metadata: isPlainObject(raw.metadata) ? raw.metadata : {}
  }
}

function normalizeEmulator(value: unknown): EmulatorProfile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.executablePath !== 'string' || raw.executablePath.trim().length === 0) return null
  const timestamp = typeof raw.addedAt === 'string' ? raw.addedAt : nowIso()

  return {
    id: typeof raw.id === 'string' ? raw.id : randomUUID(),
    name: typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name : deriveEmulatorName(raw.executablePath),
    executablePath: raw.executablePath,
    args: Array.isArray(raw.args) ? raw.args.filter((arg): arg is string => typeof arg === 'string') : [],
    workingDirectory: typeof raw.workingDirectory === 'string' ? raw.workingDirectory : null,
    addedAt: timestamp,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : timestamp
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
