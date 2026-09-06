import { app, shell } from 'electron'
import path from 'node:path'
import type { AppError, UpdateProgress, UpdateState } from '@shared/types'
import { IpcEvent } from '@shared/ipc'
import { UPDATE_RELEASES_PAGE_URL, isNewerVersion } from '@shared/updates'
import { UserFacingError, toResult } from '../errors'
import type { WindowManager } from '../window'
import {
  describeRelease,
  downloadAsset,
  fetchLatestRelease,
  findAsset,
  launchInstaller,
  pruneDownloads,
  type LatestRelease
} from './updater'

/** How often progress is pushed to the interface while a download runs. */
const PROGRESS_INTERVAL_MS = 120
/** Long enough for the install reply to reach the interface before quitting. */
const QUIT_DELAY_MS = 400

export interface UpdateControllerOptions {
  windows: WindowManager
  /** The version running right now. */
  currentVersion: string
  /** Folder EmuHub downloads into. Nothing outside it is ever written or run. */
  directory: string
  platform: string
  arch: string
}

/**
 * Owns the update flow for the whole application.
 *
 * The main process holds the state rather than the renderer, so a check or a
 * download is unaffected by the interface reloading, and every move is
 * broadcast as one `UpdateState` the interface simply renders. Only one check
 * or download runs at a time.
 */
export class UpdateController {
  private readonly options: UpdateControllerOptions
  private state: UpdateState
  /** The release behind the current state, kept so a download can find its file. */
  private latest: LatestRelease | null = null
  private inFlight: AbortController | null = null
  private lastProgressAt = 0

  constructor(options: UpdateControllerOptions) {
    this.options = options
    this.state = {
      stage: 'idle',
      currentVersion: options.currentVersion,
      release: null,
      progress: null,
      download: null,
      error: null,
      checkedAt: null
    }
  }

  getState(): UpdateState {
    return this.state
  }

  /**
   * Looks for a newer release. Failures are recorded in the state rather than
   * thrown at startup: an update check that cannot reach the network is not a
   * reason to interrupt someone opening their library.
   */
  async check(): Promise<UpdateState> {
    // Nothing to learn while a check or download is under way, and an update
    // already downloaded stays the one on offer until it is installed.
    if (this.state.stage === 'checking' || this.state.stage === 'downloading' || this.state.stage === 'ready') {
      return this.state
    }

    const controller = new AbortController()
    this.inFlight = controller
    this.patch({ stage: 'checking', error: null, progress: null })

    try {
      const release = await fetchLatestRelease(this.userAgent(), controller.signal)
      this.latest = release
      const checkedAt = new Date().toISOString()

      if (!release.version || !isNewerVersion(release.version, this.options.currentVersion)) {
        return this.patch({ stage: 'up-to-date', release: null, download: null, error: null, checkedAt })
      }

      return this.patch({
        stage: 'available',
        release: describeRelease(release, release.version, this.options.platform, this.options.arch),
        download: null,
        error: null,
        checkedAt
      })
    } catch (error) {
      // The offer is cleared with the failure, so every error the prompt shows
      // is a download that went wrong rather than a check that never landed.
      return this.patch({ stage: 'error', release: null, error: this.describe(error, 'updates:check') })
    } finally {
      if (this.inFlight === controller) this.inFlight = null
    }
  }

  /** Downloads the release found by the last check, reporting progress as it goes. */
  async download(): Promise<UpdateState> {
    if (this.state.stage === 'downloading') return this.state

    const release = this.state.release
    const wanted = release?.asset
    const asset = this.latest && wanted ? findAsset(this.latest, wanted.name) : null

    if (!release || !wanted || !asset) {
      throw new UserFacingError(
        'not-found',
        'There is no update file for this computer in that release.',
        'Open the releases page to download it yourself.'
      )
    }

    const controller = new AbortController()
    this.inFlight = controller
    this.lastProgressAt = 0
    this.patch({
      stage: 'downloading',
      error: null,
      progress: { receivedBytes: 0, totalBytes: wanted.sizeBytes || null, percent: wanted.sizeBytes ? 0 : null }
    })

    try {
      const filePath = await downloadAsset({
        asset,
        directory: this.options.directory,
        userAgent: this.userAgent(),
        signal: controller.signal,
        onProgress: (receivedBytes, totalBytes) => this.reportProgress(receivedBytes, totalBytes)
      })

      return this.patch({
        stage: 'ready',
        progress: null,
        error: null,
        download: { filePath, installable: wanted.installable }
      })
    } catch (error) {
      // Cancelling is something the user asked for, not a failure to report:
      // the update stays on offer exactly as it was.
      if (controller.signal.aborted) return this.patch({ stage: 'available', progress: null, error: null })
      return this.patch({ stage: 'error', progress: null, error: this.describe(error, 'updates:download') })
    } finally {
      if (this.inFlight === controller) this.inFlight = null
    }
  }

  /** Stops a running download. The partial file is discarded by the downloader. */
  cancel(): UpdateState {
    this.inFlight?.abort()
    this.inFlight = null
    return this.state
  }

  /**
   * Starts the downloaded installer and closes EmuHub so it can replace the
   * files it is running from.
   */
  async install(): Promise<boolean> {
    const download = this.state.download
    if (!download) {
      throw new UserFacingError('not-found', 'There is no downloaded update to install yet.')
    }

    await launchInstaller(download.filePath, this.options.directory)

    setTimeout(() => {
      this.options.windows.markQuitting()
      app.quit()
    }, QUIT_DELAY_MS)
    return true
  }

  /** Shows the downloaded file in the user's file manager. */
  reveal(): boolean {
    const download = this.state.download
    if (!download) {
      throw new UserFacingError('not-found', 'There is no downloaded update to show yet.')
    }
    shell.showItemInFolder(download.filePath)
    return true
  }

  /** Opens the release in the user's browser, for updates EmuHub cannot fetch. */
  async openReleasePage(): Promise<boolean> {
    const candidate = this.state.release?.releaseUrl ?? ''
    // The URL comes from the update server, so it is only used when it really
    // is a GitHub release page; otherwise the known releases page is opened.
    const url = isGithubUrl(candidate) ? candidate : UPDATE_RELEASES_PAGE_URL
    await shell.openExternal(url)
    return true
  }

  /**
   * Clears downloads left behind by earlier runs. Called once at startup, so a
   * cancelled or already-installed update never sits in the folder for good.
   */
  async pruneOldDownloads(): Promise<void> {
    await pruneDownloads(this.options.directory, null).catch(() => undefined)
  }

  dispose(): void {
    this.inFlight?.abort()
    this.inFlight = null
  }

  private userAgent(): string {
    return `EmuHub/${this.options.currentVersion} (+https://github.com/MacieiraPT/EmuHub)`
  }

  private reportProgress(receivedBytes: number, totalBytes: number | null): void {
    const complete = totalBytes !== null && receivedBytes >= totalBytes
    const now = Date.now()
    // Progress arrives per network chunk; the interface only needs a readable
    // rate, and the final frame always gets through.
    if (!complete && now - this.lastProgressAt < PROGRESS_INTERVAL_MS) return
    this.lastProgressAt = now

    const progress: UpdateProgress = {
      receivedBytes,
      totalBytes,
      percent: totalBytes && totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : null
    }
    this.patch({ progress })
  }

  private patch(changes: Partial<UpdateState>): UpdateState {
    this.state = { ...this.state, ...changes }
    this.options.windows.send(IpcEvent.updateStateChanged, this.state)
    return this.state
  }

  /** Turns anything thrown into the same readable shape the IPC layer uses. */
  private describe(error: unknown, context: string): AppError {
    const result = toResult(error, context)
    return result.ok ? { code: 'unknown', message: 'Something went wrong.' } : result.error
  }
}

function isGithubUrl(candidate: string): boolean {
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' && (url.hostname === 'github.com' || url.hostname.endsWith('.github.com'))
  } catch {
    return false
  }
}

/** Where downloads are kept: a folder EmuHub owns, inside its configuration. */
export function updateDownloadDirectory(configDirectory: string): string {
  return path.join(configDirectory, 'updates')
}
