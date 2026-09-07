import path from 'node:path'
import { BrowserWindow, screen, shell, app } from 'electron'
import { JsonStore } from './services/jsonStore'
import { IpcEvent } from '@shared/ipc'
import type { ThemePreference } from '@shared/types'

interface WindowBounds {
  width: number
  height: number
  x: number | null
  y: number | null
  maximized: boolean
}

const DEFAULT_BOUNDS: WindowBounds = { width: 1280, height: 820, x: null, y: null, maximized: false }
const MIN_WIDTH = 880
const MIN_HEIGHT = 600

/** Background colours match the renderer shell so there is no flash on open. */
const BACKGROUND = { oled: '#000000', dark: '#101116', light: '#f4f5f8' }

/**
 * `system` cannot be resolved before the window exists, so it takes the dark
 * shell: the window is painted behind a renderer that has not styled itself
 * yet, and the dark tone is the less jarring of the two for that instant.
 */
function backgroundFor(theme: ThemePreference): string {
  if (theme === 'oled') return BACKGROUND.oled
  return theme === 'light' ? BACKGROUND.light : BACKGROUND.dark
}

export class WindowManager {
  private window: BrowserWindow | null = null
  private readonly boundsStore: JsonStore<WindowBounds>
  private quitting = false

  constructor(configDirectory: string) {
    this.boundsStore = new JsonStore<WindowBounds>({
      filePath: path.join(configDirectory, 'window-state.json'),
      createDefault: () => ({ ...DEFAULT_BOUNDS }),
      migrate: (raw) => {
        if (!raw || typeof raw !== 'object') return null
        const value = raw as Partial<WindowBounds>
        return {
          width: numberOr(value.width, DEFAULT_BOUNDS.width),
          height: numberOr(value.height, DEFAULT_BOUNDS.height),
          x: typeof value.x === 'number' ? value.x : null,
          y: typeof value.y === 'number' ? value.y : null,
          maximized: value.maximized === true
        }
      }
    })
  }

  get mainWindow(): BrowserWindow | null {
    return this.window
  }

  markQuitting(): void {
    this.quitting = true
  }

  async create(options: {
    startHidden: boolean
    theme: ThemePreference
    closeToTray: () => boolean
    minimizeToTray: () => boolean
  }): Promise<BrowserWindow> {
    const bounds = await this.restoreBounds()

    const window = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      ...(bounds.x !== null && bounds.y !== null ? { x: bounds.x, y: bounds.y } : {}),
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      show: false,
      backgroundColor: backgroundFor(options.theme),
      title: 'EmuHub',
      autoHideMenuBar: true,
      frame: process.platform === 'darwin',
      ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' as const } : {}),
      trafficLightPosition: { x: 16, y: 18 },
      icon: resolveIconPath(),
      webPreferences: {
        preload: path.join(import.meta.dirname, '../preload/index.cjs'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: false
      }
    })

    this.window = window

    window.once('ready-to-show', () => {
      if (bounds.maximized) window.maximize()
      if (!options.startHidden) window.show()
    })

    // External links open in the user's browser; the app window never navigates away.
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
      return { action: 'deny' }
    })
    window.webContents.on('will-navigate', (event, url) => {
      if (url !== window.webContents.getURL()) {
        event.preventDefault()
        if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
      }
    })

    const broadcast = (): void => this.broadcastState()
    window.on('maximize', broadcast)
    window.on('unmaximize', broadcast)
    window.on('enter-full-screen', broadcast)
    window.on('leave-full-screen', broadcast)
    window.on('focus', broadcast)
    window.on('blur', broadcast)

    window.on('close', (event) => {
      if (!this.quitting && options.closeToTray()) {
        event.preventDefault()
        window.hide()
        return
      }
      void this.persistBounds()
    })

    window.on('minimize', () => {
      if (options.minimizeToTray()) window.hide()
    })

    window.on('resize', () => this.schedulePersist())
    window.on('move', () => this.schedulePersist())
    window.on('closed', () => {
      this.window = null
    })

    await this.loadRenderer(window)
    return window
  }

  private async loadRenderer(window: BrowserWindow): Promise<void> {
    const devServerUrl = process.env['ELECTRON_RENDERER_URL']
    if (!app.isPackaged && devServerUrl) {
      await window.loadURL(devServerUrl)
    } else {
      await window.loadFile(path.join(import.meta.dirname, '../renderer/index.html'))
    }
  }

  show(): void {
    const window = this.window
    if (!window) return
    if (window.isMinimized()) window.restore()
    if (!window.isVisible()) window.show()
    window.focus()
  }

  toggleMaximize(): void {
    const window = this.window
    if (!window) return
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  }

  send(channel: string, payload?: unknown): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, payload)
    }
  }

  getState() {
    const window = this.window
    return {
      maximized: window?.isMaximized() ?? false,
      focused: window?.isFocused() ?? false,
      fullScreen: window?.isFullScreen() ?? false
    }
  }

  private broadcastState(): void {
    this.send(IpcEvent.windowStateChanged, this.getState())
  }

  private persistTimer: NodeJS.Timeout | null = null

  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer)
    this.persistTimer = setTimeout(() => void this.persistBounds(), 400)
  }

  private async persistBounds(): Promise<void> {
    const window = this.window
    if (!window || window.isDestroyed() || window.isMinimized()) return
    const maximized = window.isMaximized()
    const normal = window.getNormalBounds()
    try {
      await this.boundsStore.replace({
        width: normal.width,
        height: normal.height,
        x: normal.x,
        y: normal.y,
        maximized
      })
    } catch {
      // Window geometry is a convenience; failing to store it must never
      // interrupt the user.
    }
  }

  /** Clamps stored geometry to a display that currently exists. */
  private async restoreBounds(): Promise<WindowBounds> {
    let stored: WindowBounds
    try {
      stored = (await this.boundsStore.load()).data
    } catch {
      stored = { ...DEFAULT_BOUNDS }
    }

    const width = Math.max(MIN_WIDTH, Math.round(stored.width))
    const height = Math.max(MIN_HEIGHT, Math.round(stored.height))

    if (stored.x === null || stored.y === null) {
      return { ...stored, width, height }
    }

    const visible = screen.getAllDisplays().some((display) => {
      const area = display.workArea
      return (
        (stored.x as number) < area.x + area.width &&
        (stored.x as number) + width > area.x &&
        (stored.y as number) < area.y + area.height &&
        (stored.y as number) + height > area.y
      )
    })

    return visible ? { ...stored, width, height } : { ...stored, width, height, x: null, y: null }
  }
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

export function resolveIconPath(): string {
  const fileName = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  return app.isPackaged
    ? path.join(process.resourcesPath, 'resources', fileName)
    : path.join(import.meta.dirname, '../../resources', fileName)
}

export function resolveTrayIconPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'resources', 'tray.png')
    : path.join(import.meta.dirname, '../../resources', 'tray.png')
}
