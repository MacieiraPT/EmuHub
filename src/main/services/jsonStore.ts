import { promises as fs } from 'node:fs'
import path from 'node:path'
import { UserFacingError } from '../errors'

export interface JsonStoreOptions<T> {
  /** Absolute path of the JSON file. */
  filePath: string
  /** Produces a pristine document when nothing usable is on disk. */
  createDefault: () => T
  /**
   * Validates and, if needed, upgrades a parsed document. Returning `null`
   * marks the document as unusable so recovery kicks in.
   */
  migrate: (raw: unknown) => T | null
}

export interface LoadOutcome<T> {
  data: T
  /** True when the file on disk was unusable and defaults/backup were used. */
  recovered: boolean
  /** Where the unusable file was preserved, if it was. */
  backupPath: string | null
}

/**
 * Small, dependency-free JSON document store built for desktop configuration.
 *
 * - Writes are atomic (temp file + rename) so a crash mid-save cannot truncate
 *   the configuration.
 * - The previous good document is kept as `<name>.bak` and used automatically
 *   when the main file is unreadable.
 * - A corrupt file is never silently discarded: it is moved aside with a
 *   timestamp so the user can recover it.
 * - Unknown fields survive migrations, keeping data usable across updates.
 */
export class JsonStore<T> {
  private readonly options: JsonStoreOptions<T>
  private cache: T | null = null
  private writeQueue: Promise<void> = Promise.resolve()

  constructor(options: JsonStoreOptions<T>) {
    this.options = options
  }

  get filePath(): string {
    return this.options.filePath
  }

  private get backupPath(): string {
    return `${this.options.filePath}.bak`
  }

  async load(): Promise<LoadOutcome<T>> {
    const primary = await this.readFile(this.options.filePath)
    if (primary) {
      this.cache = primary
      return { data: primary, recovered: false, backupPath: null }
    }

    const hadFile = await pathExists(this.options.filePath)
    let quarantinedAt: string | null = null
    if (hadFile) {
      quarantinedAt = await this.quarantine()
    }

    const fromBackup = await this.readFile(this.backupPath)
    if (fromBackup) {
      this.cache = fromBackup
      await this.persist(fromBackup)
      return { data: fromBackup, recovered: true, backupPath: quarantinedAt }
    }

    const fresh = this.options.createDefault()
    this.cache = fresh
    await this.persist(fresh)
    return { data: fresh, recovered: hadFile, backupPath: quarantinedAt }
  }

  /** Current document, loading it from disk on first access. */
  async read(): Promise<T> {
    if (this.cache === null) await this.load()
    return this.cache as T
  }

  /** Applies a change and persists it. Returns the stored document. */
  async update(mutator: (current: T) => T): Promise<T> {
    const current = await this.read()
    const next = mutator(structuredClone(current))
    this.cache = next
    await this.persist(next)
    return next
  }

  async replace(next: T): Promise<T> {
    this.cache = next
    await this.persist(next)
    return next
  }

  private async readFile(target: string): Promise<T | null> {
    try {
      const contents = await fs.readFile(target, 'utf8')
      if (contents.trim().length === 0) return null
      return this.options.migrate(JSON.parse(contents) as unknown)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT') return null
      if (code === 'EACCES' || code === 'EPERM') {
        throw new UserFacingError(
          'permission-denied',
          'EmuHub cannot read its configuration file.',
          `Check the permissions of ${path.dirname(target)}.`
        )
      }
      return null
    }
  }

  /** Moves an unreadable document aside instead of overwriting it. */
  private async quarantine(): Promise<string | null> {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const target = `${this.options.filePath}.corrupt-${stamp}`
    try {
      await fs.rename(this.options.filePath, target)
      return target
    } catch {
      return null
    }
  }

  /** Serialises writes so concurrent updates cannot interleave. */
  private persist(data: T): Promise<void> {
    const run = this.writeQueue.then(() => this.writeAtomic(data))
    this.writeQueue = run.catch(() => undefined)
    return run
  }

  private async writeAtomic(data: T): Promise<void> {
    const dir = path.dirname(this.options.filePath)
    await fs.mkdir(dir, { recursive: true })

    const temp = `${this.options.filePath}.tmp-${process.pid}`
    const payload = `${JSON.stringify(data, null, 2)}\n`

    try {
      await fs.writeFile(temp, payload, { encoding: 'utf8', mode: 0o600 })
      if (await pathExists(this.options.filePath)) {
        await fs.copyFile(this.options.filePath, this.backupPath).catch(() => undefined)
      }
      await fs.rename(temp, this.options.filePath)
    } catch (error) {
      await fs.rm(temp, { force: true }).catch(() => undefined)
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EACCES' || code === 'EPERM') {
        throw new UserFacingError(
          'storage-failed',
          'EmuHub could not save your configuration because the file is not writable.',
          `Check the permissions of ${dir}.`
        )
      }
      if (code === 'ENOSPC') {
        throw new UserFacingError('storage-failed', 'There is not enough free disk space to save your configuration.')
      }
      throw error
    }
  }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}
