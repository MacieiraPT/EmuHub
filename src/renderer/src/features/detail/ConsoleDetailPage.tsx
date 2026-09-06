import { useState } from 'react'
import { Link, useNavigate, useParams } from '../../router'
import { useLibrary, useLibraryEntry } from '../../state/LibraryContext'
import { bridge, describeError, unwrap } from '../../lib/api'
import { useToast } from '../../state/ToastContext'
import { ConsoleArt } from '../../components/artwork/ConsoleArt'
import { EmulatorPathField } from '../../components/EmulatorPathField'
import { Button, IconButton } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState } from '../../components/ui/EmptyState'
import { statusOf } from '../../components/ConsoleCard'
import {
  AlertIcon,
  ChevronLeftIcon,
  EditIcon,
  FolderIcon,
  PlayIcon,
  StarIcon,
  TrashIcon
} from '../../components/icons'
import { formatDate, formatRelative, generationLabel, shortenPath } from '../../lib/format'

export function ConsoleDetailPage() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { health, launching, loading, refresh, launch, relocateEmulator, removeConsole } = useLibrary()
  const view = useLibraryEntry(entryId)

  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  if (!view) {
    return (
      <div className="page">
        <EmptyState
          icon={<AlertIcon size={24} />}
          title={loading ? 'Loading console…' : 'That console is no longer in your library'}
          description={
            loading
              ? 'One moment.'
              : 'It may have been removed. Your other consoles are still available from the library.'
          }
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to library
            </Button>
          }
        />
      </div>
    )
  }

  const { entry, definition, emulator, displayName } = view
  const status = statusOf(view, health[entry.id])

  const openEditor = (): void => {
    setNameDraft(entry.displayName ?? '')
    setEditing(true)
  }

  const saveName = async (): Promise<void> => {
    const trimmed = nameDraft.trim()
    try {
      await unwrap(bridge.library.update({ id: entry.id, displayName: trimmed.length > 0 ? trimmed : null }))
      await refresh()
      notify({ tone: 'success', title: 'Console renamed' })
      setEditing(false)
    } catch (error) {
      notify({ tone: 'error', title: 'Could not rename this console', ...describeError(error) })
    }
  }

  const revealEmulator = async (executablePath: string): Promise<void> => {
    try {
      await unwrap(bridge.files.reveal(executablePath))
    } catch (error) {
      notify({ tone: 'warning', title: 'Could not open that folder', ...describeError(error) })
    }
  }

  const applyEmulatorPath = async (executablePath: string): Promise<void> => {
    try {
      await unwrap(bridge.library.setEmulator({ consoleEntryId: entry.id, executablePath }))
      await refresh()
      notify({ tone: 'success', title: 'Emulator updated' })
    } catch (error) {
      notify({ tone: 'error', title: 'Could not save that emulator', ...describeError(error) })
    }
  }

  const toggleFavorite = async (): Promise<void> => {
    try {
      await unwrap(bridge.library.update({ id: entry.id, favorite: !entry.favorite }))
      await refresh()
    } catch (error) {
      notify({ tone: 'warning', title: 'Could not update this console', ...describeError(error) })
    }
  }

  return (
    <div className="page page--detail">
      <Link to="/" className="detail__back">
        <ChevronLeftIcon size={16} />
        Back to library
      </Link>

      <section className="detail__hero">
        <div className="detail__hero-art">
          <ConsoleArt definition={definition} variant="hero" />
        </div>
        <div className="detail__hero-body">
          <p className="detail__eyebrow">{definition?.manufacturer ?? 'Console'}</p>
          <div className="detail__title-row">
            <h1>{displayName}</h1>
            <IconButton
              label={entry.favorite ? 'Remove from favourites' : 'Mark as favourite'}
              variant="surface"
              onClick={() => void toggleFavorite()}
            >
              <StarIcon size={17} filled={entry.favorite} />
            </IconButton>
          </div>
          <p className="detail__subtitle">
            {definition
              ? `${generationLabel(definition.generation)} · Released ${definition.releaseYear}`
              : 'Console details unavailable'}
          </p>

          <div className="detail__status">
            <StatusPill tone={status} label={status === 'neutral' ? 'Checking emulator…' : undefined} />
            {emulator ? <span className="detail__emulator-name">{emulator.name}</span> : null}
          </div>

          <div className="detail__actions">
            <Button
              variant="primary"
              size="lg"
              icon={<PlayIcon size={15} />}
              loading={launching === entry.id}
              disabled={!emulator}
              onClick={() => void launch(entry.id)}
            >
              Launch emulator
            </Button>
            <Button variant="secondary" icon={<EditIcon size={15} />} onClick={openEditor}>
              Edit configuration
            </Button>
            <Button
              variant="ghost"
              icon={<TrashIcon size={15} />}
              onClick={async () => {
                const removed = await removeConsole(entry.id)
                if (removed) navigate('/')
              }}
            >
              Remove console
            </Button>
          </div>
        </div>
      </section>

      {status === 'missing' ? (
        <div className="banner banner--warning" role="status">
          <AlertIcon size={17} />
          <div>
            <p className="banner__title">This emulator could not be found</p>
            <p className="banner__text">
              EmuHub looked for {emulator ? shortenPath(emulator.executablePath, 70) : 'the saved program'} and it is no
              longer there. Choose the program again to reconnect it.
            </p>
          </div>
          <Button variant="secondary" icon={<FolderIcon size={15} />} onClick={() => void relocateEmulator(entry.id)}>
            Locate emulator
          </Button>
        </div>
      ) : null}

      <div className="detail__panels">
        <section className="panel">
          <header className="panel__header">
            <h2>Emulator</h2>
            <Button variant="ghost" size="sm" icon={<EditIcon size={14} />} onClick={openEditor}>
              Change
            </Button>
          </header>
          {emulator ? (
            <dl className="detail__facts">
              <div>
                <dt>Program</dt>
                <dd>{emulator.name}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd className="mono detail__path" title={emulator.executablePath}>
                  {emulator.executablePath}
                </dd>
              </div>
              <div>
                <dt>Added</dt>
                <dd>{formatDate(emulator.addedAt)}</dd>
              </div>
            </dl>
          ) : (
            <EmptyState
              compact
              icon={<FolderIcon size={20} />}
              title="No emulator configured"
              description={`Choose the program you use for ${displayName}. EmuHub only remembers where it is.`}
              action={
                <Button variant="primary" icon={<FolderIcon size={15} />} onClick={() => void relocateEmulator(entry.id)}>
                  Choose Emulator
                </Button>
              }
            />
          )}
          {emulator ? (
            <div className="panel__footer">
              <Button variant="ghost" size="sm" icon={<FolderIcon size={14} />} onClick={() => void revealEmulator(emulator.executablePath)}>
                Show in folder
              </Button>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <header className="panel__header">
            <h2>Library details</h2>
          </header>
          <dl className="detail__facts">
            <div>
              <dt>Added to EmuHub</dt>
              <dd>{formatDate(entry.addedAt)}</dd>
            </div>
            <div>
              <dt>Last launched</dt>
              <dd>{formatRelative(entry.lastLaunchedAt)}</dd>
            </div>
            <div>
              <dt>Times launched</dt>
              <dd>{entry.launchCount}</dd>
            </div>
            {definition ? (
              <div>
                <dt>Media</dt>
                <dd className="detail__capitalize">{definition.media}</dd>
              </div>
            ) : null}
          </dl>
          <p className="panel__note">
            Removing a console only deletes this entry. The emulator stays installed and no files on your computer are
            touched.
          </p>
        </section>
      </div>

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title={`Configure ${displayName}`}
        description="Change which program EmuHub launches, or give this console your own name."
        footer={
          <div className="dialog__footer-actions">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => void saveName()}>
              Save name
            </Button>
          </div>
        }
      >
        <div className="form-stack">
          <label className="field">
            <span className="field__label">Display name</span>
            <input
              className="field__input"
              data-autofocus
              value={nameDraft}
              placeholder={definition?.name ?? displayName}
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void saveName()
              }}
            />
            <span className="field__hint">Leave empty to use the console’s standard name.</span>
          </label>

          <div className="field">
            <span className="field__label">Emulator program</span>
            <EmulatorPathField
              consoleName={displayName}
              value={emulator?.executablePath ?? null}
              onSelected={(info) => void applyEmulatorPath(info.path)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
