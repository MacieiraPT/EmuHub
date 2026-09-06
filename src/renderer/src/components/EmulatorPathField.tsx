import { useState } from 'react'
import type { ExecutableInfo } from '@shared/types'
import { bridge, describeError, unwrap } from '../lib/api'
import { useToast } from '../state/ToastContext'
import { formatBytes, shortenPath } from '../lib/format'
import { Button } from './ui/Button'
import { AlertIcon, CheckIcon, FolderIcon } from './icons'

interface EmulatorPathFieldProps {
  consoleName: string
  /** Currently stored executable path, if the console already has one. */
  value: string | null
  onSelected: (info: ExecutableInfo) => void
  onCleared?: () => void
  autoFocus?: boolean
}

/**
 * "Choose Emulator" control: opens the operating system's own file picker and
 * reports exactly what was selected. Cancelling the picker is a no-op, never an
 * error.
 */
export function EmulatorPathField({ consoleName, value, onSelected, onCleared, autoFocus }: EmulatorPathFieldProps) {
  const { notify } = useToast()
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<ExecutableInfo | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const browse = async (): Promise<void> => {
    setBusy(true)
    try {
      const picked = await unwrap(
        bridge.files.pickExecutable({ consoleName, ...(value ? { currentPath: value } : {}) })
      )
      if (!picked) return

      setInfo(picked)
      if (!picked.executable) {
        setProblem(
          `“${picked.fileName}” does not look like a program. Pick the emulator’s main executable file instead.`
        )
        return
      }
      setProblem(null)
      onSelected(picked)
    } catch (error) {
      const described = describeError(error)
      setProblem(described.message)
      notify({ tone: 'error', title: 'That file cannot be used', ...described })
    } finally {
      setBusy(false)
    }
  }

  const displayPath = value ?? info?.path ?? null

  if (!displayPath) {
    return (
      <div className="path-field path-field--empty">
        <div className="path-field__icon">
          <FolderIcon size={20} />
        </div>
        <div className="path-field__text">
          <p className="path-field__title">No emulator selected yet</p>
          <p className="path-field__hint">
            Choose the emulator program you already have installed for {consoleName}. EmuHub only stores its location —
            nothing is copied, changed or downloaded.
          </p>
        </div>
        <Button variant="primary" icon={<FolderIcon size={15} />} onClick={browse} loading={busy} autoFocus={autoFocus} data-autofocus>
          Choose Emulator
        </Button>
      </div>
    )
  }

  return (
    <div className={`path-field${problem ? ' path-field--invalid' : ''}`}>
      <div className={`path-field__icon${problem ? ' path-field__icon--warn' : ' path-field__icon--ok'}`}>
        {problem ? <AlertIcon size={18} /> : <CheckIcon size={18} />}
      </div>
      <div className="path-field__text">
        <p className="path-field__title truncate">{info?.fileName ?? displayPath.split(/[\\/]/).pop()}</p>
        <p className="path-field__path mono" title={displayPath}>
          {shortenPath(displayPath, 68)}
        </p>
        {problem ? <p className="path-field__problem">{problem}</p> : null}
        {!problem && info ? <p className="path-field__hint">{formatBytes(info.sizeBytes)} · ready to launch</p> : null}
      </div>
      <div className="path-field__actions">
        <Button variant="secondary" icon={<FolderIcon size={15} />} onClick={browse} loading={busy}>
          Change
        </Button>
        {onCleared ? (
          <Button
            variant="ghost"
            onClick={() => {
              setInfo(null)
              setProblem(null)
              onCleared()
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  )
}
