import { Menu, app } from 'electron'
import type { WindowManager } from './window'
import { IpcEvent } from '@shared/ipc'

/**
 * EmuHub is frameless on Windows and Linux, where the in-app title bar carries
 * every action, so no menu bar is installed there. macOS always needs an
 * application menu for standard system behaviour (Cmd+Q, Cmd+H, editing keys).
 */
export function installApplicationMenu(windows: WindowManager): void {
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null)
    return
  }

  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings…',
          accelerator: 'Command+,',
          click: () => windows.send(IpcEvent.navigate, '/settings')
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        {
          label: 'Library',
          accelerator: 'Command+1',
          click: () => windows.send(IpcEvent.navigate, '/')
        },
        {
          label: 'Consoles',
          accelerator: 'Command+2',
          click: () => windows.send(IpcEvent.navigate, '/consoles')
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    },
    { role: 'windowMenu' }
  ])

  Menu.setApplicationMenu(menu)
}
