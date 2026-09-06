import type { ReactNode } from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
}

/** Radio group styled as a segmented control; fully keyboard operable. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md'
}: SegmentedControlProps<T>) {
  return (
    <div className={`segmented segmented--${size}`} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`segmented__option${value === option.value ? ' is-selected' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
