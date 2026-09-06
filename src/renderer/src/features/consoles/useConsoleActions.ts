import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../../state/LibraryContext'
import { useToast } from '../../state/ToastContext'
import { bridge, describeError, unwrap } from '../../lib/api'

/** Actions every console surface shares, so behaviour cannot drift between them. */
export function useConsoleActions() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { launch, relocateEmulator, removeConsole } = useLibrary()

  const open = useCallback((entryId: string) => navigate(`/console/${entryId}`), [navigate])

  const reveal = useCallback(
    async (executablePath: string | undefined) => {
      if (!executablePath) return
      try {
        await unwrap(bridge.files.reveal(executablePath))
      } catch (error) {
        notify({ tone: 'warning', title: 'Could not open that folder', ...describeError(error) })
      }
    },
    [notify]
  )

  return { open, launch, relocateEmulator, removeConsole, reveal }
}
