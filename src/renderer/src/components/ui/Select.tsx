import { useId } from 'react'
import { ChevronDownIcon } from '../icons'

interface SelectProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
  hideLabel?: boolean
}

/** Native select, restyled — keeps platform keyboard behaviour intact. */
export function Select<T extends string>({ value, options, onChange, label, hideLabel }: SelectProps<T>) {
  const id = useId()
  return (
    <div className="select-field">
      <label className={hideLabel ? 'visually-hidden' : 'select-field__label'} htmlFor={id}>
        {label}
      </label>
      <div className="select-field__control">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={15} className="select-field__chevron" />
      </div>
    </div>
  )
}
