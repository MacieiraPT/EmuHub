import { useState, type ReactElement } from 'react'
import { useUpdates } from '../../state/UpdateContext'
import { useToast } from '../../state/ToastContext'
import { describeError } from '../../lib/api'
import { DownloadProgress } from './DownloadProgress'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { AlertIcon, DownloadIcon, ExternalIcon, FolderIcon, RefreshIcon } from '../../components/icons'
import { formatBytes, formatDate } from '../../lib/format'

/**
 * The prompt shown when a newer EmuHub is published.
 *
 * It follows the state the main process broadcasts rather than tracking a
 * download itself, so closing it does not stop anything and reopening it shows
 * whatever has happened since.
 */
export function UpdateDialog() {
  const { state, promptOpen, closePrompt, download, cancel, install, reveal, openReleasePage } = useUpdates()
  const { notify } = useToast()
  const [installing, setInstalling] = useState(false)

  const release = state.release
  if (!promptOpen || !release) return null

  const report =
    (title: string) =>
    (error: unknown): void => {
      notify({ tone: 'error', title, ...describeError(error) })
    }

  const openPage = (): void => void openReleasePage().catch(report('Could not open the releases page'))
  const startDownload = (): void => void download().catch(report('Could not download the update'))

  const startInstall = async (): Promise<void> => {
    setInstalling(true)
    try {
      await install()
    } catch (error) {
      setInstalling(false)
      notify({ tone: 'error', title: 'Could not start the installer', ...describeError(error) })
    }
  }

  const actions = (): ReactElement => {
    switch (state.stage) {
      case 'downloading':
        return (
          <>
            <Button variant="ghost" onClick={closePrompt}>
              Continue in background
            </Button>
            <Button variant="secondary" onClick={() => void cancel().catch(report('Could not cancel the download'))}>
              Cancel download
            </Button>
          </>
        )

      case 'ready':
        return (
          <>
            <Button variant="ghost" onClick={closePrompt} disabled={installing}>
              Later
            </Button>
            {state.download?.installable ? (
              <Button
                variant="primary"
                icon={<DownloadIcon size={15} />}
                loading={installing}
                onClick={() => void startInstall()}
                data-autofocus
              >
                Install now
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<FolderIcon size={15} />}
                onClick={() => void reveal().catch(report('Could not open that folder'))}
                data-autofocus
              >
                Show the file
              </Button>
            )}
          </>
        )

      case 'error':
        return (
          <>
            <Button variant="ghost" icon={<ExternalIcon size={15} />} onClick={openPage}>
              Releases page
            </Button>
            {release.asset ? (
              <Button variant="primary" icon={<RefreshIcon size={15} />} onClick={startDownload} data-autofocus>
                Try again
              </Button>
            ) : null}
          </>
        )

      default:
        return (
          <>
            <Button variant="ghost" onClick={closePrompt}>
              Not now
            </Button>
            {release.asset ? (
              <Button variant="primary" icon={<DownloadIcon size={15} />} onClick={startDownload} data-autofocus>
                Download update
              </Button>
            ) : (
              <Button variant="primary" icon={<ExternalIcon size={15} />} onClick={openPage} data-autofocus>
                Open releases page
              </Button>
            )}
          </>
        )
    }
  }

  return (
    <Dialog
      open
      onClose={closePrompt}
      size="md"
      busy={installing}
      title={titleFor(state.stage, release.version)}
      description={descriptionFor(state.stage, state.currentVersion, release.version)}
      footer={
        <>
          <span className="dialog__footer-note">Your library and emulators are untouched.</span>
          <div className="dialog__footer-actions">{actions()}</div>
        </>
      }
    >
      <div className="update">
        {state.stage === 'downloading' ? <DownloadProgress progress={state.progress} /> : null}

        {state.stage === 'ready' ? (
          <p className="update__lede">
            {state.download?.installable
              ? 'EmuHub will close while the installer runs, then you can open it again.'
              : 'The update was saved to EmuHub’s configuration folder. Close EmuHub before you install it.'}
          </p>
        ) : null}

        {state.stage === 'error' && state.error ? (
          <div className="banner banner--warning" role="alert">
            <AlertIcon size={17} />
            <div>
              <p className="banner__title">{state.error.message}</p>
              {state.error.hint ? <p className="banner__text">{state.error.hint}</p> : null}
            </div>
          </div>
        ) : null}

        {state.stage === 'available' && !release.asset ? (
          <p className="update__lede">
            This release has no file for your system, so EmuHub cannot download it for you. Its releases page has
            everything that was published.
          </p>
        ) : null}

        <dl className="update__facts">
          <div>
            <dt>Installed</dt>
            <dd>{state.currentVersion || '—'}</dd>
          </div>
          <div>
            <dt>Available</dt>
            <dd className="update__version">{release.version}</dd>
          </div>
          {release.publishedAt ? (
            <div>
              <dt>Published</dt>
              <dd>{formatDate(release.publishedAt)}</dd>
            </div>
          ) : null}
          {release.asset ? (
            <div>
              <dt>Download</dt>
              <dd>
                {release.asset.name}
                {release.asset.sizeBytes > 0 ? ` · ${formatBytes(release.asset.sizeBytes)}` : ''}
              </dd>
            </div>
          ) : null}
        </dl>

        {release.notes ? (
          <section className="update__notes-block">
            <h3 className="update__notes-title">What’s new</h3>
            {/* Release notes are written by a person, so they are shown as plain text. */}
            <p className="update__notes">{release.notes}</p>
          </section>
        ) : null}
      </div>
    </Dialog>
  )
}

function titleFor(stage: string, version: string): string {
  switch (stage) {
    case 'downloading':
      return `Downloading EmuHub ${version}`
    case 'ready':
      return `EmuHub ${version} is ready to install`
    case 'error':
      return 'The update could not be downloaded'
    default:
      return `EmuHub ${version} is available`
  }
}

function descriptionFor(stage: string, current: string, version: string): string | undefined {
  if (stage === 'downloading' || stage === 'ready') return undefined
  if (stage === 'error') return 'You can try again, or download the release yourself.'
  return current ? `You are running ${current}. Would you like to update to ${version}?` : undefined
}
