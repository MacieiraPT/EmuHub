import { useMemo } from 'react'
import type { LibraryEntryView } from '@shared/library'
import { useNavigate } from '../../router'
import { useLibrary } from '../../state/LibraryContext'
import { useToast } from '../../state/ToastContext'
import { bridge, describeError, unwrap } from '../../lib/api'

/**
 * The actions every console surface shares, as one object with a stable
 * identity. Cards and rows can then skip re-rendering when something unrelated
 * to them changes.
 */
export interface ConsoleActions {
  open: (view: LibraryEntryView) => void
  launch: (view: LibraryEntryView) => void
  changeEmulator: (view: LibraryEntryView) => void
  reveal: (view: LibraryEntryView) => void
  remove: (view: LibraryEntryView) => void
}

export function useConsoleActions(): ConsoleActions {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { launch, relocateEmulator, removeConsole } = useLibrary()

  return useMemo(
    () => ({
      open: (view) => navigate(`/console/${view.entry.id}`),
      launch: (view) => void launch(view.entry.id),
      changeEmulator: (view) => void relocateEmulator(view.entry.id),
      remove: (view) => void removeConsole(view.entry.id),
      reveal: (view) => {
        const path = view.emulator?.executablePath
        if (!path) return
        void unwrap(bridge.files.reveal(path)).catch((error) =>
          notify({ tone: 'warning', title: 'Could not open that folder', ...describeError(error) })
        )
      }
    }),
    [navigate, notify, launch, relocateEmulator, removeConsole]
  )
}
