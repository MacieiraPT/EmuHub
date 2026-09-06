import { Menu, Tray, app, nativeImage } from 'electron'
import type { WindowManager } from './window'
import { resolveTrayIconPath } from './window'
import { IpcEvent } from '@shared/ipc'

/**
 * Owns the optional tray icon. It only exists while the user has a tray option
 * switched on, so EmuHub does not sit in the notification area uninvited.
 */
export class TrayController {
  private tray: Tray | null = null

  constructor(private readonly windows: WindowManager) {}

  sync(enabled: boolean): void {
    if (enabled) this.ensure()
    else this.destroy()
  }

  private ensure(): void {
    if (this.tray) return
    try {
      const image = nativeImage.createFromPath(resolveTrayIconPath())
      this.tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image)
      this.tray.setToolTip('EmuHub')
      this.tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: 'Open EmuHub', click: () => this.windows.show() },
          {
            label: 'Settings',
            click: () => {
              this.windows.show()
              this.windows.send(IpcEvent.navigate, '/settings')
            }
          },
          { type: 'separator' },
          {
            label: 'Quit EmuHub',
            click: () => {
              this.windows.markQuitting()
              app.quit()
            }
          }
        ])
      )
      this.tray.on('click', () => this.windows.show())
      this.tray.on('double-click', () => this.windows.show())
    } catch (error) {
      console.error('[emuhub] tray icon unavailable:', error)
      this.tray = null
    }
  }

  private destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }

  dispose(): void {
    this.destroy()
  }
}
