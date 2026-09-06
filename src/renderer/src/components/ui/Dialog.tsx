import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './Button'
import { CloseIcon } from '../icons'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Set when a background task must finish before the dialog can close. */
  busy?: boolean
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal dialog: focus moves in on open, is trapped while open and
 * returns to the trigger on close. Escape always closes unless the dialog is
 * busy with work the user started.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', busy }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const requestClose = useCallback(() => {
    if (!busy) onClose()
  }, [busy, onClose])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const initial = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    initial?.focus()

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        requestClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null
      )
      if (focusable.length === 0) return

      const first = focusable[0] as HTMLElement
      const last = focusable[focusable.length - 1] as HTMLElement
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused.current?.focus?.()
    }
  }, [open, requestClose])

  if (!open) return null

  return createPortal(
    <div className="dialog-layer" role="presentation">
      <div className="dialog-backdrop" onClick={requestClose} />
      <div
        ref={panelRef}
        className={`dialog dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
      >
        <header className="dialog__header">
          <div className="dialog__heading">
            <h2 id="dialog-title">{title}</h2>
            {description ? (
              <p id="dialog-description" className="dialog__description">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Close dialog" onClick={requestClose} disabled={busy}>
            <CloseIcon size={17} />
          </IconButton>
        </header>
        <div className="dialog__body">{children}</div>
        {footer ? <footer className="dialog__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body
  )
}
