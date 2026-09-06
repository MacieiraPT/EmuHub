import { useEffect, useState } from 'react'
import { bridge } from '../lib/api'
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from './icons'

/**
 * Custom title bar for the frameless Windows and Linux windows. It keeps the
 * standard desktop behaviours: the bar is draggable, double-clicking it toggles
 * maximise, and minimise/maximise/close sit where users expect them.
 * On macOS the native traffic lights are used instead.
 */
export function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const custom = bridge.usesCustomTitleBar

  useEffect(() => {
    void bridge.window.getState().then((result) => {
      if (result.ok) setMaximized(result.data.maximized)
    })
    return bridge.events.onWindowState((state) => setMaximized(state.maximized))
  }, [])

  return (
    <div className={`titlebar${custom ? '' : ' titlebar--native'}`}>
      <div
        className="titlebar__drag"
        onDoubleClick={() => {
          if (custom) void bridge.window.toggleMaximize()
        }}
      >
        <span className="titlebar__title">EmuHub</span>
      </div>

      {custom ? (
        <div className="titlebar__controls">
          <button
            type="button"
            className="titlebar__button"
            onClick={() => void bridge.window.minimize()}
            aria-label="Minimize window"
            title="Minimize"
          >
            <MinimizeIcon size={16} />
          </button>
          <button
            type="button"
            className="titlebar__button"
            onClick={() => void bridge.window.toggleMaximize()}
            aria-label={maximized ? 'Restore window' : 'Maximize window'}
            title={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? <RestoreIcon size={16} /> : <MaximizeIcon size={16} />}
          </button>
          <button
            type="button"
            className="titlebar__button titlebar__button--close"
            onClick={() => void bridge.window.close()}
            aria-label="Close window"
            title="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="brand-mark">
      <defs>
        <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent-h) var(--accent-s) 76%)" />
          <stop offset="100%" stopColor="hsl(var(--accent-h) var(--accent-s) 55%)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#brand-gradient)" />
      <circle cx="10.5" cy="20" r="4.6" fill="#fff" />
      <circle cx="21.5" cy="20" r="4.6" fill="#fff" />
      <rect x="7" y="11" width="18" height="9.5" rx="4.4" fill="#fff" />
      <rect x="10.6" y="13.6" width="1.9" height="5.2" rx="0.95" fill="url(#brand-gradient)" />
      <rect x="8.95" y="15.25" width="5.2" height="1.9" rx="0.95" fill="url(#brand-gradient)" />
      <circle cx="20" cy="14.9" r="1.5" fill="url(#brand-gradient)" />
      <circle cx="22.4" cy="17.6" r="1.5" fill="url(#brand-gradient)" />
    </svg>
  )
}
