import { useToast } from '../../state/ToastContext'
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from '../icons'
import { IconButton } from './Button'

const ICONS = {
  success: <CheckIcon size={16} />,
  info: <InfoIcon size={16} />,
  warning: <AlertIcon size={16} />,
  error: <AlertIcon size={16} />
}

export function Toasts() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status" aria-live="polite">
          <span className="toast__icon">{ICONS[toast.tone]}</span>
          <div className="toast__content">
            <p className="toast__title">{toast.title}</p>
            {toast.description ? <p className="toast__description">{toast.description}</p> : null}
            {toast.action ? (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
          <IconButton label="Dismiss notification" size="sm" onClick={() => dismiss(toast.id)}>
            <CloseIcon size={14} />
          </IconButton>
        </div>
      ))}
    </div>
  )
}
