import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { UpdateState } from '@shared/types'
import { bridge, unwrap } from '../lib/api'
import { useToast } from './ToastContext'

/** Mirrors the main process before it has answered for the first time. */
const INITIAL_STATE: UpdateState = {
  stage: 'idle',
  currentVersion: '',
  release: null,
  progress: null,
  download: null,
  error: null,
  checkedAt: null
}

interface UpdateContextValue {
  state: UpdateState
  /** True while the update prompt is on screen. */
  promptOpen: boolean
  openPrompt: () => void
  /** Closes the prompt; an offer set aside is not raised again this session. */
  closePrompt: () => void
  check: () => Promise<UpdateState>
  download: () => Promise<UpdateState>
  cancel: () => Promise<void>
  install: () => Promise<void>
  reveal: () => Promise<void>
  openReleasePage: () => Promise<void>
}

const UpdateContext = createContext<UpdateContextValue | null>(null)

/**
 * Reads the update flow the main process owns.
 *
 * Nothing here talks to the network or holds progress of its own: the state
 * arrives whole from main and is only rendered, so reloading the interface
 * mid-download picks up exactly where it was.
 */
export function UpdateProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast()
  const [state, setState] = useState<UpdateState>(INITIAL_STATE)
  const [promptOpen, setPromptOpen] = useState(false)
  /** A version the user has set aside, so the prompt does not reappear. */
  const [dismissed, setDismissed] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    // The startup check may finish before or after this mounts, so the current
    // state is read once and the event covers everything after that.
    void unwrap(bridge.updates.state())
      .then((value) => {
        if (active) setState(value)
      })
      .catch(() => undefined)

    const unsubscribe = bridge.events.onUpdateState((next) => setState(next))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const version = state.release?.version ?? null

  useEffect(() => {
    if (state.stage !== 'available' || !version || version === dismissed) return
    setPromptOpen(true)
  }, [state.stage, version, dismissed])

  const openPrompt = useCallback(() => setPromptOpen(true), [])

  const promptOpenRef = useRef(promptOpen)
  promptOpenRef.current = promptOpen
  const previousStage = useRef(state.stage)

  /**
   * A download can be left running in the background, so the moment it lands is
   * announced. With the prompt still open there is nothing to say: it is
   * already showing the finished download.
   */
  useEffect(() => {
    const previous = previousStage.current
    previousStage.current = state.stage
    if (state.stage !== 'ready' || previous === 'ready' || promptOpenRef.current) return

    notify({
      tone: 'success',
      title: version ? `EmuHub ${version} is ready to install` : 'The update is ready to install',
      action: { label: 'Finish updating', onClick: () => setPromptOpen(true) }
    })
  }, [state.stage, version, notify])

  const closePrompt = useCallback(() => {
    setPromptOpen(false)
    setDismissed(version)
  }, [version])

  const check = useCallback(async () => {
    const next = await unwrap(bridge.updates.check())
    setState(next)
    return next
  }, [])

  const download = useCallback(async () => {
    const next = await unwrap(bridge.updates.download())
    setState(next)
    return next
  }, [])

  const cancel = useCallback(async () => {
    await unwrap(bridge.updates.cancel())
  }, [])

  const install = useCallback(async () => {
    await unwrap(bridge.updates.install())
  }, [])

  const reveal = useCallback(async () => {
    await unwrap(bridge.updates.reveal())
  }, [])

  const openReleasePage = useCallback(async () => {
    await unwrap(bridge.updates.openReleasePage())
  }, [])

  const value = useMemo(
    () => ({
      state,
      promptOpen,
      openPrompt,
      closePrompt,
      check,
      download,
      cancel,
      install,
      reveal,
      openReleasePage
    }),
    [state, promptOpen, openPrompt, closePrompt, check, download, cancel, install, reveal, openReleasePage]
  )

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
}

export function useUpdates(): UpdateContextValue {
  const context = useContext(UpdateContext)
  if (!context) throw new Error('useUpdates must be used inside UpdateProvider')
  return context
}
