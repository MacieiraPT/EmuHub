import type { UpdateProgress } from '@shared/types'
import { formatBytes } from '../../lib/format'

/**
 * How far a download has got. A server that does not declare a size leaves the
 * total unknown, so the bar falls back to showing only that work is happening.
 */
export function DownloadProgress({ progress }: { progress: UpdateProgress | null }) {
  const percent = progress?.percent ?? null

  return (
    <div className="update__progress">
      <div className="update__progress-row">
        <span>{percent === null ? 'Downloading…' : `Downloading — ${percent}%`}</span>
        {progress ? (
          <span className="update__progress-count">
            {formatBytes(progress.receivedBytes)}
            {progress.totalBytes ? ` of ${formatBytes(progress.totalBytes)}` : ''}
          </span>
        ) : null}
      </div>
      <div
        className={`configure__bar${percent === null ? ' update__bar--indeterminate' : ''}`}
        role="progressbar"
        aria-label="Update download"
        {...(percent === null ? {} : { 'aria-valuenow': percent, 'aria-valuemin': 0, 'aria-valuemax': 100 })}
      >
        <span style={{ width: `${percent ?? 100}%` }} />
      </div>
    </div>
  )
}
