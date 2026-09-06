import type { ConsoleDefinition, ExecutableInfo } from '@shared/types'
import { ConsoleArt } from '../../components/ConsoleArt'
import { EmulatorPathField } from '../../components/EmulatorPathField'
import { generationLabel } from '../../lib/format'

export interface Assignment {
  path: string
  name: string
}

interface ConfigureStepProps {
  definition: ConsoleDefinition
  index: number
  total: number
  configuredCount: number
  assignment: Assignment | null
  onAssign: (info: ExecutableInfo) => void
  onClear: () => void
}

export function ConfigureStep({
  definition,
  index,
  total,
  configuredCount,
  assignment,
  onAssign,
  onClear
}: ConfigureStepProps) {
  return (
    <div className="onboarding__step">
      <header className="onboarding__step-header">
        <h2>Locate your emulators</h2>
        <p>
          For each console, choose the emulator program installed on this PC. Not ready for one of them? Skip it and set
          it up later from your library.
        </p>
      </header>

      <div className="configure">
        <div className="configure__progress">
          <span>
            Console {index + 1} of {total}
          </span>
          <span className="configure__progress-count">
            {configuredCount} of {total} configured
          </span>
        </div>
        <div className="configure__bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={configuredCount}>
          <span style={{ width: `${total === 0 ? 0 : (configuredCount / total) * 100}%` }} />
        </div>

        <div className="configure__console">
          <div className="configure__art">
            <ConsoleArt definition={definition} variant="card" />
          </div>
          <div className="configure__details">
            <p className="configure__manufacturer">{definition.manufacturer}</p>
            <h3 className="configure__name">{definition.name}</h3>
            <p className="configure__meta">
              {generationLabel(definition.generation)} · Released {definition.releaseYear}
            </p>
            {definition.knownEmulators.length > 0 ? (
              <p className="configure__hint">
                Commonly used with {formatList(definition.knownEmulators.slice(0, 3))}. EmuHub does not install or
                download any of them — pick whichever one you already have.
              </p>
            ) : null}
          </div>
        </div>

        <EmulatorPathField
          key={definition.id}
          consoleName={definition.name}
          value={assignment?.path ?? null}
          onSelected={onAssign}
          onCleared={assignment ? onClear : undefined}
        />
      </div>
    </div>
  )
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}
