import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Secondary row rendered under the title, typically filters. */
  toolbar?: ReactNode
}

export function PageHeader({ title, subtitle, actions, toolbar }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        <div className="page-header__text">
          <h1>{title}</h1>
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
      {toolbar ? <div className="page-header__toolbar">{toolbar}</div> : null}
    </header>
  )
}
