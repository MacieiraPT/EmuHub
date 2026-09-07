import { useEffect, useState } from 'react'
import type { AppInfo, CardSize, LibrarySort, ThemePreference, UpdateState } from '@shared/types'
import { SORT_LABELS } from '@shared/library'
import { useSettings } from '../../state/SettingsContext'
import { useLibrary } from '../../state/LibraryContext'
import { useToast } from '../../state/ToastContext'
import { useUpdates } from '../../state/UpdateContext'
import { bridge, describeError, unwrap } from '../../lib/api'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Toggle'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Select } from '../../components/ui/Select'
import {
  DownloadIcon,
  ExternalIcon,
  MonitorIcon,
  MoonIcon,
  OledIcon,
  RefreshIcon,
  SunIcon,
  TrashIcon,
  UploadIcon
} from '../../components/icons'
import { AccentPicker } from './AccentPicker'
import { DownloadProgress } from '../updates/DownloadProgress'
import { fileNameOf, formatDateTime, pluralize } from '../../lib/format'

const SORT_OPTIONS = (Object.keys(SORT_LABELS) as LibrarySort[]).map((value) => ({
  value,
  label: SORT_LABELS[value]
}))

export function SettingsPage() {
  const { settings, update, resetDefaults, resetOnboarding } = useSettings()
  const { entries, clearAll } = useLibrary()
  const { notify } = useToast()
  const updates = useUpdates()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [backupBusy, setBackupBusy] = useState<'export' | 'import' | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  useEffect(() => {
    void unwrap(bridge.app.info())
      .then(setInfo)
      .catch(() => undefined)
  }, [])

  const startupSupported = info ? info.platform === 'win32' || info.platform === 'darwin' : true

  const patch = async (apply: Parameters<typeof update>[0], message?: string): Promise<void> => {
    try {
      await update(apply)
      if (message) notify({ tone: 'success', title: message })
    } catch (error) {
      notify({ tone: 'error', title: 'Could not save that setting', ...describeError(error) })
    }
  }

  /**
   * The main process owns both file dialogs, so a cancelled picker comes back
   * as `null` and is simply not reported. A completed restore arrives in the
   * library and settings through the usual change events.
   */
  const exportBackup = async (): Promise<void> => {
    setBackupBusy('export')
    try {
      const result = await unwrap(bridge.backup.export())
      if (!result) return
      notify({
        tone: 'success',
        title: 'Backup exported',
        description: `${pluralize(result.consoleCount, 'console')} and your preferences were saved to ${fileNameOf(result.filePath)}.`
      })
    } catch (error) {
      notify({ tone: 'error', title: 'Could not export your backup', ...describeError(error) })
    } finally {
      setBackupBusy(null)
    }
  }

  const importBackup = async (): Promise<void> => {
    setBackupBusy('import')
    try {
      const result = await unwrap(bridge.backup.import())
      if (!result) return

      const notes = [
        result.skippedDuplicates > 0
          ? `${pluralize(result.skippedDuplicates, 'console')} already in your library ${result.skippedDuplicates === 1 ? 'was' : 'were'} left unchanged.`
          : null,
        result.skippedUnknown > 0
          ? `${pluralize(result.skippedUnknown, 'entry', 'entries')} for consoles EmuHub no longer lists ${result.skippedUnknown === 1 ? 'was' : 'were'} skipped.`
          : null,
        result.settingsRestored ? 'Your preferences were restored too.' : null
      ].filter(Boolean)

      notify({
        tone: 'success',
        title: result.mode === 'merge' ? 'Backup merged into your library' : 'Library restored from backup',
        description: [`${pluralize(result.imported, 'console')} restored.`, ...notes].join(' ')
      })
    } catch (error) {
      notify({ tone: 'error', title: 'Could not restore that backup', ...describeError(error) })
    } finally {
      setBackupBusy(null)
    }
  }

  /**
   * A check the user asked for reports back either way — unlike the quiet one
   * at startup, being told nothing here would read as a broken button.
   */
  const checkForUpdates = async (): Promise<void> => {
    setCheckingUpdate(true)
    try {
      const result = await updates.check()
      if (result.stage === 'available' && result.release) {
        updates.openPrompt()
      } else if (result.stage === 'error' && result.error) {
        notify({
          tone: 'error',
          title: 'Could not check for updates',
          description: [result.error.message, result.error.hint].filter(Boolean).join(' ')
        })
      } else {
        notify({
          tone: 'success',
          title: 'EmuHub is up to date',
          description: `You are running ${result.currentVersion}.`
        })
      }
    } catch (error) {
      notify({ tone: 'error', title: 'Could not check for updates', ...describeError(error) })
    } finally {
      setCheckingUpdate(false)
    }
  }

  const confirmDestructive = async (options: {
    message: string
    detail: string
    confirmLabel: string
  }): Promise<boolean> => {
    const result = await unwrap(
      bridge.files.confirm({ title: 'EmuHub', destructive: true, ...options })
    ).catch(() => false)
    return result
  }

  return (
    <div className="page page--settings">
      <PageHeader title="Settings" subtitle="Preferences are saved as you change them" />

      <section className="panel">
        <header className="panel__header">
          <h2>General</h2>
        </header>
        <div className="settings-group">
          <Toggle
            label="Start EmuHub with Windows"
            description="Open EmuHub automatically after you sign in."
            disabled={!startupSupported}
            disabledReason="Automatic startup is managed by your desktop environment on this system."
            checked={settings.general.launchOnStartup}
            onChange={(value) => void patch({ general: { launchOnStartup: value } })}
          />
          <Toggle
            label="Start minimised"
            description="When EmuHub opens automatically, keep it out of the way until you need it."
            disabled={!settings.general.launchOnStartup}
            checked={settings.general.startMinimized}
            onChange={(value) => void patch({ general: { startMinimized: value } })}
          />
          <Toggle
            label="Minimise to the tray"
            description="Show an EmuHub icon in the notification area while it is running."
            checked={settings.general.minimizeToTray}
            onChange={(value) => void patch({ general: { minimizeToTray: value } })}
          />
          <Toggle
            label="Keep running when the window is closed"
            description="Closing the window hides EmuHub to the tray instead of quitting it."
            checked={settings.general.closeToTray}
            onChange={(value) => void patch({ general: { closeToTray: value } })}
          />
          <Toggle
            label="Confirm before removing a console"
            description="Ask first, so an entry is never removed from your library by accident."
            checked={settings.general.confirmBeforeRemoving}
            onChange={(value) => void patch({ general: { confirmBeforeRemoving: value } })}
          />
        </div>
      </section>

      <section className="panel">
        <header className="panel__header">
          <h2>Appearance</h2>
        </header>
        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Theme</span>
              <span className="setting-row__description">
                EmuHub is designed for dark rooms, but it follows you. OLED goes fully black, for
                screens where an unlit pixel stays dark.
              </span>
            </div>
            <SegmentedControl<ThemePreference>
              label="Theme"
              value={settings.appearance.theme}
              onChange={(value) => void patch({ appearance: { theme: value } })}
              options={[
                { value: 'oled', label: 'OLED', icon: <OledIcon size={15} /> },
                { value: 'dark', label: 'Dark', icon: <MoonIcon size={15} /> },
                { value: 'light', label: 'Light', icon: <SunIcon size={15} /> },
                { value: 'system', label: 'System', icon: <MonitorIcon size={15} /> }
              ]}
            />
          </div>

          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Accent colour</span>
              <span className="setting-row__description">
                Used for primary buttons, focus rings and highlights. A colour of your own is taken
                as a hue — the theme still sets its brightness, so it stays readable in both.
              </span>
            </div>
            <AccentPicker
              accent={settings.appearance.accent}
              customAccent={settings.appearance.customAccent}
              onChange={(appearance) => void patch({ appearance })}
            />
          </div>

          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Card size</span>
              <span className="setting-row__description">How large console cards appear in your library.</span>
            </div>
            <SegmentedControl<CardSize>
              label="Card size"
              value={settings.appearance.cardSize}
              onChange={(value) => void patch({ appearance: { cardSize: value } })}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'large', label: 'Large' }
              ]}
            />
          </div>

          <Toggle
            label="Reduce motion"
            description="Turn off transitions and hover animations."
            checked={settings.appearance.reduceMotion}
            onChange={(value) => void patch({ appearance: { reduceMotion: value } })}
          />
        </div>
      </section>

      <section className="panel">
        <header className="panel__header">
          <h2>Library</h2>
        </header>
        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Default sort order</span>
              <span className="setting-row__description">How consoles are ordered when you open EmuHub.</span>
            </div>
            <Select
              hideLabel
              label="Default sort order"
              value={settings.library.defaultSort}
              options={SORT_OPTIONS}
              onChange={(value) => void patch({ library: { defaultSort: value } })}
            />
          </div>
          <Toggle
            label="Warn about missing emulators"
            description="Show a notice when a configured emulator can no longer be found on this PC."
            checked={settings.library.showMissingWarnings}
            onChange={(value) => void patch({ library: { showMissingWarnings: value } })}
          />
        </div>
      </section>

      <section className="panel">
        <header className="panel__header">
          <h2>Updates</h2>
        </header>
        <div className="settings-group">
          <Toggle
            label="Check for updates when EmuHub starts"
            description="Looks at EmuHub’s releases page once at startup and asks before anything is downloaded."
            checked={settings.general.checkForUpdates}
            onChange={(value) => void patch({ general: { checkForUpdates: value } })}
          />

          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">{updateStatusLabel(updates.state)}</span>
              <span className="setting-row__description">
                {updates.state.checkedAt
                  ? `Last checked ${formatDateTime(updates.state.checkedAt)}.`
                  : 'EmuHub has not looked for an update yet in this session.'}
              </span>
              {updates.state.stage === 'downloading' ? <DownloadProgress progress={updates.state.progress} /> : null}
            </div>
            {updates.state.release ? (
              <Button variant="primary" icon={<DownloadIcon size={15} />} onClick={updates.openPrompt}>
                {updates.state.stage === 'ready' ? 'Install update' : 'View update'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={<RefreshIcon size={15} />}
                loading={checkingUpdate}
                onClick={() => void checkForUpdates()}
              >
                Check now
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <header className="panel__header">
          <h2>Backup &amp; restore</h2>
        </header>
        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Export a backup</span>
              <span className="setting-row__description">
                Saves your consoles, their emulator paths and your preferences to a single file you can keep or carry to
                another PC.
              </span>
            </div>
            <Button
              variant="secondary"
              icon={<DownloadIcon size={15} />}
              disabled={backupBusy !== null}
              onClick={() => void exportBackup()}
            >
              Export backup…
            </Button>
          </div>

          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Restore from a backup</span>
              <span className="setting-row__description">
                Reads a backup file back into EmuHub. You choose whether it replaces your library or merges into it —
                emulator programs on this PC are never changed.
              </span>
            </div>
            <Button
              variant="secondary"
              icon={<UploadIcon size={15} />}
              disabled={backupBusy !== null}
              onClick={() => void importBackup()}
            >
              Import backup…
            </Button>
          </div>
        </div>
      </section>

      <section className="panel panel--danger">
        <header className="panel__header">
          <h2>Application</h2>
        </header>
        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Run setup again</span>
              <span className="setting-row__description">
                Show the first-run walkthrough next time EmuHub starts. Your consoles are kept.
              </span>
            </div>
            <Button
              variant="secondary"
              icon={<RefreshIcon size={15} />}
              onClick={async () => {
                const confirmed = await confirmDestructive({
                  message: 'Show the setup walkthrough again?',
                  detail: 'Your configured consoles and emulator paths are kept exactly as they are.',
                  confirmLabel: 'Show setup'
                })
                if (!confirmed) return
                await resetOnboarding()
              }}
            >
              Reset onboarding
            </Button>
          </div>

          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">Restore default settings</span>
              <span className="setting-row__description">
                Puts every preference back to its original value. Your library is untouched.
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                const confirmed = await confirmDestructive({
                  message: 'Restore all settings to their defaults?',
                  detail: 'Your consoles and emulator paths are not affected.',
                  confirmLabel: 'Restore defaults'
                })
                if (!confirmed) return
                await resetDefaults()
                notify({ tone: 'success', title: 'Settings restored to defaults' })
              }}
            >
              Restore defaults
            </Button>
          </div>

          <div className="setting-row setting-row--danger">
            <div className="setting-row__text">
              <span className="setting-row__label">Clear all configured consoles</span>
              <span className="setting-row__description">
                Removes {pluralize(entries.length, 'console')} from EmuHub. Your emulators stay installed — no program or
                file on your computer is deleted.
              </span>
            </div>
            <Button
              variant="danger"
              icon={<TrashIcon size={15} />}
              disabled={entries.length === 0}
              onClick={async () => {
                const confirmed = await confirmDestructive({
                  message: `Remove all ${entries.length} consoles from EmuHub?`,
                  detail:
                    'This clears EmuHub’s own library only. Every emulator remains installed on your computer and no files are deleted.',
                  confirmLabel: 'Clear library'
                })
                if (!confirmed) return
                await clearAll()
              }}
            >
              Clear library
            </Button>
          </div>
        </div>
      </section>

      <section className="panel panel--about">
        <header className="panel__header">
          <h2>About</h2>
        </header>
        <dl className="detail__facts">
          <div>
            <dt>Version</dt>
            <dd>{info ? `EmuHub ${info.version}` : '—'}</dd>
          </div>
          <div>
            <dt>Configuration folder</dt>
            <dd className="mono detail__path" title={info?.configDirectory}>
              {info?.configDirectory ?? '—'}
            </dd>
          </div>
        </dl>
        <div className="panel__footer">
          <Button
            variant="ghost"
            size="sm"
            icon={<ExternalIcon size={14} />}
            onClick={() => void unwrap(bridge.app.openConfigFolder()).catch(() => undefined)}
          >
            Open configuration folder
          </Button>
        </div>
        <p className="panel__note">
          EmuHub manages emulators that are already installed on this computer. It does not download, bundle or
          distribute emulator software or games.
        </p>
      </section>
    </div>
  )
}

/** One line describing where the update flow stands, in the user's terms. */
function updateStatusLabel(state: UpdateState): string {
  switch (state.stage) {
    case 'checking':
      return 'Looking for a newer version…'
    case 'available':
      return `EmuHub ${state.release?.version ?? ''} is available`.trim()
    case 'downloading':
      return `Downloading EmuHub ${state.release?.version ?? ''}`.trim()
    case 'ready':
      return `EmuHub ${state.release?.version ?? ''} is ready to install`.trim()
    case 'error':
      // A release still on offer means the download failed, not the check.
      return state.release ? 'The update could not be downloaded' : 'The last update check did not finish'
    case 'up-to-date':
      return 'EmuHub is up to date'
    default:
      return 'Check for a newer version'
  }
}
