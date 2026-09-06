import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import type { AddConsoleInput, BulkAddResult, ConfiguredConsole } from '@shared/types'
import { getConsoleDefinition } from '@shared/data/consoles'
import { getActiveEmulator, resolveDisplayName, toEntryView, type LibraryEntryView } from '@shared/library'
import { bridge, describeError, unwrap } from '../lib/api'
import { useToast } from './ToastContext'

interface LibraryContextValue {
  entries: LibraryEntryView[]
  /** Entry id -> whether its emulator file is still present and runnable. */
  health: Record<string, boolean>
  loading: boolean
  /** Catalog ids already in the library, used to disable duplicate picks. */
  configuredConsoleIds: Set<string>
  refresh: () => Promise<void>
  addConsole: (input: AddConsoleInput) => Promise<ConfiguredConsole | null>
  /** Adds several consoles in one write — used by setup and "add console". */
  addConsoles: (inputs: AddConsoleInput[]) => Promise<BulkAddResult | null>
  removeConsole: (entryId: string, options?: { skipConfirm?: boolean }) => Promise<boolean>
  setEmulator: (entryId: string, executablePath: string, emulatorName?: string) => Promise<boolean>
  /** Opens the native picker and points the console at the chosen file. */
  relocateEmulator: (entryId: string) => Promise<boolean>
  launch: (entryId: string) => Promise<boolean>
  clearAll: () => Promise<boolean>
  launching: string | null
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({
  children,
  confirmBeforeRemoving
}: {
  children: ReactNode
  confirmBeforeRemoving: boolean
}) {
  const { notify } = useToast()
  const [entries, setEntries] = useState<LibraryEntryView[]>([])
  const [health, setHealth] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState<string | null>(null)

  /**
   * The current entries, readable from callbacks without making those
   * callbacks depend on them — which keeps their identity stable and lets the
   * memoised cards skip re-rendering.
   */
  const entriesRef = useRef<LibraryEntryView[]>([])
  entriesRef.current = entries

  /**
   * Confirms which configured emulators are still on disk. Each sweep stats
   * every configured path, so it runs on a trailing debounce rather than after
   * every individual change.
   */
  const healthTimer = useRef<number | null>(null)
  const checkHealth = useCallback((delay = 250) => {
    if (healthTimer.current !== null) window.clearTimeout(healthTimer.current)
    healthTimer.current = window.setTimeout(() => {
      healthTimer.current = null
      void unwrap(bridge.library.checkEmulators())
        .then(setHealth)
        .catch(() => undefined) // A failed sweep only costs a hint.
    }, delay)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const consoles = await unwrap(bridge.library.list())
      setEntries(consoles.map(toEntryView))
      checkHealth()
    } catch (error) {
      notify({ tone: 'error', title: 'Could not read your library', ...describeError(error) })
    } finally {
      setLoading(false)
    }
  }, [checkHealth, notify])

  useEffect(() => {
    void refresh()

    // A batch of changes (adding five consoles during setup) arrives as a
    // burst of notifications; collapse them into one reload.
    let pending: number | null = null
    const unsubscribe = bridge.events.onLibraryChanged(() => {
      if (pending !== null) return
      pending = window.setTimeout(() => {
        pending = null
        void refresh()
      }, 30)
    })

    // Emulators can be moved or uninstalled while EmuHub sits in the
    // background, so re-check when the user comes back to the window.
    const onFocus = (): void => checkHealth(400)
    window.addEventListener('focus', onFocus)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', onFocus)
      if (pending !== null) window.clearTimeout(pending)
    }
  }, [refresh, checkHealth])

  const addConsole = useCallback(
    async (input: AddConsoleInput) => {
      try {
        const entry = await unwrap(bridge.library.add(input))
        const definition = getConsoleDefinition(entry.consoleId)
        notify({
          tone: 'success',
          title: `${definition?.name ?? 'Console'} added`,
          description: getActiveEmulator(entry)
            ? `Ready to launch with ${getActiveEmulator(entry)?.name}.`
            : 'Choose an emulator file whenever you are ready.'
        })
        return entry
      } catch (error) {
        notify({ tone: 'error', title: 'Could not add that console', ...describeError(error) })
        return null
      }
    },
    [notify]
  )

  const addConsoles = useCallback(
    async (inputs: AddConsoleInput[]) => {
      try {
        const result = await unwrap(bridge.library.addMany(inputs))
        for (const rejection of result.rejected) {
          notify({
            tone: 'warning',
            title: `${getConsoleDefinition(rejection.consoleId)?.name ?? 'A console'} needs attention`,
            description: rejection.reason
          })
        }
        return result
      } catch (error) {
        notify({ tone: 'error', title: 'Could not add those consoles', ...describeError(error) })
        return null
      }
    },
    [notify]
  )

  const setEmulator = useCallback(
    async (entryId: string, executablePath: string, emulatorName?: string) => {
      try {
        const entry = await unwrap(
          bridge.library.setEmulator({
            consoleEntryId: entryId,
            executablePath,
            ...(emulatorName ? { emulatorName } : {})
          })
        )
        notify({
          tone: 'success',
          title: 'Emulator updated',
          description: `${resolveDisplayName(entry)} now launches ${getActiveEmulator(entry)?.name ?? 'the selected program'}.`
        })
        return true
      } catch (error) {
        notify({ tone: 'error', title: 'Could not save that emulator', ...describeError(error) })
        return false
      }
    },
    [notify]
  )

  const relocateEmulator = useCallback(
    async (entryId: string) => {
      const entry = entriesRef.current.find((item) => item.entry.id === entryId)
      try {
        const picked = await unwrap(
          bridge.files.pickExecutable({
            ...(entry ? { consoleName: entry.displayName } : {}),
            ...(entry?.emulator ? { currentPath: entry.emulator.executablePath } : {})
          })
        )
        if (!picked) return false
        // No name is passed: the repository derives one, preferring a known
        // emulator over the raw file name.
        return await setEmulator(entryId, picked.path)
      } catch (error) {
        notify({ tone: 'error', title: 'Could not use that file', ...describeError(error) })
        return false
      }
    },
    [notify, setEmulator]
  )

  const removeConsole = useCallback(
    async (entryId: string, options?: { skipConfirm?: boolean }) => {
      const target = entriesRef.current.find((item) => item.entry.id === entryId)
      const name = target?.displayName ?? 'this console'

      if (confirmBeforeRemoving && !options?.skipConfirm) {
        const confirmed = await unwrap(
          bridge.files.confirm({
            title: 'Remove console',
            message: `Remove ${name} from EmuHub?`,
            detail:
              'This only removes the entry from your EmuHub library. The emulator stays installed on your computer and no files are deleted.',
            confirmLabel: 'Remove from EmuHub',
            destructive: true
          })
        ).catch(() => false)
        if (!confirmed) return false
      }

      try {
        await unwrap(bridge.library.remove(entryId))
        notify({
          tone: 'info',
          title: `${name} removed`,
          description: 'The emulator itself was left untouched on your computer.'
        })
        return true
      } catch (error) {
        notify({ tone: 'error', title: 'Could not remove that console', ...describeError(error) })
        return false
      }
    },
    [confirmBeforeRemoving, notify]
  )

  const launch = useCallback(
    async (entryId: string) => {
      const target = entriesRef.current.find((item) => item.entry.id === entryId)
      setLaunching(entryId)
      try {
        const result = await unwrap(bridge.library.launch(entryId))
        notify({
          tone: 'success',
          title: `${result.emulatorName} started`,
          description: target ? `Launched for ${target.displayName}.` : undefined
        })
        return true
      } catch (error) {
        const described = describeError(error)
        notify({
          tone: 'error',
          title: target ? `${target.displayName} could not start` : 'Emulator could not start',
          description: described.message,
          action: { label: 'Locate emulator', onClick: () => void relocateEmulator(entryId) }
        })
        checkHealth(0)
        return false
      } finally {
        setLaunching(null)
      }
    },
    [checkHealth, notify, relocateEmulator]
  )

  const clearAll = useCallback(async () => {
    try {
      await unwrap(bridge.library.clear())
      notify({
        tone: 'info',
        title: 'Library cleared',
        description: 'All console entries were removed. No emulators were uninstalled.'
      })
      return true
    } catch (error) {
      notify({ tone: 'error', title: 'Could not clear the library', ...describeError(error) })
      return false
    }
  }, [notify])

  const configuredConsoleIds = useMemo(
    () => new Set(entries.map((item) => item.entry.consoleId)),
    [entries]
  )

  const value = useMemo(
    () => ({
      entries,
      health,
      loading,
      configuredConsoleIds,
      refresh,
      addConsole,
      addConsoles,
      removeConsole,
      setEmulator,
      relocateEmulator,
      launch,
      clearAll,
      launching
    }),
    [
      entries,
      health,
      loading,
      configuredConsoleIds,
      refresh,
      addConsole,
      addConsoles,
      removeConsole,
      setEmulator,
      relocateEmulator,
      launch,
      clearAll,
      launching
    ]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext)
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider')
  return context
}

export function useLibraryEntry(entryId: string | undefined): LibraryEntryView | undefined {
  const { entries } = useLibrary()
  return useMemo(() => entries.find((item) => item.entry.id === entryId), [entries, entryId])
}
