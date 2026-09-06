import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { SettingsProvider, useSettings } from './state/SettingsContext'
import { LibraryProvider } from './state/LibraryContext'
import { ToastProvider } from './state/ToastContext'
import './styles/theme.css'
import './styles/base.css'
import './styles/app.css'

/** The library needs one setting, so it is mounted below the settings store. */
function LibraryGate({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  return <LibraryProvider confirmBeforeRemoving={settings.general.confirmBeforeRemoving}>{children}</LibraryProvider>
}

const container = document.getElementById('root')
if (!container) throw new Error('Root element is missing')

createRoot(container).render(
  <StrictMode>
    <SettingsProvider>
      <ToastProvider>
        <LibraryGate>
          <HashRouter>
            <App />
          </HashRouter>
        </LibraryGate>
      </ToastProvider>
    </SettingsProvider>
  </StrictMode>
)
