import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'

export interface MenuAction {
  label: string
  icon?: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

interface MenuProps {
  trigger: (props: { onClick: (event: ReactMouseEvent) => void; 'aria-expanded': boolean; id: string }) => ReactNode
  actions: MenuAction[]
  align?: 'start' | 'end'
}

/** Lightweight dropdown menu with roving keyboard focus. */
export function Menu({ trigger, actions, align = 'end' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

      const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
      if (items.length === 0) return
      event.preventDefault()
      const index = items.indexOf(document.activeElement as HTMLElement)
      const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length
      items[next]?.focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    window.setTimeout(() => listRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(), 0)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  return (
    <div className="menu" ref={containerRef}>
      {trigger({
        id: triggerId,
        'aria-expanded': open,
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((value) => !value)
        }
      })}
      {open ? (
        <div
          ref={listRef}
          className={`menu__list menu__list--${align}`}
          role="menu"
          aria-labelledby={triggerId}
          onClick={(event) => event.stopPropagation()}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className={`menu__item${action.destructive ? ' menu__item--destructive' : ''}`}
              disabled={action.disabled}
              onClick={(event) => {
                event.stopPropagation()
                setOpen(false)
                action.onSelect()
              }}
            >
              {action.icon ? <span className="menu__icon">{action.icon}</span> : null}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
