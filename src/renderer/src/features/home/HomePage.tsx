import { useMemo, useState } from 'react'
import { useLibrary } from '../../state/LibraryContext'
import { useSettings } from '../../state/SettingsContext'
import { sortEntries } from '@shared/library'
import { ConsoleCard, statusOf } from '../../components/ConsoleCard'
import { PageHeader } from '../../components/PageHeader'
import { AddConsoleDialog } from '../consoles/AddConsoleDialog'
import { Button } from '../../components/ui/Button'
import { SearchField } from '../../components/ui/SearchField'
import { EmptyState } from '../../components/ui/EmptyState'
import { AlertIcon, LayersIcon, PlusIcon, SearchIcon } from '../../components/icons'
import { pluralize } from '../../lib/format'
import { useConsoleActions } from '../consoles/useConsoleActions'
import { useSearchShortcut } from '../../hooks/useSearchShortcut'

export function HomePage() {
  const { entries, health, loading, launching } = useLibrary()
  const { settings } = useSettings()
  const actions = useConsoleActions()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const searchRef = useSearchShortcut()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? entries.filter((view) =>
          [view.displayName, view.definition?.manufacturer, view.emulator?.name, ...(view.definition?.aliases ?? [])]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle)
        )
      : entries
    return sortEntries(filtered, settings.library.defaultSort)
  }, [entries, query, settings.library.defaultSort])

  const missingCount = useMemo(
    () => entries.filter((view) => statusOf(view, health[view.entry.id]) === 'missing').length,
    [entries, health]
  )

  const readyCount = entries.length - entries.filter((view) => !view.emulator).length

  return (
    <div className="page">
      <PageHeader
        title="Your library"
        subtitle={
          loading
            ? 'Loading your consoles…'
            : entries.length === 0
              ? 'No consoles configured yet'
              : `${pluralize(entries.length, 'console')} · ${readyCount} ready to launch`
        }
        actions={
          <>
            {entries.length > 0 ? (
              <SearchField
                ref={searchRef}
                value={query}
                onValueChange={setQuery}
                label="Search your consoles"
                placeholder="Search your library…"
                shortcutHint="Ctrl F"
                className="page-header__search"
              />
            ) : null}
            <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => setAdding(true)}>
              Add Console
            </Button>
          </>
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
          description="Try a different name, or clear the search to see your whole library."
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
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
      )}

      <AddConsoleDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
