import { app } from 'electron'

/**
 * "Start with the system" support.
 *
 * Uses Electron's login-item API, which writes a normal per-user startup entry
 * on Windows and macOS — no elevated permissions and no registry poking of our
 * own. On Linux the API is unavailable, so the setting is reported as
 * unsupported instead of silently doing nothing.
 */
export function isAutoLaunchSupported(): boolean {
  return process.platform === 'win32' || process.platform === 'darwin'
}

export function getAutoLaunchEnabled(): boolean {
  if (!isAutoLaunchSupported()) return false
  try {
    return app.getLoginItemSettings().openAtLogin
  } catch {
    return false
  }
}

export function setAutoLaunch(enabled: boolean, startMinimized: boolean): boolean {
  if (!isAutoLaunchSupported()) return false
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      args: enabled && startMinimized ? ['--start-minimized'] : []
    })
    return true
  } catch (error) {
    console.error('[emuhub] could not update startup setting:', error)
    return false
  }
}
