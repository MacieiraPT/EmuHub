import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { SearchIcon, CloseIcon } from '../icons'

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onValueChange: (value: string) => void
  label?: string
  shortcutHint?: string
}

/** Search input that filters as you type — no submit step. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onValueChange, label = 'Search', placeholder = 'Search…', shortcutHint, className = '', ...props },
  ref
) {
  const id = useId()

  return (
    <div className={`search-field ${className}`.trim()}>
      <SearchIcon className="search-field__icon" size={16} />
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        type="search"
        className="search-field__input"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value.length > 0) {
            event.stopPropagation()
            onValueChange('')
          }
        }}
        {...props}
      />
      {value.length > 0 ? (
        <button type="button" className="search-field__clear" onClick={() => onValueChange('')} aria-label="Clear search">
          <CloseIcon size={14} />
        </button>
      ) : shortcutHint ? (
        <kbd className="search-field__hint">{shortcutHint}</kbd>
      ) : null}
    </div>
  )
})
