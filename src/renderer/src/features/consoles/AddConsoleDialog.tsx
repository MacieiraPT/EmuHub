import { useEffect, useMemo, useState } from 'react'
import { getConsoleDefinition } from '@shared/data/consoles'
import { deriveEmulatorName } from '@shared/library'
import type { ExecutableInfo } from '@shared/types'
import { useLibrary } from '../../state/LibraryContext'
import { ConsolePicker } from '../../components/ConsolePicker'
import { ConsoleArt } from '../../components/ConsoleArt'
import { EmulatorPathField } from '../../components/EmulatorPathField'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'
import { generationLabel, pluralize } from '../../lib/format'

interface AddConsoleDialogProps {
  open: boolean
  onClose: () => void
  /** Called with the new library entry ids once everything has been saved. */
  onAdded?: (entryIds: string[]) => void
}

/**
 * "Add console" uses the same two steps as first-run setup — choose platforms,
 * then point each one at its emulator — so the flow is familiar the second time.
 */
export function AddConsoleDialog({ open, onClose, onAdded }: AddConsoleDialogProps) {
  const { addConsole, configuredConsoleIds } = useLibrary()
  const [phase, setPhase] = useState<'select' | 'configure'>('select')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [assignments, setAssignments] = useState<Record<string, { path: string; name: string }>>({})
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setPhase('select')
    setSelectedIds([])
    setAssignments({})
    setIndex(0)
  }, [open])

  const currentId = selectedIds[index]
  const definition = currentId ? getConsoleDefinition(currentId) : undefined
  const configuredCount = useMemo(() => selectedIds.filter((id) => assignments[id]).length, [assignments, selectedIds])

  const toggle = (consoleId: string): void => {
    setSelectedIds((current) =>
      current.includes(consoleId) ? current.filter((id) => id !== consoleId) : [...current, consoleId]
    )
  }

  const assign = (consoleId: string, info: ExecutableInfo): void => {
    setAssignments((current) => ({
      ...current,
      [consoleId]: { path: info.path, name: deriveEmulatorName(info.path, getConsoleDefinition(consoleId)) }
    }))
  }

  const save = async (): Promise<void> => {
    setSaving(true)
    const added: string[] = []
    for (const consoleId of selectedIds) {
      const assignment = assignments[consoleId]
      const entry = await addConsole({
        consoleId,
        executablePath: assignment?.path ?? null,
        emulatorName: assignment?.name ?? null
      })
      if (entry) added.push(entry.id)
    }
    setSaving(false)
    onAdded?.(added)
    onClose()
  }

  const footer =
    phase === 'select' ? (
      <>
        <span className="dialog__footer-note" aria-live="polite">
          {selectedIds.length === 0 ? 'Select at least one console' : `${pluralize(selectedIds.length, 'console')} selected`}
        </span>
        <div className="dialog__footer-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            trailingIcon={<ChevronRightIcon size={16} />}
            disabled={selectedIds.length === 0}
            onClick={() => {
              setIndex(0)
              setPhase('configure')
            }}
          >
            Continue
          </Button>
        </div>
      </>
    ) : (
      <>
        <span className="dialog__footer-note">
          {configuredCount} of {selectedIds.length} configured
        </span>
        <div className="dialog__footer-actions">
          <Button
            variant="ghost"
            icon={<ChevronLeftIcon size={16} />}
            onClick={() => {
              if (index === 0) setPhase('select')
              else setIndex((value) => value - 1)
            }}
          >
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (index + 1 < selectedIds.length) setIndex((value) => value + 1)
              else void save()
            }}
          >
            Skip for now
          </Button>
          <Button
            variant="primary"
            loading={saving}
            trailingIcon={index + 1 < selectedIds.length ? <ChevronRightIcon size={16} /> : undefined}
            onClick={() => {
              if (index + 1 < selectedIds.length) setIndex((value) => value + 1)
              else void save()
            }}
          >
            {index + 1 < selectedIds.length ? 'Next console' : 'Add to library'}
          </Button>
        </div>
      </>
    )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      busy={saving}
      title={phase === 'select' ? 'Add a console' : 'Locate the emulator'}
      description={
        phase === 'select'
          ? 'Pick the platforms you want in your library. Consoles you already have are marked.'
          : 'Choose the emulator program installed on this PC. You can always skip and do it later.'
      }
      footer={footer}
    >
      {phase === 'select' ? (
        <ConsolePicker
          dense
          autoFocus
          selectedIds={selectedIds}
          onToggle={toggle}
          disabledIds={configuredConsoleIds}
          disabledLabel="Already in your library"
        />
      ) : definition ? (
        <div className="add-console__configure">
          <div className="configure__console">
            <div className="configure__art">
              <ConsoleArt definition={definition} variant="card" />
            </div>
            <div className="configure__details">
              <p className="configure__manufacturer">{definition.manufacturer}</p>
              <h3 className="configure__name">{definition.name}</h3>
              <p className="configure__meta">
                {generationLabel(definition.generation)} · Console {index + 1} of {selectedIds.length}
              </p>
            </div>
          </div>
          <EmulatorPathField
            key={definition.id}
            consoleName={definition.name}
            value={assignments[definition.id]?.path ?? null}
            onSelected={(info) => assign(definition.id, info)}
          />
        </div>
      ) : null}
    </Dialog>
  )
}
