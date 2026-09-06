import { promises as fs, constants as fsConstants } from 'node:fs'
import path from 'node:path'
import type { ExecutableInfo } from '@shared/types'
import { UserFacingError } from '../errors'

/** Extensions Windows will actually run directly. */
const WINDOWS_EXECUTABLE_EXTENSIONS = new Set(['.exe', '.com', '.bat', '.cmd'])
/** Bundles/scripts commonly used to start an emulator outside Windows. */
const UNIX_EXECUTABLE_EXTENSIONS = new Set(['', '.appimage', '.sh', '.app', '.run', '.bin', '.x86_64', '.flatpakref'])

export function isWindows(): boolean {
  return process.platform === 'win32'
}

/**
 * Rejects paths that cannot be a real local executable before they ever reach
 * the file system or a child process. Configured paths are treated as
 * untrusted input at every step.
 */
export function normalizeExecutablePath(rawPath: string): string {
  if (typeof rawPath !== 'string') {
    throw new UserFacingError('invalid-path', 'No emulator file was selected.')
  }

  const trimmed = rawPath.trim().replace(/^"(.*)"$/, '$1')
  if (trimmed.length === 0) {
    throw new UserFacingError('invalid-path', 'No emulator file was selected.')
  }
  if (trimmed.includes('\0')) {
    throw new UserFacingError('invalid-path', 'That file path contains characters EmuHub cannot use.')
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    throw new UserFacingError(
      'invalid-path',
      'EmuHub can only launch programs stored on this computer.',
      'Pick the emulator’s executable file instead of a link.'
    )
  }

  const resolved = path.resolve(trimmed)
  if (!path.isAbsolute(resolved)) {
    throw new UserFacingError('invalid-path', 'EmuHub needs the full location of the emulator file.')
  }
  return resolved
}

function hasExecutableExtension(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase()
  return isWindows() ? WINDOWS_EXECUTABLE_EXTENSIONS.has(extension) : UNIX_EXECUTABLE_EXTENSIONS.has(extension)
}

async function isExecutableFile(filePath: string): Promise<boolean> {
  if (isWindows()) return hasExecutableExtension(filePath)
  try {
    await fs.access(filePath, fsConstants.X_OK)
    return true
  } catch {
    return hasExecutableExtension(filePath)
  }
}

/** Reads metadata for a chosen file, or explains precisely why it is unusable. */
export async function inspectExecutable(rawPath: string): Promise<ExecutableInfo> {
  const filePath = normalizeExecutablePath(rawPath)

  let stats: Awaited<ReturnType<typeof fs.stat>>
  try {
    stats = await fs.stat(filePath)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      throw new UserFacingError(
        'not-found',
        'That emulator file no longer exists at the saved location.',
        'It may have been moved, renamed or uninstalled. Choose it again to reconnect it.'
      )
    }
    if (code === 'EACCES' || code === 'EPERM') {
      throw new UserFacingError(
        'permission-denied',
        'EmuHub is not allowed to read that file.',
        'Try a copy stored in your own user folder.'
      )
    }
    throw error
  }

  if (stats.isDirectory()) {
    throw new UserFacingError(
      'invalid-path',
      'That is a folder, not an emulator program.',
      isWindows()
        ? 'Open the folder and pick the .exe file inside it.'
        : 'Open the folder and pick the program file inside it.'
    )
  }
  if (!stats.isFile()) {
    throw new UserFacingError('invalid-path', 'That item is not a program EmuHub can launch.')
  }

  const executable = await isExecutableFile(filePath)
  const fileName = path.basename(filePath)

  return {
    path: filePath,
    fileName,
    suggestedName: fileName.replace(/\.[^.]+$/, ''),
    directory: path.dirname(filePath),
    sizeBytes: stats.size,
    executable
  }
}

/**
 * Confirms a stored path is still launchable. Used before launching and by the
 * library health check that flags emulators that went missing.
 */
export async function verifyExecutable(rawPath: string): Promise<ExecutableInfo> {
  const info = await inspectExecutable(rawPath)
  if (!info.executable) {
    throw new UserFacingError(
      'not-executable',
      `“${info.fileName}” does not look like a program EmuHub can start.`,
      isWindows()
        ? 'Choose the emulator’s .exe file — usually in its installation folder.'
        : 'Choose the emulator’s program file, or make the file executable.'
    )
  }
  return info
}
