import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export interface Toast {
  id: string
  tone: ToastTone
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

interface ToastContextValue {
  toasts: Toast[]
  notify: (toast: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DURATIONS: Record<ToastTone, number> = {
  success: 3200,
  info: 3800,
  warning: 6000,
  error: 8000
}

const MAX_VISIBLE = 3

/**
 * In-app notifications. Toasts are deliberately short lived and capped, so
 * routine actions confirm themselves without stacking up in front of the user.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { ...toast, id }])
      const timeout = window.setTimeout(() => dismiss(id), DURATIONS[toast.tone])
      timers.current.set(id, timeout)
      return id
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
