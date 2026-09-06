import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useSettings } from './state/SettingsContext'
import { useToast } from './state/ToastContext'
import { useAppearance } from './hooks/useAppearance'
import { bridge, unwrap } from './lib/api'
import { BrandMark, TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/ui/Toasts'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { HomePage } from './features/home/HomePage'
import { ConsolesPage } from './features/consoles/ConsolesPage'
import { ConsoleDetailPage } from './features/detail/ConsoleDetailPage'
import { SettingsPage } from './features/settings/SettingsPage'

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
        <TitleBar />
        <OnboardingFlow />
        <Toasts />
      </div>
    )
  }

  return (
    <div className="app">
      <TitleBar />
      <div className="app__body">
        <Sidebar />
        <MainRoutes />
      </div>
      <Toasts />
    </div>
  )
}

function MainRoutes() {
  const location = useLocation()

  return (
    <main className="app__main" id="main-content" tabIndex={-1}>
      {/* Keying on the path replays the enter transition on each section change. */}
      <div className="view" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/consoles" element={<ConsolesPage />} />
          <Route path="/console/:entryId" element={<ConsoleDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
