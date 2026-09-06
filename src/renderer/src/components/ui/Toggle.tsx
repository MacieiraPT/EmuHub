import { useId } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  disabledReason?: string
}

/** Labelled switch used throughout Settings. */
export function Toggle({ checked, onChange, label, description, disabled, disabledReason }: ToggleProps) {
  const descriptionId = useId()
  const help = disabled && disabledReason ? disabledReason : description

  return (
    <div className={`toggle-row${disabled ? ' toggle-row--disabled' : ''}`}>
      <div className="toggle-row__text">
        <span className="toggle-row__label">{label}</span>
        {help ? (
          <span className="toggle-row__description" id={descriptionId}>
            {help}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={help ? descriptionId : undefined}
        className="toggle"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__thumb" />
      </button>
    </div>
  )
}
