import { memo } from 'react'
import type { LibraryEntryView } from '@shared/library'
import type { ConsoleActions } from './useConsoleActions'
import { ConsoleArt } from '../../components/artwork/ConsoleArt'
import { Button, IconButton } from '../../components/ui/Button'
import { Menu } from '../../components/ui/Menu'
import { StatusPill } from '../../components/ui/StatusPill'
import { statusOf } from '../../components/ConsoleCard'
import { EditIcon, ExternalIcon, FolderIcon, MoreIcon, PlayIcon, TrashIcon } from '../../components/icons'
import { shortenPath } from '../../lib/format'

interface ConsoleRowProps {
  view: LibraryEntryView
  healthy: boolean | undefined
  launching: boolean
  actions: ConsoleActions
}

/** Dense list representation used by the Consoles page. */
function ConsoleRowView({ view, healthy, launching, actions }: ConsoleRowProps) {
  const status = statusOf(view, healthy)
  const onOpen = (): void => actions.open(view)
  const onLaunch = (): void => actions.launch(view)
  const onChangeEmulator = (): void => actions.changeEmulator(view)

  return (
    <div className="console-row" onClick={onOpen}>
      <div className="console-row__art">
        <ConsoleArt definition={view.definition} variant="thumb" />
      </div>

      <div className="console-row__identity">
        <button
          type="button"
          className="console-row__name"
          onClick={(event) => {
            event.stopPropagation()
            onOpen()
          }}
        >
          {view.displayName}
        </button>
        <span className="console-row__manufacturer">
          {view.definition?.manufacturer ?? 'Console'} · {view.definition?.releaseYear ?? '—'}
        </span>
      </div>

      <div className="console-row__emulator">
        {view.emulator ? (
          <>
            <span className="console-row__emulator-name truncate">{view.emulator.name}</span>
            <span className="console-row__path mono truncate" title={view.emulator.executablePath}>
              {shortenPath(view.emulator.executablePath, 52)}
            </span>
          </>
        ) : (
          <span className="console-row__path console-row__path--empty">No emulator selected yet</span>
        )}
      </div>

      <StatusPill tone={status} size="sm" label={status === 'neutral' ? 'Checking…' : undefined} />

      <div className="console-row__actions">
        <Button
          variant={status === 'ready' || status === 'neutral' ? 'primary' : 'secondary'}
          size="sm"
          icon={status === 'ready' || status === 'neutral' ? <PlayIcon size={13} /> : <FolderIcon size={14} />}
          loading={launching}
          onClick={(event) => {
            event.stopPropagation()
            if (status === 'ready' || status === 'neutral') onLaunch()
            else onChangeEmulator()
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
            <IconButton label={`More options for ${view.displayName}`} variant="surface" size="sm" {...triggerProps}>
              <MoreIcon size={16} />
            </IconButton>
          )}
        />
      </div>
    </div>
  )
}

export const ConsoleRow = memo(ConsoleRowView, (previous, next) => {
  return (
    previous.actions === next.actions &&
    previous.healthy === next.healthy &&
    previous.launching === next.launching &&
    previous.view.entry.id === next.view.entry.id &&
    previous.view.displayName === next.view.displayName &&
    previous.view.emulator?.name === next.view.emulator?.name &&
    previous.view.emulator?.executablePath === next.view.emulator?.executablePath
  )
})
