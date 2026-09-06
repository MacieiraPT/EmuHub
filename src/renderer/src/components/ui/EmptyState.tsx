import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  secondaryAction?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, secondaryAction, compact }: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}`}>
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {action || secondaryAction ? (
        <div className="empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
