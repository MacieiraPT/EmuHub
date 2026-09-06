import { BrowserWindow, dialog, ipcMain, nativeTheme, shell, app } from 'electron'
import path from 'node:path'
import type {
  AddConsoleInput,
  AppInfo,
  AppSettings,
  ConfiguredConsole,
  ExecutableInfo,
  LaunchResult,
  Result,
  SetEmulatorInput,
  StorageHealth,
  UpdateConsoleInput,
  WindowState
} from '@shared/types'
import { IpcChannel, IpcEvent } from '@shared/ipc'
import { getConsoleDefinition } from '@shared/data/consoles'
import { getActiveEmulator, resolveDisplayName } from '@shared/library'
import { ok, toResult, UserFacingError } from '../errors'
import type { LibraryRepository } from '../services/libraryRepository'
import type { SettingsRepository, SettingsPatch } from '../services/settingsRepository'
import { inspectExecutable, isWindows } from '../services/executables'
import { launchEmulator } from '../services/launcher'
import { isAutoLaunchSupported, setAutoLaunch } from '../services/autoLaunch'
import type { WindowManager } from '../window'
import type { TrayController } from '../tray'

export interface IpcContext {
  library: LibraryRepository
  settings: SettingsRepository
  windows: WindowManager
  tray: TrayController
  storageHealth: StorageHealth
  /** Mutable flags the window and app lifecycle read synchronously. */
  runtime: { closeToTray: boolean; minimizeToTray: boolean }
}

/** Wraps a handler so no exception ever crosses the IPC boundary raw. */
function handle<T>(channel: string, handler: (...args: unknown[]) => Promise<T> | T): void {
  ipcMain.handle(channel, async (_event, ...args): Promise<Result<T>> => {
    try {
      return ok(await handler(...args))
    } catch (error) {
      return toResult(error, channel)
    }
  })
}

export function registerIpcHandlers(context: IpcContext): void {
  const { library, settings, windows } = context

  /* -------------------------------------------------- app ---------- */

  handle<AppInfo>(IpcChannel.appInfo, () => ({
    version: app.getVersion(),
    electronVersion: process.versions.electron ?? 'unknown',
    platform: process.platform,
    configDirectory: app.getPath('userData'),
    isPackaged: app.isPackaged
  }))

  handle<StorageHealth>(IpcChannel.storageHealth, () => context.storageHealth)

  handle<boolean>(IpcChannel.openConfigFolder, async () => {
    const error = await shell.openPath(app.getPath('userData'))
    if (error) throw new UserFacingError('unknown', 'EmuHub could not open its configuration folder.')
    return true
  })

  /* ---------------------------------------------- library ---------- */

  handle<ConfiguredConsole[]>(IpcChannel.libraryList, () => library.list())

  handle<ConfiguredConsole>(IpcChannel.libraryAdd, async (input) => {
    const entry = await library.add(input as AddConsoleInput)
    notifyLibraryChanged(windows)
    return entry
  })

  handle<ConfiguredConsole>(IpcChannel.libraryUpdate, async (input) => {
    const entry = await library.update(input as UpdateConsoleInput)
    notifyLibraryChanged(windows)
    return entry
  })

  handle<ConfiguredConsole>(IpcChannel.librarySetEmulator, async (input) => {
    const entry = await library.setEmulator(input as SetEmulatorInput)
    notifyLibraryChanged(windows)
    return entry
  })

  handle<boolean>(IpcChannel.libraryRemove, async (id) => {
    await library.remove(String(id))
    notifyLibraryChanged(windows)
    return true
  })

  handle<boolean>(IpcChannel.libraryClear, async () => {
    await library.clear()
    notifyLibraryChanged(windows)
    return true
  })

  handle<LaunchResult>(IpcChannel.libraryLaunch, async (id) => {
    const entry = await library.get(String(id))
    const definition = getConsoleDefinition(entry.consoleId)
    const emulator = getActiveEmulator(entry)

    if (!emulator) {
      throw new UserFacingError(
        'not-found',
        `No emulator is set up for ${resolveDisplayName(entry, definition)} yet.`,
        'Choose an emulator file to finish setting this console up.'
      )
    }

    const pid = await launchEmulator(emulator)
    await library.recordLaunch(entry.id).catch(() => undefined)
    notifyLibraryChanged(windows)
    return { consoleEntryId: entry.id, emulatorName: emulator.name, pid }
  })

  /** Reports which configured emulators are still present on disk. */
  handle<Record<string, boolean>>(IpcChannel.libraryCheckEmulators, async () => {
    const entries = await library.list()
    const results = await Promise.all(
      entries.map(async (entry) => {
        const emulator = getActiveEmulator(entry)
        if (!emulator) return [entry.id, false] as const
        try {
          const info = await inspectExecutable(emulator.executablePath)
          return [entry.id, info.executable] as const
        } catch {
          return [entry.id, false] as const
        }
      })
    )
    return Object.fromEntries(results)
  })

  /* --------------------------------------------- settings ---------- */

  handle<AppSettings>(IpcChannel.settingsGet, () => settings.get())

  handle<AppSettings>(IpcChannel.settingsUpdate, async (patch) => {
    const next = await settings.update(patch as SettingsPatch)
    await applySideEffects(next, context)
    windows.send(IpcEvent.settingsChanged, next)
    return next
  })

  handle<AppSettings>(IpcChannel.settingsReset, async () => {
    const next = await settings.resetToDefaults()
    await applySideEffects(next, context)
    windows.send(IpcEvent.settingsChanged, next)
    return next
  })

  handle<AppSettings>(IpcChannel.settingsResetOnboarding, async () => {
    const next = await settings.setOnboardingCompleted(false)
    windows.send(IpcEvent.settingsChanged, next)
    return next
  })

  handle<AppSettings>(IpcChannel.settingsCompleteOnboarding, async () => {
    const next = await settings.setOnboardingCompleted(true)
    windows.send(IpcEvent.settingsChanged, next)
    return next
  })

  /* ------------------------------------- dialogs & file system ----- */

  handle<ExecutableInfo | null>(IpcChannel.dialogPickExecutable, async (options) => {
    const { consoleName, currentPath } = (options ?? {}) as { consoleName?: string; currentPath?: string }
    const parent = BrowserWindow.getFocusedWindow() ?? windows.mainWindow

    const filters = isWindows()
      ? [
          { name: 'Programs', extensions: ['exe', 'bat', 'cmd', 'com'] },
          { name: 'All files', extensions: ['*'] }
        ]
      : process.platform === 'darwin'
        ? [
            { name: 'Applications', extensions: ['app'] },
            { name: 'All files', extensions: ['*'] }
          ]
        : [
            { name: 'Programs', extensions: ['AppImage', 'sh', 'run', 'bin'] },
            { name: 'All files', extensions: ['*'] }
          ]

    const result = await dialog.showOpenDialog(parent ?? new BrowserWindow({ show: false }), {
      title: consoleName ? `Select the emulator for ${consoleName}` : 'Select an emulator',
      buttonLabel: 'Use this emulator',
      properties: process.platform === 'darwin' ? ['openFile', 'treatPackageAsDirectory'] : ['openFile'],
      ...(currentPath ? { defaultPath: path.dirname(currentPath) } : {}),
      filters
    })

    // A cancelled picker is a normal outcome, not an error.
    if (result.canceled || result.filePaths.length === 0) return null
    return await inspectExecutable(result.filePaths[0] as string)
  })

  handle<boolean>(IpcChannel.dialogConfirm, async (options) => {
    const { title, message, detail, confirmLabel, destructive } = (options ?? {}) as {
      title?: string
      message?: string
      detail?: string
      confirmLabel?: string
      destructive?: boolean
    }
    const parent = BrowserWindow.getFocusedWindow() ?? windows.mainWindow
    const response = await dialog.showMessageBox(parent ?? new BrowserWindow({ show: false }), {
      type: destructive ? 'warning' : 'question',
      title: title ?? 'EmuHub',
      message: message ?? 'Are you sure?',
      ...(detail ? { detail } : {}),
      buttons: [confirmLabel ?? 'Confirm', 'Cancel'],
      defaultId: destructive ? 1 : 0,
      cancelId: 1,
      noLink: true
    })
    return response.response === 0
  })

  handle<ExecutableInfo>(IpcChannel.fsInspectExecutable, (filePath) => inspectExecutable(String(filePath)))

  handle<boolean>(IpcChannel.fsRevealPath, async (filePath) => {
    const info = await inspectExecutable(String(filePath))
    shell.showItemInFolder(info.path)
    return true
  })

  /* ----------------------------------------------- window ---------- */

  handle<boolean>(IpcChannel.windowMinimize, () => {
    windows.mainWindow?.minimize()
    return true
  })

  handle<boolean>(IpcChannel.windowToggleMaximize, () => {
    windows.toggleMaximize()
    return true
  })

  handle<boolean>(IpcChannel.windowClose, () => {
    windows.mainWindow?.close()
    return true
  })

  handle<WindowState>(IpcChannel.windowGetState, () => windows.getState())
}

function notifyLibraryChanged(windows: WindowManager): void {
  windows.send(IpcEvent.libraryChanged)
}

/** Applies settings that affect the OS or the window shell. */
export async function applySideEffects(settings: AppSettings, context: IpcContext): Promise<void> {
  nativeTheme.themeSource = settings.appearance.theme
  context.runtime.closeToTray = settings.general.closeToTray
  context.runtime.minimizeToTray = settings.general.minimizeToTray

  context.tray.sync(settings.general.minimizeToTray || settings.general.closeToTray)

  if (isAutoLaunchSupported()) {
    setAutoLaunch(settings.general.launchOnStartup, settings.general.startMinimized)
  }
}
