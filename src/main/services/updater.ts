import { createWriteStream, promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import { get as httpsGet } from 'node:https'
import type { IncomingMessage } from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { UserFacingError } from '../errors'
import {
  UPDATE_ALLOWED_HOSTS,
  UPDATE_LATEST_RELEASE_URL,
  isInstallableAsset,
  parseVersion,
  pickReleaseAsset,
  summariseReleaseNotes,
  type ReleaseAsset
} from '@shared/updates'
import type { UpdateRelease } from '@shared/types'

/** How long a request may stall before it is treated as unreachable. */
const REQUEST_TIMEOUT_MS = 15_000
/** GitHub redirects asset downloads to object storage; a couple of hops is plenty. */
const MAX_REDIRECTS = 5
/** Release metadata is a few kilobytes; anything larger is not an answer we want. */
const MAX_METADATA_BYTES = 2 * 1024 * 1024
/** An EmuHub build is well under this. A larger body is refused rather than written. */
const MAX_DOWNLOAD_BYTES = 800 * 1024 * 1024

/** A release as EmuHub reads it, before it is compared to the running version. */
export interface LatestRelease {
  /** Normalised version taken from the tag, falling back to the title. */
  version: string | null
  name: string
  notes: string
  releaseUrl: string
  publishedAt: string | null
  assets: ReleaseAsset[]
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

/**
 * Refuses any URL that is not plain HTTPS to a host EmuHub publishes from.
 * Applied to the first request and to every redirect, so a redirect can never
 * walk the download off GitHub or downgrade it to HTTP.
 */
function assertAllowedUrl(rawUrl: string): URL {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UserFacingError('network', 'EmuHub received an update address it cannot use.')
  }
  if (url.protocol !== 'https:' || !(UPDATE_ALLOWED_HOSTS as readonly string[]).includes(url.hostname)) {
    throw new UserFacingError(
      'network',
      'EmuHub only downloads updates from its own releases page.',
      'Download the update from the releases page instead.'
    )
  }
  return url
}

interface OpenOptions {
  headers: Record<string, string>
  signal: AbortSignal
}

/** Issues a GET and follows redirects, resolving with the response to read. */
async function open(rawUrl: string, options: OpenOptions): Promise<IncomingMessage> {
  let target = assertAllowedUrl(rawUrl)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await request(target, options)
    const status = response.statusCode ?? 0

    if (status >= 300 && status < 400 && response.headers.location) {
      const next = new URL(response.headers.location, target)
      response.resume()
      target = assertAllowedUrl(next.toString())
      continue
    }

    if (status < 200 || status >= 300) {
      response.resume()
      throw describeHttpStatus(status, response)
    }
    return response
  }

  throw new UserFacingError('network', 'The update address redirected too many times.')
}

function request(url: URL, options: OpenOptions): Promise<IncomingMessage> {
  return new Promise<IncomingMessage>((resolve, reject) => {
    const req = httpsGet(
      url,
      { headers: options.headers, signal: options.signal, timeout: REQUEST_TIMEOUT_MS },
      resolve
    )

    req.on('timeout', () => {
      req.destroy(new UserFacingError('network', 'The update server took too long to answer.', 'Please try again.'))
    })
    req.on('error', (error) => reject(translateNetworkError(error, options.signal)))
  })
}

function describeHttpStatus(status: number, response: IncomingMessage): UserFacingError {
  if (status === 404) {
    return new UserFacingError(
      'not-found',
      'EmuHub could not find a published release to compare against.',
      'There may be no release available yet.'
    )
  }
  if (status === 403 && response.headers['x-ratelimit-remaining'] === '0') {
    return new UserFacingError(
      'network',
      'GitHub is temporarily refusing update checks from this network.',
      'Try again in an hour, or open the releases page in your browser.'
    )
  }
  if (status >= 500) {
    return new UserFacingError('network', 'The update server is having trouble right now.', 'Please try again later.')
  }
  return new UserFacingError('network', `The update server answered with an unexpected status (${status}).`)
}

function translateNetworkError(error: unknown, signal: AbortSignal): Error {
  if (error instanceof UserFacingError) return error
  if (signal.aborted) return new UserFacingError('cancelled', 'The update download was cancelled.')

  const code = (error as NodeJS.ErrnoException)?.code
  switch (code) {
    case 'ABORT_ERR':
      return new UserFacingError('cancelled', 'The update download was cancelled.')
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return new UserFacingError(
        'network',
        'EmuHub could not reach the update server.',
        'Check your internet connection and try again.'
      )
    case 'ETIMEDOUT':
    case 'ECONNRESET':
    case 'ECONNREFUSED':
      return new UserFacingError('network', 'The connection to the update server was lost.', 'Please try again.')
    case 'CERT_HAS_EXPIRED':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'SELF_SIGNED_CERT_IN_CHAIN':
      return new UserFacingError(
        'network',
        'The update server could not be verified, so EmuHub stopped.',
        'A proxy or antivirus may be inspecting secure connections on this network.'
      )
    default:
      console.error('[emuhub] update request failed:', error)
      return new UserFacingError('network', 'EmuHub could not reach the update server.', 'Please try again later.')
  }
}

function headers(userAgent: string, accept: string): Record<string, string> {
  return { 'User-Agent': userAgent, Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' }
}

/* ------------------------------------------------------------------ */
/* Checking                                                            */
/* ------------------------------------------------------------------ */

/** Reads the newest published release. Nothing is sent but the request itself. */
export async function fetchLatestRelease(userAgent: string, signal: AbortSignal): Promise<LatestRelease> {
  const response = await open(UPDATE_LATEST_RELEASE_URL, {
    headers: headers(userAgent, 'application/vnd.github+json'),
    signal
  })

  const body = await readBody(response, MAX_METADATA_BYTES, signal)

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    throw new UserFacingError('network', 'The update server sent a reply EmuHub could not read.')
  }
  return normalizeRelease(payload)
}

function readBody(response: IncomingMessage, limit: number, signal: AbortSignal): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    response.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > limit) {
        response.destroy()
        reject(new UserFacingError('network', 'The update server sent more data than EmuHub expected.'))
        return
      }
      chunks.push(chunk)
    })
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    response.on('error', (error: Error) => reject(translateNetworkError(error, signal)))
  })
}

/**
 * Reads only the fields EmuHub needs out of the release payload, and treats
 * every one of them as untrusted: a missing or malformed field becomes an
 * empty value rather than propagating into the interface.
 */
function normalizeRelease(payload: unknown): LatestRelease {
  if (!payload || typeof payload !== 'object') {
    throw new UserFacingError('network', 'The update server sent a reply EmuHub could not read.')
  }
  const source = payload as Record<string, unknown>
  const text = (value: unknown): string => (typeof value === 'string' ? value : '')

  // Releases are usually tagged with their version, but a project that tags
  // otherwise still names the version in the release title.
  const version = parseVersion(text(source['tag_name']))?.text ?? parseVersion(text(source['name']))?.text ?? null

  const assets = Array.isArray(source['assets'])
    ? (source['assets'] as unknown[]).flatMap((entry): ReleaseAsset[] => {
        if (!entry || typeof entry !== 'object') return []
        const asset = entry as Record<string, unknown>
        const name = text(asset['name'])
        const downloadUrl = text(asset['browser_download_url'])
        if (!name || !downloadUrl) return []
        return [
          {
            name,
            downloadUrl,
            sizeBytes: typeof asset['size'] === 'number' ? asset['size'] : 0,
            digest: typeof asset['digest'] === 'string' ? asset['digest'] : null
          }
        ]
      })
    : []

  return {
    version,
    name: text(source['name']) || text(source['tag_name']),
    notes: summariseReleaseNotes(text(source['body'])),
    releaseUrl: text(source['html_url']),
    publishedAt: text(source['published_at']) || null,
    assets
  }
}

/** Describes a release for the interface, resolved against this platform. */
export function describeRelease(
  release: LatestRelease,
  version: string,
  platform: string,
  arch: string
): UpdateRelease {
  const asset = pickReleaseAsset(release.assets, platform, arch)
  return {
    version,
    name: release.name || `EmuHub ${version}`,
    notes: release.notes,
    releaseUrl: release.releaseUrl,
    publishedAt: release.publishedAt,
    asset: asset
      ? { name: asset.name, sizeBytes: asset.sizeBytes, installable: isInstallableAsset(asset.name, platform) }
      : null
  }
}

/** Re-reads the file of a release for this platform, by name. */
export function findAsset(release: LatestRelease, name: string): ReleaseAsset | null {
  return release.assets.find((asset) => asset.name === name) ?? null
}

/* ------------------------------------------------------------------ */
/* Downloading                                                         */
/* ------------------------------------------------------------------ */

export interface DownloadOptions {
  asset: ReleaseAsset
  /** Folder EmuHub owns; the file is written here and nowhere else. */
  directory: string
  userAgent: string
  signal: AbortSignal
  onProgress: (receivedBytes: number, totalBytes: number | null) => void
}

/**
 * Streams a release file to disk, then hands back where it landed.
 *
 * The file name comes from the server, so it is reduced to a plain name and
 * resolved inside EmuHub's own updates folder — a name carrying separators or
 * `..` can never escape it. The download is written to a `.part` file and only
 * given its real name once it is complete and its checksum matches, so an
 * interrupted download can never be mistaken for an installer.
 */
export async function downloadAsset(options: DownloadOptions): Promise<string> {
  const directory = path.resolve(options.directory)
  const filePath = path.join(directory, safeFileName(options.asset.name))
  if (path.dirname(filePath) !== directory) {
    throw new UserFacingError('invalid-path', 'EmuHub could not choose a safe place to save the update.')
  }
  const partialPath = `${filePath}.part`

  await fs.mkdir(directory, { recursive: true })
  await discard(partialPath)

  const response = await open(options.asset.downloadUrl, {
    headers: headers(options.userAgent, 'application/octet-stream'),
    signal: options.signal
  })

  const declared = Number(response.headers['content-length'])
  const totalBytes = Number.isFinite(declared) && declared > 0 ? declared : options.asset.sizeBytes || null
  if (totalBytes !== null && totalBytes > MAX_DOWNLOAD_BYTES) {
    response.destroy()
    throw new UserFacingError('network', 'The update file is larger than EmuHub is willing to download.')
  }

  const hash = createHash('sha256')
  let received = 0

  await new Promise<void>((resolve, reject) => {
    const file = createWriteStream(partialPath)
    let settled = false

    const finish = (error?: Error): void => {
      if (settled) return
      settled = true
      if (!error) {
        resolve()
        return
      }
      response.destroy()
      file.destroy()
      // Wait for the handle to close before rejecting: the caller deletes the
      // partial file next, and Windows refuses to delete an open one.
      if (file.closed) reject(error)
      else file.once('close', () => reject(error))
    }

    response.on('data', (chunk: Buffer) => {
      received += chunk.length
      if (received > MAX_DOWNLOAD_BYTES) {
        finish(new UserFacingError('network', 'The update file is larger than EmuHub is willing to download.'))
        return
      }
      hash.update(chunk)
      options.onProgress(received, totalBytes)
    })
    response.on('error', (error: Error) => finish(translateNetworkError(error, options.signal)))
    file.on('error', (error: Error) => finish(error))
    file.on('finish', () => finish())
    response.pipe(file)
  }).catch(async (error: unknown) => {
    await discard(partialPath)
    throw error
  })

  if (totalBytes !== null && received !== totalBytes) {
    await discard(partialPath)
    throw new UserFacingError(
      'network',
      'The update download ended early and was discarded.',
      'Check your connection and try again.'
    )
  }

  // GitHub publishes a digest for release files. When it is there the download
  // is only kept if it matches, so a truncated or altered file is never run.
  const expected = parseSha256Digest(options.asset.digest)
  if (expected && hash.digest('hex') !== expected) {
    await discard(partialPath)
    throw new UserFacingError(
      'unknown',
      'The downloaded update did not match its published checksum, so EmuHub deleted it.',
      'Try again, or download the update from the releases page.'
    )
  }

  await discard(filePath)
  await fs.rename(partialPath, filePath)
  return filePath
}

/**
 * Removes a file we no longer want. A failure here is never worth reporting:
 * the leftover is a `.part` nothing reads, and the next start prunes it.
 */
async function discard(filePath: string): Promise<void> {
  await fs.rm(filePath, { force: true }).catch(() => undefined)
}

function parseSha256Digest(digest: string | null): string | null {
  if (!digest) return null
  const match = /^sha256:([0-9a-f]{64})$/i.exec(digest.trim())
  return match?.[1]?.toLowerCase() ?? null
}

/** Characters no platform accepts in a file name, plus the control range. */
const UNSAFE_FILE_NAME_CHARACTERS = /[<>:"|?*\u0000-\u001f]/g

/** Reduces a server-supplied name to something safe to create in our folder. */
function safeFileName(rawName: string): string {
  const flattened = rawName.replace(/[\\/]/g, '_').replace(UNSAFE_FILE_NAME_CHARACTERS, '_')
  const cleaned = path.basename(flattened).replace(/^\.+/, '').trim()
  return cleaned.length > 0 && cleaned.length <= 180 ? cleaned : 'emuhub-update'
}

/** Deletes leftovers from earlier runs so the folder never grows unattended. */
export async function pruneDownloads(directory: string, keepFileName: string | null): Promise<void> {
  const entries = await fs.readdir(directory).catch(() => [])
  await Promise.all(
    entries
      .filter((entry) => entry !== keepFileName)
      .map((entry) => fs.rm(path.join(directory, entry), { force: true, recursive: true }).catch(() => undefined))
  )
}

/* ------------------------------------------------------------------ */
/* Installing                                                          */
/* ------------------------------------------------------------------ */

/**
 * Starts a downloaded installer and leaves it running on its own.
 *
 * Two things keep this narrow: the file must be inside EmuHub's own updates
 * folder — so only something EmuHub downloaded and checksum-verified can be
 * started — and it is spawned with an argument vector, never a shell, exactly
 * as emulators are.
 */
export async function launchInstaller(filePath: string, allowedDirectory: string): Promise<void> {
  const resolved = path.resolve(filePath)
  const directory = path.resolve(allowedDirectory)
  if (path.dirname(resolved) !== directory) {
    throw new UserFacingError('invalid-path', 'That file is not an update EmuHub downloaded.')
  }
  if (!isInstallableAsset(resolved, process.platform)) {
    throw new UserFacingError(
      'not-executable',
      'This update has to be installed by hand.',
      'Open the folder EmuHub downloaded it to and run it from there.'
    )
  }

  const stats = await fs.stat(resolved).catch(() => null)
  if (!stats?.isFile()) {
    throw new UserFacingError('not-found', 'The downloaded update is no longer there.', 'Download it again to continue.')
  }

  const isMsi = path.extname(resolved).toLowerCase() === '.msi'
  const command = isMsi ? 'msiexec' : resolved
  const args = isMsi ? ['/i', resolved] : []

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const child = spawn(command, args, {
      cwd: directory,
      detached: true,
      stdio: 'ignore',
      // Never route through a shell: the path stays a literal value.
      shell: false
    })

    child.once('error', (error: NodeJS.ErrnoException) => {
      if (settled) return
      settled = true
      console.error('[emuhub] installer failed to start:', error)
      reject(
        new UserFacingError(
          'launch-failed',
          'EmuHub could not start the update installer.',
          'Open the folder it was downloaded to and run it yourself.'
        )
      )
    })
    child.once('spawn', () => {
      if (settled) return
      settled = true
      child.unref()
      resolve()
    })
  })
}
