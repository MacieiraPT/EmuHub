import { useEffect } from 'react'
import { Routes, useNavigate, usePath, type RouteDefinition } from './router'
import { useSettings } from './state/SettingsContext'
import { useToast } from './state/ToastContext'
import { useAppearance } from './hooks/useAppearance'
import { bridge, unwrap } from './lib/api'
import { BrandMark, TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/ui/Toasts'
import { ConsoleArtSprite } from './components/artwork/ConsoleArt'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { MyEmulatorsPage } from './features/consoles/MyEmulatorsPage'
import { ConsoleDetailPage } from './features/detail/ConsoleDetailPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { UpdateDialog } from './features/updates/UpdateDialog'

export function App() {
  const { settings, loading } = useSettings()
  useAppearance(settings.appearance)
  useStorageHealthNotice()
  useGlobalShortcuts()

  if (loading) {
    return (
      <div className="app app--loading">
        <TitleBar />
        <div className="splash">
          <BrandMark size={44} />
          <span className="splash__label">Loading your library…</span>
        </div>
      </div>
    )
  }

  if (!settings.onboarding.completed) {
    return (
      <div className="app app--onboarding">
        <ConsoleArtSprite />
        <TitleBar />
        <OnboardingFlow />
        <Toasts />
      </div>
    )
  }

  return (
    <div className="app">
      <ConsoleArtSprite />
      <TitleBar />
      <div className="app__body">
        <Sidebar />
        <MainRoutes />
      </div>
      {/* Onboarding is left alone: an update is offered once someone is set up. */}
      <UpdateDialog />
      <Toasts />
    </div>
  )
}

const ROUTES: RouteDefinition[] = [
  { path: '/', element: <MyEmulatorsPage /> },
  { path: '/console/:entryId', element: <ConsoleDetailPage /> },
  { path: '/settings', element: <SettingsPage /> }
]

function MainRoutes() {
  const path = usePath()

  return (
    <main className="app__main" id="main-content" tabIndex={-1}>
      {/* Keying on the path replays the enter transition on each section change. */}
      <div className="view" key={path}>
        <Routes routes={ROUTES} fallback={<MyEmulatorsPage />} />
      </div>
    </main>
  )
}

/** Ctrl/Cmd+, opens Settings; menu and tray navigation arrives the same way. */
function useGlobalShortcuts(): void {
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault()
        navigate('/settings')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    const unsubscribe = bridge.events.onNavigate((route) => navigate(route))
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      unsubscribe()
    }
  }, [navigate])
}

/** Tells the user once if stored configuration had to be recovered at startup. */
function useStorageHealthNotice(): void {
  const { notify } = useToast()

  useEffect(() => {
    void unwrap(bridge.app.storageHealth())
      .then((health) => {
        if (!health.libraryRecovered && !health.settingsRecovered) return
        notify({
          tone: 'warning',
          title: 'Some settings had to be restored',
          description: health.backupPath
            ? 'A configuration file could not be read, so EmuHub started from a backup. The damaged file was kept in your configuration folder.'
            : 'A configuration file could not be read, so EmuHub started from defaults.'
        })
      })
      .catch(() => undefined)
  }, [notify])
}
