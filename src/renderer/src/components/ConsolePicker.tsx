import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { CONSOLE_CATALOG, listGenerations, listManufacturers } from '@shared/data/consoles'
import { matchesQuery } from '@shared/library'
import type { ConsoleDefinition } from '@shared/types'
import { generationLabel, pluralize } from '../lib/format'
import { ConsoleArt } from './artwork/ConsoleArt'
import { SearchField } from './ui/SearchField'
import { Select } from './ui/Select'
import { CheckIcon, SearchIcon } from './icons'
import { EmptyState } from './ui/EmptyState'

interface ConsolePickerProps {
  selectedIds: string[]
  onToggle: (consoleId: string) => void
  /** Consoles already in the library: shown, but not selectable again. */
  disabledIds?: Set<string>
  disabledLabel?: string
  autoFocus?: boolean
  /** Renders a compact grid for use inside a dialog. */
  dense?: boolean
}

/**
 * Searchable browser over the console catalog. Used by first-run setup and by
 * "Add console", so both flows always show the same platforms.
 */
export function ConsolePicker({
  selectedIds,
  onToggle,
  disabledIds,
  disabledLabel = 'Already added',
  autoFocus = false,
  dense = false
}: ConsolePickerProps) {
  const [query, setQuery] = useState('')
  const [manufacturer, setManufacturer] = useState('all')
  const [generation, setGeneration] = useState('all')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) searchRef.current?.focus()
  }, [autoFocus])

  const manufacturers = useMemo(
    () => [{ value: 'all', label: 'All manufacturers' }, ...listManufacturers().map((name) => ({ value: name, label: name }))],
    []
  )

  const generations = useMemo(
    () => [
      { value: 'all', label: 'All generations' },
      ...listGenerations().map((gen) => ({ value: String(gen), label: generationLabel(gen) })),
      { value: 'computer', label: 'Home computers' }
    ],
    []
  )

  const results = useMemo(() => {
    return CONSOLE_CATALOG.filter((definition) => {
      if (!matchesQuery(definition, query)) return false
      if (manufacturer !== 'all' && definition.manufacturer !== manufacturer) return false
      if (generation === 'computer') return definition.generation === null
      if (generation !== 'all' && String(definition.generation) !== generation) return false
      return true
    })
  }, [query, manufacturer, generation])

  const selected = new Set(selectedIds)

  return (
    <div className={`picker${dense ? ' picker--dense' : ''}`}>
      <div className="picker__toolbar">
        <SearchField
          ref={searchRef}
          value={query}
          onValueChange={setQuery}
          label="Search consoles"
          placeholder="Search consoles, manufacturers or emulators…"
          className="picker__search"
        />
        <div className="picker__filters">
          <Select value={manufacturer} options={manufacturers} onChange={setManufacturer} label="Manufacturer" hideLabel />
          <Select value={generation} options={generations} onChange={setGeneration} label="Generation" hideLabel />
        </div>
      </div>

      <div className="picker__status" aria-live="polite">
        <span>{pluralize(results.length, 'console')} shown</span>
        {selectedIds.length > 0 ? (
          <span className="picker__counter">{pluralize(selectedIds.length, 'console')} selected</span>
        ) : null}
      </div>

      {results.length === 0 ? (
        <EmptyState
          compact
          icon={<SearchIcon size={22} />}
          title="No consoles match that search"
          description="Try a different name, or clear the filters to see the full list of supported platforms."
        />
      ) : (
        <div className="picker__grid">
          {results.map((definition) => (
            <ConsoleTile
              key={definition.id}
              definition={definition}
              selected={selected.has(definition.id)}
              disabled={disabledIds?.has(definition.id) ?? false}
              disabledLabel={disabledLabel}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ConsoleTileProps {
  definition: ConsoleDefinition
  selected: boolean
  disabled: boolean
  disabledLabel: string
  onToggle: (consoleId: string) => void
}

const ConsoleTile = memo(function ConsoleTile({
  definition,
  selected,
  disabled,
  disabledLabel,
  onToggle
}: ConsoleTileProps) {
  return (
    <button
      type="button"
      className={`console-tile${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onToggle(definition.id)}
    >
      <span className="console-tile__art">
        <ConsoleArt definition={definition} variant="thumb" />
        {selected ? (
          <span className="console-tile__check" aria-hidden="true">
            <CheckIcon size={13} />
          </span>
        ) : null}
      </span>
      <span className="console-tile__text">
        <span className="console-tile__name truncate">{definition.name}</span>
        <span className="console-tile__meta truncate">
          {disabled ? disabledLabel : `${definition.manufacturer} · ${definition.releaseYear}`}
        </span>
      </span>
    </button>
  )
})
