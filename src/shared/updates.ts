/**
 * Everything about finding a newer EmuHub that is pure logic: where releases
 * are published, how a version is read out of one, and which file of a release
 * belongs to the machine asking.
 *
 * Compiled by both tsconfig projects, so nothing here may touch Node or the
 * DOM — the main process does the talking, this file only decides.
 */

/** The repository EmuHub publishes its own builds to. */
export const UPDATE_REPOSITORY = { owner: 'MacieiraPT', name: 'EmuHub' } as const

/** Release metadata endpoint. Public, so no token is ever involved. */
export const UPDATE_LATEST_RELEASE_URL = `https://api.github.com/repos/${UPDATE_REPOSITORY.owner}/${UPDATE_REPOSITORY.name}/releases/latest`

/** Where the user is sent when EmuHub cannot download the update itself. */
export const UPDATE_RELEASES_PAGE_URL = `https://github.com/${UPDATE_REPOSITORY.owner}/${UPDATE_REPOSITORY.name}/releases/latest`

/**
 * Hosts a release download is allowed to come from. GitHub redirects asset
 * downloads to its object storage, so both ends of that hop are listed and
 * anything else is refused rather than followed.
 */
export const UPDATE_ALLOWED_HOSTS = [
  'api.github.com',
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com'
] as const

/* ------------------------------------------------------------------ */
/* Versions                                                            */
/* ------------------------------------------------------------------ */

export interface ParsedVersion {
  major: number
  minor: number
  patch: number
  /** Dot-separated pre-release identifiers; empty for a final release. */
  prerelease: string[]
  /** Normalised `1.2.3` form, with any pre-release suffix kept. */
  text: string
}

/**
 * Matches the first version-looking token in a string, so both a `v1.2.3` tag
 * and a `EmuHub v1.2.3` release title yield the same answer. Build metadata
 * after `+` is ignored: it never affects precedence.
 */
const VERSION_PATTERN = /v?(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9A-Za-z][0-9A-Za-z.-]*))?/

export function parseVersion(raw: string | null | undefined): ParsedVersion | null {
  if (typeof raw !== 'string') return null
  const match = VERSION_PATTERN.exec(raw)
  if (!match) return null

  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = match[3] === undefined ? 0 : Number(match[3])
  if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(patch)) return null

  const prerelease = match[4] ? match[4].split('.').filter((part) => part.length > 0) : []
  const core = `${major}.${minor}.${patch}`

  return { major, minor, patch, prerelease, text: prerelease.length > 0 ? `${core}-${prerelease.join('.')}` : core }
}

/** Semver precedence: -1 when `a` is older, 1 when newer, 0 when equal. */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1

  // A release with no pre-release suffix outranks any pre-release of it.
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0
  if (a.prerelease.length === 0) return 1
  if (b.prerelease.length === 0) return -1

  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const left = a.prerelease[index]
    const right = b.prerelease[index]
    // A shorter set of identifiers ranks lower when everything so far is equal.
    if (left === undefined) return -1
    if (right === undefined) return 1
    if (left === right) continue

    const leftNumeric = /^\d+$/.test(left)
    const rightNumeric = /^\d+$/.test(right)
    if (leftNumeric && rightNumeric) return Number(left) < Number(right) ? -1 : 1
    // Numeric identifiers always rank below alphanumeric ones.
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1
    return left < right ? -1 : 1
  }
  return 0
}

/** True only when `candidate` is a version this build should offer to install. */
export function isNewerVersion(candidate: string | null | undefined, current: string | null | undefined): boolean {
  const next = parseVersion(candidate)
  const now = parseVersion(current)
  if (!next || !now) return false
  return compareVersions(next, now) > 0
}

/* ------------------------------------------------------------------ */
/* Release assets                                                      */
/* ------------------------------------------------------------------ */

export interface ReleaseAsset {
  name: string
  downloadUrl: string
  sizeBytes: number
  /** `sha256:…` digest GitHub publishes with the file, when it has one. */
  digest: string | null
}

interface PlatformProfile {
  /** Extensions that are a real installer for this platform. */
  installers: string[]
  /** Extensions the platform can use once unpacked by hand. */
  packages: string[]
  keywords: string[]
}

const PLATFORMS: Record<string, PlatformProfile> = {
  win32: { installers: ['.exe', '.msi'], packages: [], keywords: ['win', 'win32', 'win64', 'windows'] },
  darwin: { installers: [], packages: ['.dmg', '.pkg'], keywords: ['mac', 'macos', 'osx', 'darwin'] },
  linux: { installers: [], packages: ['.appimage', '.deb', '.rpm'], keywords: ['linux'] }
}

/** Generic containers: usable anywhere, but only once the name says where. */
const ARCHIVE_EXTENSIONS = ['.zip', '.7z', '.gz', '.xz', '.bz2', '.tar']

/** Checksums, signatures and updater metadata are never the download itself. */
const COMPANION_EXTENSIONS = ['.blockmap', '.yml', '.yaml', '.json', '.sha256', '.sha512', '.sig', '.asc', '.txt']

const ARCHITECTURES: Record<string, string[]> = {
  x64: ['x64', 'x86_64', 'x86-64', 'amd64', 'win64'],
  arm64: ['arm64', 'aarch64'],
  ia32: ['ia32', 'x86', 'i386', 'win32'],
  arm: ['armv7', 'armhf']
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.')
  return index === -1 ? '' : name.slice(index).toLowerCase()
}

function mentions(haystack: string, keywords: readonly string[]): boolean {
  // Keywords are matched on word-ish boundaries so "windows" never matches
  // inside an unrelated word and "arm" never matches inside "firmware".
  return keywords.some((keyword) => new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`, 'i').test(haystack))
}

/**
 * True when EmuHub can start the file itself to install the update. Only
 * Windows installers qualify: everywhere else the download is handed to the
 * user rather than executed for them.
 */
export function isInstallableAsset(fileName: string, platform: string): boolean {
  const profile = PLATFORMS[platform]
  if (!profile) return false
  return profile.installers.includes(extensionOf(fileName))
}

/**
 * Chooses the file of a release that belongs to this machine, or null when the
 * release has nothing for it. Anything that names a different platform or a
 * different architecture is refused outright rather than downloaded hopefully.
 */
export function pickReleaseAsset(
  assets: readonly ReleaseAsset[],
  platform: string,
  arch: string
): ReleaseAsset | null {
  const profile = PLATFORMS[platform]
  if (!profile) return null

  const otherKeywords = Object.entries(PLATFORMS)
    .filter(([key]) => key !== platform)
    .flatMap(([, other]) => other.keywords)
  const otherExtensions = Object.entries(PLATFORMS)
    .filter(([key]) => key !== platform)
    .flatMap(([, other]) => [...other.installers, ...other.packages])

  const wantedArch = ARCHITECTURES[arch] ?? []
  const otherArch = Object.entries(ARCHITECTURES)
    .filter(([key]) => key !== arch)
    .flatMap(([, aliases]) => aliases)

  let best: { asset: ReleaseAsset; score: number } | null = null

  for (const asset of assets) {
    if (!asset || typeof asset.name !== 'string' || typeof asset.downloadUrl !== 'string') continue

    const name = asset.name
    const extension = extensionOf(name)
    if (COMPANION_EXTENSIONS.includes(extension)) continue

    const namesThisPlatform = mentions(name, profile.keywords)
    if (!namesThisPlatform && mentions(name, otherKeywords)) continue
    if (otherExtensions.includes(extension) && !profile.installers.includes(extension)) continue

    let score = 0
    if (profile.installers.includes(extension)) score += 5
    else if (profile.packages.includes(extension)) score += 4
    else if (ARCHIVE_EXTENSIONS.includes(extension)) score += 1
    else continue

    // A bare archive says nothing about the platform it is for; without a
    // keyword there is no reason to believe it is this one.
    if (ARCHIVE_EXTENSIONS.includes(extension) && !namesThisPlatform) continue
    if (namesThisPlatform) score += 2

    if (wantedArch.length > 0 && mentions(name, wantedArch)) score += 3
    else if (mentions(name, otherArch)) continue

    if (!best || score > best.score || (score === best.score && asset.sizeBytes > best.asset.sizeBytes)) {
      best = { asset, score }
    }
  }

  return best?.asset ?? null
}

/**
 * Trims release notes to something a dialog can show. GitHub notes are
 * Markdown written by a human; they are only ever rendered as text.
 */
export function summariseReleaseNotes(notes: string, maxLength = 1200): string {
  const cleaned = notes
    .replace(/\r\n/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trimEnd()}…`
}
