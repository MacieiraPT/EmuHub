/**
 * Single source of truth for the IPC surface. The preload bridge and the
 * main-process router are both derived from this map, so a channel can never
 * drift between the two sides.
 */
export const IpcChannel = {
  appInfo: 'app:info',
  storageHealth: 'app:storage-health',
  openConfigFolder: 'app:open-config-folder',

  libraryList: 'library:list',
  libraryAdd: 'library:add',
  libraryAddMany: 'library:add-many',
  libraryUpdate: 'library:update',
  libraryRemove: 'library:remove',
  libraryClear: 'library:clear',
  librarySetEmulator: 'library:set-emulator',
  libraryLaunch: 'library:launch',
  libraryCheckEmulators: 'library:check-emulators',

  backupExport: 'backup:export',
  backupImport: 'backup:import',

  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  settingsReset: 'settings:reset',
  settingsResetOnboarding: 'settings:reset-onboarding',
  settingsCompleteOnboarding: 'settings:complete-onboarding',

  updatesGetState: 'updates:get-state',
  updatesCheck: 'updates:check',
  updatesDownload: 'updates:download',
  updatesCancel: 'updates:cancel',
  updatesInstall: 'updates:install',
  updatesReveal: 'updates:reveal',
  updatesOpenReleasePage: 'updates:open-release-page',

  dialogPickExecutable: 'dialog:pick-executable',
  dialogConfirm: 'dialog:confirm',
  fsInspectExecutable: 'fs:inspect-executable',
  fsRevealPath: 'fs:reveal-path',

  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowGetState: 'window:get-state'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

/** Events pushed from main to renderer. */
export const IpcEvent = {
  windowStateChanged: 'event:window-state',
  libraryChanged: 'event:library-changed',
  settingsChanged: 'event:settings-changed',
  systemThemeChanged: 'event:system-theme',
  navigate: 'event:navigate',
  notify: 'event:notify',
  updateStateChanged: 'event:update-state'
} as const

export type IpcEventName = (typeof IpcEvent)[keyof typeof IpcEvent]

export interface NotifyPayload {
  tone: 'success' | 'info' | 'warning' | 'error'
  title: string
  description?: string
}
