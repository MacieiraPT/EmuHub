import { spawn } from 'node:child_process'
import path from 'node:path'
import type { EmulatorProfile } from '@shared/types'
import { UserFacingError } from '../errors'
import { verifyExecutable } from './executables'

/**
 * Starts an emulator as a detached child process.
 *
 * The executable path and its arguments are passed as an argument vector — a
 * shell is never involved, so nothing in a stored path or argument can be
 * interpreted as a command.
 */
export async function launchEmulator(profile: EmulatorProfile): Promise<number | null> {
  const info = await verifyExecutable(profile.executablePath)

  const args = sanitizeArgs(profile.args)
  const cwd = profile.workingDirectory?.trim() || info.directory

  return await new Promise<number | null>((resolve, reject) => {
    let settled = false

    const child = spawn(info.path, args, {
      cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
      // Never route through a shell: paths and arguments stay literal values.
      shell: false
    })

    child.once('error', (error: NodeJS.ErrnoException) => {
      if (settled) return
      settled = true
      reject(translateSpawnError(error, path.basename(info.path)))
    })

    child.once('spawn', () => {
      if (settled) return
      settled = true
      child.unref()
      resolve(child.pid ?? null)
    })
  })
}

/** Drops empty entries and anything that is not a plain string. */
function sanitizeArgs(args: string[] | undefined): string[] {
  if (!Array.isArray(args)) return []
  return args
    .filter((arg): arg is string => typeof arg === 'string')
    .map((arg) => arg.trim())
    .filter((arg) => arg.length > 0 && !arg.includes('\0'))
}

function translateSpawnError(error: NodeJS.ErrnoException, fileName: string): UserFacingError {
  switch (error.code) {
    case 'ENOENT':
      return new UserFacingError(
        'not-found',
        `“${fileName}” could not be found any more.`,
        'Choose the emulator file again to reconnect it.'
      )
    case 'EACCES':
    case 'EPERM':
      return new UserFacingError(
        'permission-denied',
        `EmuHub is not allowed to start “${fileName}”.`,
        'Check the file permissions, then try again.'
      )
    case 'ENOEXEC':
      return new UserFacingError(
        'not-executable',
        `“${fileName}” is not a program this computer can run.`,
        'Pick the emulator’s main executable file.'
      )
    default:
      console.error('[emuhub] launch failed:', error)
      return new UserFacingError(
        'launch-failed',
        `EmuHub could not start “${fileName}”.`,
        'The emulator may be damaged or already running with exclusive access.'
      )
  }
}
