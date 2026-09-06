import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  trailingIcon?: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon,
    trailingIcon,
    loading = false,
    fullWidth = false,
    className = '',
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`btn btn--${variant} btn--${size}${fullWidth ? ' btn--block' : ''}${
        loading ? ' btn--loading' : ''
      } ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : icon}
      {children ? <span className="btn__label">{children}</span> : null}
      {trailingIcon}
    </button>
  )
})

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'ghost' | 'surface' | 'danger'
  size?: 'sm' | 'md'
}

/** Icon-only button. `label` is required so the control is always announced. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`icon-btn icon-btn--${variant} icon-btn--${size} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  )
})
