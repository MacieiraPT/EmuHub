import type { LibraryEntryView } from '@shared/library'
import { ConsoleArt } from '../../components/ConsoleArt'
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
  onOpen: () => void
  onLaunch: () => void
  onChangeEmulator: () => void
  onReveal: () => void
  onRemove: () => void
}

/** Dense list representation used by the Consoles page. */
export function ConsoleRow({
  view,
  healthy,
  launching,
  onOpen,
  onLaunch,
  onChangeEmulator,
  onReveal,
  onRemove
}: ConsoleRowProps) {
  const status = statusOf(view, healthy)

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
              onSelect: onReveal,
              disabled: !view.emulator
            },
            { label: 'Remove from EmuHub', icon: <TrashIcon size={15} />, onSelect: onRemove, destructive: true }
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
