export type StatusTone = 'ready' | 'missing' | 'unconfigured' | 'neutral'

const LABELS: Record<StatusTone, string> = {
  ready: 'Ready',
  missing: 'Emulator missing',
  unconfigured: 'Not set up',
  neutral: 'Unknown'
}

interface StatusPillProps {
  tone: StatusTone
  label?: string
  size?: 'sm' | 'md'
}

export function StatusPill({ tone, label, size = 'md' }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${tone} status-pill--${size}`}>
      <span className="status-pill__dot" aria-hidden="true" />
      {label ?? LABELS[tone]}
    </span>
  )
}
