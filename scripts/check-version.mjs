/**
 * Confirms `package.json` is ahead of the newest published release.
 *
 * A build reports whatever version `package.json` carries, and the updater
 * compares that against the releases page. If the two ever meet, a build made
 * from this source thinks it is out of date and offers to "update" to itself,
 * so the working tree must always sit on the version the next release will be.
 *
 * Run with `npm run version:check`. It reads the public releases API and
 * nothing else; a network it cannot reach is reported, not treated as failure.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RELEASES_API = 'https://api.github.com/repos/MacieiraPT/EmuHub/releases/latest'

/**
 * Matches the first version-looking token in a string. Kept in step with
 * `parseVersion` in `src/shared/updates.ts`, which the application itself uses
 * — this script cannot import the TypeScript source.
 */
const VERSION = /v?(\d+)\.(\d+)(?:\.(\d+))?/

function parse(raw) {
  const match = typeof raw === 'string' ? VERSION.exec(raw) : null
  if (!match) return null
  return [Number(match[1]), Number(match[2]), match[3] === undefined ? 0 : Number(match[3])]
}

/** Negative when `a` is older, positive when newer, zero when the same. */
function compare(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
  return 0
}

const format = (version) => version.join('.')

const local = parse(JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version)
if (!local) {
  console.error('package.json does not carry a version this script can read.')
  process.exit(1)
}

let release
try {
  const response = await fetch(RELEASES_API, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'EmuHub version check' }
  })
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
  release = await response.json()
} catch (error) {
  // Not a failure: the check is an aid, and offline work should not be blocked.
  console.warn(`Could not reach the releases page (${error.message}).`)
  console.warn(`package.json is ${format(local)}. Check the newest release by hand before committing.`)
  process.exit(0)
}

// This project tags releases by hand, so the version can live in the release
// title rather than the tag. Both are read, the tag first.
const published = parse(release.tag_name) ?? parse(release.name)

if (!published) {
  console.warn(`The newest release ("${release.name || release.tag_name}") names no version to compare against.`)
  console.warn(`package.json is ${format(local)}.`)
  process.exit(0)
}

if (compare(local, published) > 0) {
  console.log(`OK — package.json is ${format(local)}, ahead of the published ${format(published)}.`)
  process.exit(0)
}

const [major, minor, patch] = published
console.error(`package.json is ${format(local)}, but ${format(published)} is already published.`)
console.error('A build from this source would think it is out of date and offer to update to itself.')
console.error('')
console.error(`Set the version to ${format([major, minor, patch + 1])} for fixes and small changes,`)
console.error(`or ${format([major, minor + 1, 0])} for a new feature, then update package-lock.json to match.`)
process.exit(1)
