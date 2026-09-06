import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AddConsoleInput, ConfiguredConsole } from '@shared/types'
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

  const checkHealth = useCallback(async () => {
    try {
      setHealth(await unwrap(bridge.library.checkEmulators()))
    } catch {
      // A failed health sweep only removes a hint; the library still works.
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const consoles = await unwrap(bridge.library.list())
      setEntries(consoles.map(toEntryView))
      await checkHealth()
    } catch (error) {
      notify({ tone: 'error', title: 'Could not read your library', ...describeError(error) })
    } finally {
      setLoading(false)
    }
  }, [checkHealth, notify])

  useEffect(() => {
    void refresh()
    const unsubscribe = bridge.events.onLibraryChanged(() => void refresh())
    return unsubscribe
  }, [refresh])

  const addConsole = useCallback(
    async (input: AddConsoleInput) => {
      try {
        const entry = await unwrap(bridge.library.add(input))
        await refresh()
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
    [notify, refresh]
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
        await refresh()
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
    [notify, refresh]
  )

  const relocateEmulator = useCallback(
    async (entryId: string) => {
      const entry = entries.find((item) => item.entry.id === entryId)
      try {
        const picked = await unwrap(
          bridge.files.pickExecutable({
            ...(entry ? { consoleName: entry.displayName } : {}),
            ...(entry?.emulator ? { currentPath: entry.emulator.executablePath } : {})
          })
        )
        if (!picked) return false
        return await setEmulator(entryId, picked.path, picked.suggestedName)
      } catch (error) {
        notify({ tone: 'error', title: 'Could not use that file', ...describeError(error) })
        return false
      }
    },
    [entries, notify, setEmulator]
  )

  const removeConsole = useCallback(
    async (entryId: string, options?: { skipConfirm?: boolean }) => {
      const target = entries.find((item) => item.entry.id === entryId)
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
        await refresh()
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
    [confirmBeforeRemoving, entries, notify, refresh]
  )

  const launch = useCallback(
    async (entryId: string) => {
      const target = entries.find((item) => item.entry.id === entryId)
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
        void checkHealth()
        return false
      } finally {
        setLaunching(null)
      }
    },
    [checkHealth, entries, notify, relocateEmulator]
  )

  const clearAll = useCallback(async () => {
    try {
      await unwrap(bridge.library.clear())
      await refresh()
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
  }, [notify, refresh])

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
