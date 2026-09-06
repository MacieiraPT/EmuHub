import { memo } from 'react'
import type { LibraryEntryView } from '@shared/library'
import type { ConsoleActions } from '../features/consoles/useConsoleActions'
import { generationLabel } from '../lib/format'
import { ConsoleArt } from './artwork/ConsoleArt'
import { Button, IconButton } from './ui/Button'
import { Menu } from './ui/Menu'
import { StatusPill, type StatusTone } from './ui/StatusPill'
import { EditIcon, ExternalIcon, FolderIcon, MoreIcon, PlayIcon, TrashIcon } from './icons'

interface ConsoleCardProps {
  view: LibraryEntryView
  /** `undefined` while the emulator check is still running. */
  healthy: boolean | undefined
  launching: boolean
  actions: ConsoleActions
}

export function statusOf(view: LibraryEntryView, healthy: boolean | undefined): StatusTone {
  if (!view.emulator) return 'unconfigured'
  if (healthy === undefined) return 'neutral'
  return healthy ? 'ready' : 'missing'
}

function ConsoleCardView({ view, healthy, launching, actions }: ConsoleCardProps) {
  const onOpen = (): void => actions.open(view)
  const onLaunch = (): void => actions.launch(view)
  const onChangeEmulator = (): void => actions.changeEmulator(view)

  const status = statusOf(view, healthy)

  return (
    <article className="console-card" onClick={onOpen}>
      <div className="console-card__art">
        <ConsoleArt definition={view.definition} variant="card" />
        <div className="console-card__art-overlay" aria-hidden="true" />
        <span className="console-card__badge">{view.definition?.manufacturer ?? 'Console'}</span>
      </div>

      <div className="console-card__body">
        <div className="console-card__heading">
          <h3 className="console-card__title">
            <button
              type="button"
              className="console-card__title-button"
              onClick={(event) => {
                event.stopPropagation()
                onOpen()
              }}
            >
              {view.displayName}
            </button>
          </h3>
          <p className="console-card__meta truncate">
            {view.emulator ? view.emulator.name : generationLabel(view.definition?.generation ?? null)}
          </p>
        </div>

        <div className="console-card__footer">
          <StatusPill tone={status} size="sm" label={status === 'neutral' ? 'Checking…' : undefined} />
          <div className="console-card__actions">
            <Button
              variant={status === 'missing' ? 'secondary' : 'primary'}
              size="sm"
              icon={status === 'missing' ? <FolderIcon size={14} /> : <PlayIcon size={13} />}
              loading={launching}
              onClick={(event) => {
                event.stopPropagation()
                if (status === 'unconfigured' || status === 'missing') onChangeEmulator()
                else onLaunch()
              }}
            >
              {status === 'unconfigured' ? 'Set up' : status === 'missing' ? 'Locate' : 'Launch'}
            </Button>
            <Menu
              align="end"
              actions={[
                { label: 'Open console page', icon: <ExternalIcon size={15} />, onSelect: onOpen },
                {
                  label: view.emulator ? 'Change emulator' : 'Choose emulator',
                  icon: <EditIcon size={15} />,
                  onSelect: onChangeEmulator
                },
                {
                  label: 'Show emulator in folder',
                  icon: <FolderIcon size={15} />,
                  onSelect: () => actions.reveal(view),
                  disabled: !view.emulator
                },
                {
                  label: 'Remove from EmuHub',
                  icon: <TrashIcon size={15} />,
                  onSelect: () => actions.remove(view),
                  destructive: true
                }
              ]}
              trigger={(triggerProps) => (
                <IconButton
                  label={`More options for ${view.displayName}`}
                  variant="surface"
                  size="sm"
                  {...triggerProps}
                >
                  <MoreIcon size={16} />
                </IconButton>
              )}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * A library can hold dozens of cards, each drawing a full SVG illustration.
 * Comparing exactly what the card shows keeps an unrelated state change — a
 * launch elsewhere, a health sweep — from re-rendering all of them.
 */
export const ConsoleCard = memo(ConsoleCardView, (previous, next) => {
  return (
    previous.actions === next.actions &&
    previous.healthy === next.healthy &&
    previous.launching === next.launching &&
    previous.view.entry.id === next.view.entry.id &&
    previous.view.displayName === next.view.displayName &&
    previous.view.entry.consoleId === next.view.entry.consoleId &&
    previous.view.emulator?.name === next.view.emulator?.name &&
    previous.view.emulator?.executablePath === next.view.emulator?.executablePath
  )
})
