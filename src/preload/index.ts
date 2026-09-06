import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, IpcEvent, type NotifyPayload } from '@shared/ipc'
import type {
  AddConsoleInput,
  BackupExportResult,
  BackupImportResult,
  BulkAddResult,
  AppInfo,
  AppSettings,
  ConfiguredConsole,
  ExecutableInfo,
  LaunchResult,
  Result,
  SetEmulatorInput,
  StorageHealth,
  UpdateConsoleInput,
  UpdateState,
  WindowState
} from '@shared/types'

export type SettingsPatch = { [K in keyof AppSettings]?: Partial<AppSettings[K]> }

export interface ConfirmOptions {
  title?: string
  message: string
  detail?: string
  confirmLabel?: string
  destructive?: boolean
}

export interface PickExecutableOptions {
  consoleName?: string
  currentPath?: string
}

type Unsubscribe = () => void

const invoke = <T>(channel: string, payload?: unknown): Promise<Result<T>> =>
  ipcRenderer.invoke(channel, payload) as Promise<Result<T>>

const subscribe = <T>(channel: string, listener: (payload: T) => void): Unsubscribe => {
  const handler = (_event: unknown, payload: T): void => listener(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

/**
 * The complete surface the interface can reach. Nothing else from Node or
 * Electron is exposed to the renderer.
 */
const api = {
  app: {
    info: () => invoke<AppInfo>(IpcChannel.appInfo),
    storageHealth: () => invoke<StorageHealth>(IpcChannel.storageHealth),
    openConfigFolder: () => invoke<boolean>(IpcChannel.openConfigFolder)
  },
  library: {
    list: () => invoke<ConfiguredConsole[]>(IpcChannel.libraryList),
    add: (input: AddConsoleInput) => invoke<ConfiguredConsole>(IpcChannel.libraryAdd, input),
    addMany: (inputs: AddConsoleInput[]) => invoke<BulkAddResult>(IpcChannel.libraryAddMany, inputs),
    update: (input: UpdateConsoleInput) => invoke<ConfiguredConsole>(IpcChannel.libraryUpdate, input),
    setEmulator: (input: SetEmulatorInput) => invoke<ConfiguredConsole>(IpcChannel.librarySetEmulator, input),
    remove: (id: string) => invoke<boolean>(IpcChannel.libraryRemove, id),
    clear: () => invoke<boolean>(IpcChannel.libraryClear),
    launch: (id: string) => invoke<LaunchResult>(IpcChannel.libraryLaunch, id),
    checkEmulators: () => invoke<Record<string, boolean>>(IpcChannel.libraryCheckEmulators)
  },
  backup: {
    /** Writes library and preferences to a file the user picks. Null if cancelled. */
    export: () => invoke<BackupExportResult | null>(IpcChannel.backupExport),
    /** Restores a backup the user picks. Null if cancelled. */
    import: () => invoke<BackupImportResult | null>(IpcChannel.backupImport)
  },
  settings: {
    get: () => invoke<AppSettings>(IpcChannel.settingsGet),
    update: (patch: SettingsPatch) => invoke<AppSettings>(IpcChannel.settingsUpdate, patch),
    reset: () => invoke<AppSettings>(IpcChannel.settingsReset),
    resetOnboarding: () => invoke<AppSettings>(IpcChannel.settingsResetOnboarding),
    completeOnboarding: () => invoke<AppSettings>(IpcChannel.settingsCompleteOnboarding)
  },
  updates: {
    /** The update flow as the main process currently sees it. */
    state: () => invoke<UpdateState>(IpcChannel.updatesGetState),
    /** Looks for a newer release now. */
    check: () => invoke<UpdateState>(IpcChannel.updatesCheck),
    /** Downloads the release found by the last check. */
    download: () => invoke<UpdateState>(IpcChannel.updatesDownload),
    cancel: () => invoke<UpdateState>(IpcChannel.updatesCancel),
    /** Starts the downloaded installer and closes EmuHub. */
    install: () => invoke<boolean>(IpcChannel.updatesInstall),
    /** Shows the downloaded file in the file manager. */
    reveal: () => invoke<boolean>(IpcChannel.updatesReveal),
    openReleasePage: () => invoke<boolean>(IpcChannel.updatesOpenReleasePage)
  },
  files: {
    pickExecutable: (options?: PickExecutableOptions) =>
      invoke<ExecutableInfo | null>(IpcChannel.dialogPickExecutable, options ?? {}),
    inspect: (filePath: string) => invoke<ExecutableInfo>(IpcChannel.fsInspectExecutable, filePath),
    reveal: (filePath: string) => invoke<boolean>(IpcChannel.fsRevealPath, filePath),
    confirm: (options: ConfirmOptions) => invoke<boolean>(IpcChannel.dialogConfirm, options)
  },
  window: {
    minimize: () => invoke<boolean>(IpcChannel.windowMinimize),
    toggleMaximize: () => invoke<boolean>(IpcChannel.windowToggleMaximize),
    close: () => invoke<boolean>(IpcChannel.windowClose),
    getState: () => invoke<WindowState>(IpcChannel.windowGetState)
  },
  events: {
    onWindowState: (listener: (state: WindowState) => void) => subscribe(IpcEvent.windowStateChanged, listener),
    onLibraryChanged: (listener: () => void) => subscribe(IpcEvent.libraryChanged, listener),
    onSettingsChanged: (listener: (settings: AppSettings) => void) => subscribe(IpcEvent.settingsChanged, listener),
    onSystemTheme: (listener: (dark: boolean) => void) => subscribe(IpcEvent.systemThemeChanged, listener),
    onNavigate: (listener: (route: string) => void) => subscribe(IpcEvent.navigate, listener),
    onNotify: (listener: (payload: NotifyPayload) => void) => subscribe(IpcEvent.notify, listener),
    onUpdateState: (listener: (state: UpdateState) => void) => subscribe(IpcEvent.updateStateChanged, listener)
  },
  platform: process.platform,
  /** True when the interface must draw its own window controls. */
  usesCustomTitleBar: process.platform !== 'darwin'
}

export type EmuHubApi = typeof api

contextBridge.exposeInMainWorld('emuhub', api)
