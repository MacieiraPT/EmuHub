import { app, nativeTheme } from 'electron'
import type { StorageHealth } from '@shared/types'
import { IpcEvent } from '@shared/ipc'
import { LibraryRepository } from './services/libraryRepository'
import { SettingsRepository } from './services/settingsRepository'
import { WindowManager } from './window'
import { TrayController } from './tray'
import { UpdateController, updateDownloadDirectory } from './services/updateController'
import { installApplicationMenu } from './menu'
import { applySideEffects, registerIpcHandlers } from './ipc/register'

app.setAppUserModelId('com.emuhub.app')

/** Lets the window paint and settle before the update check touches the network. */
const STARTUP_UPDATE_CHECK_DELAY_MS = 2500

// A launcher must be a single instance: a second start focuses the open window.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  void start()
}

async function start(): Promise<void> {
  await app.whenReady()

  const configDirectory = app.getPath('userData')
  const settings = new SettingsRepository(configDirectory)
  const library = new LibraryRepository(configDirectory)

  const [settingsOutcome, libraryOutcome] = await Promise.all([
    settings.load().catch(() => null),
    library.load().catch(() => null)
  ])

  const storageHealth: StorageHealth = {
    settingsRecovered: settingsOutcome?.recovered ?? true,
    libraryRecovered: libraryOutcome?.recovered ?? true,
    backupPath: libraryOutcome?.backupPath ?? settingsOutcome?.backupPath ?? null
  }

  const initial = await settings.get()
  nativeTheme.themeSource = initial.appearance.theme

  const windows = new WindowManager(configDirectory)
  const tray = new TrayController(windows)
  const updates = new UpdateController({
    windows,
    currentVersion: app.getVersion(),
    directory: updateDownloadDirectory(configDirectory),
    platform: process.platform,
    arch: process.arch
  })

  /** Settings the window and app lifecycle need to read synchronously. */
  const runtime = {
    closeToTray: initial.general.closeToTray,
    minimizeToTray: initial.general.minimizeToTray
  }

  const context = {
    library,
    settings,
    windows,
    tray,
    updates,
    storageHealth,
    runtime
  }

  registerIpcHandlers(context)
  installApplicationMenu(windows, updates)
  await applySideEffects(initial, context)

  const startHidden =
    initial.general.startMinimized &&
    (process.argv.includes('--start-minimized') || app.getLoginItemSettings().wasOpenedAtLogin)

  await windows.create({
    startHidden,
    darkTheme: initial.appearance.theme !== 'light',
    closeToTray: () => runtime.closeToTray,
    minimizeToTray: () => runtime.minimizeToTray
  })

  // A download left behind by an earlier run is never reused: it is cleared
  // before this one can look for an update.
  await updates.pruneOldDownloads()

  if (initial.general.checkForUpdates) {
    // Deliberately after the window is up and deliberately not awaited, so a
    // slow or unreachable network never delays someone opening their library.
    setTimeout(() => void updates.check(), STARTUP_UPDATE_CHECK_DELAY_MS)
  }

  nativeTheme.on('updated', () => {
    windows.send(IpcEvent.systemThemeChanged, nativeTheme.shouldUseDarkColors)
  })

  app.on('second-instance', () => windows.show())
  app.on('activate', () => windows.show())

  app.on('before-quit', () => {
    windows.markQuitting()
    tray.dispose()
    updates.dispose()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && !runtime.closeToTray) app.quit()
  })
}
