import { useMemo, useState } from 'react'
import type { LibrarySort } from '@shared/types'
import { sortEntries, SORT_LABELS } from '@shared/library'
import { useLibrary } from '../../state/LibraryContext'
import { useSettings } from '../../state/SettingsContext'
import { PageHeader } from '../../components/PageHeader'
import { ConsoleCard, statusOf } from '../../components/ConsoleCard'
import { ConsoleRow } from './ConsoleRow'
import { AddConsoleDialog } from './AddConsoleDialog'
import { Button } from '../../components/ui/Button'
import { SearchField } from '../../components/ui/SearchField'
import { Select } from '../../components/ui/Select'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState } from '../../components/ui/EmptyState'
import { AlertIcon, GridIcon, LayersIcon, PlusIcon, SearchIcon } from '../../components/icons'
import { pluralize } from '../../lib/format'
import { useConsoleActions } from './useConsoleActions'
import { useSearchShortcut } from '../../hooks/useSearchShortcut'

type ViewMode = 'list' | 'grid'

const SORT_OPTIONS = (Object.keys(SORT_LABELS) as LibrarySort[]).map((value) => ({
  value,
  label: SORT_LABELS[value]
}))

/** The library: every console the user has configured, and what it launches. */
export function MyEmulatorsPage() {
  const { entries, health, loading, launching } = useLibrary()
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

  const missingCount = useMemo(
    () => entries.filter((view) => statusOf(view, health[view.entry.id]) === 'missing').length,
    [entries, health]
  )

  const readyCount = entries.filter((view) => view.emulator).length

  return (
    <div className="page">
      <PageHeader
        title="My Emulators"
        subtitle={
          loading
            ? 'Loading your consoles…'
            : entries.length === 0
              ? 'Every console you configure appears here'
              : `${pluralize(entries.length, 'console')} · ${readyCount} ready to launch`
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
                label="Search your consoles"
                placeholder="Search consoles or emulators…"
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

      {missingCount > 0 && settings.library.showMissingWarnings ? (
        <div className="banner banner--warning" role="status">
          <AlertIcon size={17} />
          <div>
            <p className="banner__title">
              {missingCount === 1 ? 'One emulator could not be found' : `${missingCount} emulators could not be found`}
            </p>
            <p className="banner__text">
              Their programs may have been moved or uninstalled. Open a console and choose its emulator again to
              reconnect it — nothing on your computer has been changed.
            </p>
          </div>
        </div>
      ) : null}

      {entries.length === 0 && !loading ? (
        <EmptyState
          icon={<LayersIcon size={26} />}
          title="Your library is empty"
          description="Add the consoles you emulate and point EmuHub at the programs already installed on this PC. Everything then launches from one place."
          action={
            <Button variant="primary" size="lg" icon={<PlusIcon size={16} />} onClick={() => setAdding(true)}>
              Add your first console
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
          <button type="button" className="add-card" onClick={() => setAdding(true)}>
            <span className="add-card__icon">
              <PlusIcon size={22} />
            </span>
            <span className="add-card__title">Add console</span>
            <span className="add-card__text">Bring another emulator into your library</span>
          </button>
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
