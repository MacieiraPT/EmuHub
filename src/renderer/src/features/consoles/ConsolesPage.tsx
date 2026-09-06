import { useMemo, useState } from 'react'
import type { LibrarySort } from '@shared/types'
import { sortEntries, SORT_LABELS } from '@shared/library'
import { useLibrary } from '../../state/LibraryContext'
import { useSettings } from '../../state/SettingsContext'
import { PageHeader } from '../../components/PageHeader'
import { ConsoleCard } from '../../components/ConsoleCard'
import { ConsoleRow } from './ConsoleRow'
import { AddConsoleDialog } from './AddConsoleDialog'
import { Button } from '../../components/ui/Button'
import { SearchField } from '../../components/ui/SearchField'
import { Select } from '../../components/ui/Select'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState } from '../../components/ui/EmptyState'
import { GridIcon, LayersIcon, PlusIcon, SearchIcon } from '../../components/icons'
import { pluralize } from '../../lib/format'
import { useConsoleActions } from './useConsoleActions'
import { useSearchShortcut } from '../../hooks/useSearchShortcut'

type ViewMode = 'list' | 'grid'

const SORT_OPTIONS = (Object.keys(SORT_LABELS) as LibrarySort[]).map((value) => ({
  value,
  label: SORT_LABELS[value]
}))

export function ConsolesPage() {
  const { entries, health, launching } = useLibrary()
  const { settings } = useSettings()
  const actions = useConsoleActions()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<LibrarySort>(settings.library.defaultSort)
  const [mode, setMode] = useState<ViewMode>('list')
  const [adding, setAdding] = useState(false)
  const searchRef = useSearchShortcut()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? entries.filter((view) =>
          [
            view.displayName,
            view.definition?.manufacturer,
            view.emulator?.name,
            view.emulator?.executablePath,
            ...(view.definition?.aliases ?? [])
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle)
        )
      : entries
    return sortEntries(filtered, sort)
  }, [entries, query, sort])

  return (
    <div className="page">
      <PageHeader
        title="Consoles"
        subtitle={
          entries.length === 0
            ? 'Every console you configure appears here'
            : `${pluralize(entries.length, 'console')} in your library`
        }
        actions={
          <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => setAdding(true)}>
            Add Console
          </Button>
        }
        toolbar={
          entries.length > 0 ? (
            <>
              <SearchField
                ref={searchRef}
                value={query}
                onValueChange={setQuery}
                label="Search consoles"
                placeholder="Search by console, emulator or path…"
                shortcutHint="Ctrl F"
                className="page-header__search"
              />
              <div className="page-header__filters">
                <Select value={sort} options={SORT_OPTIONS} onChange={setSort} label="Sort by" hideLabel />
                <SegmentedControl<ViewMode>
                  size="sm"
                  label="View mode"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'list', label: 'List', icon: <LayersIcon size={15} /> },
                    { value: 'grid', label: 'Grid', icon: <GridIcon size={15} /> }
                  ]}
                />
              </div>
            </>
          ) : null
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={<LayersIcon size={26} />}
          title="No consoles configured"
          description="Add a console to point EmuHub at an emulator you already have installed. You can add as many as you like."
          action={
            <Button variant="primary" size="lg" icon={<PlusIcon size={16} />} onClick={() => setAdding(true)}>
              Add Console
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={<SearchIcon size={22} />}
          title={`No consoles match “${query}”`}
          description="Try a different search term, or clear it to see everything again."
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : mode === 'grid' ? (
        <div className="console-grid">
          {visible.map((view) => (
            <ConsoleCard
              key={view.entry.id}
              view={view}
              healthy={health[view.entry.id]}
              launching={launching === view.entry.id}
              actions={actions}
            />
          ))}
        </div>
      ) : (
        <div className="console-list">
          <div className="console-list__head" aria-hidden="true">
            <span>Console</span>
            <span>Emulator</span>
            <span>Status</span>
            <span />
          </div>
          {visible.map((view) => (
            <ConsoleRow
              key={view.entry.id}
              view={view}
              healthy={health[view.entry.id]}
              launching={launching === view.entry.id}
              actions={actions}
            />
          ))}
        </div>
      )}

      <AddConsoleDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
