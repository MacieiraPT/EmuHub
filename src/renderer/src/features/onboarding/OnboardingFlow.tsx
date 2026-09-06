import { useMemo, useState } from 'react'
import { getConsoleDefinition } from '@shared/data/consoles'
import type { ExecutableInfo } from '@shared/types'
import { deriveEmulatorName } from '@shared/library'
import { useLibrary } from '../../state/LibraryContext'
import { useSettings } from '../../state/SettingsContext'
import { useToast } from '../../state/ToastContext'
import { describeError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'
import { WelcomeStep } from './WelcomeStep'
import { SelectStep } from './SelectStep'
import { ConfigureStep, type Assignment } from './ConfigureStep'
import { DoneStep } from './DoneStep'

type Step = 'welcome' | 'select' | 'configure' | 'done'

const STEP_LABELS: { id: Step; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'select', label: 'Consoles' },
  { id: 'configure', label: 'Emulators' },
  { id: 'done', label: 'Finish' }
]

/**
 * First-run setup. Nothing is written to the library until the user reaches the
 * final step, so backing out of a half-finished setup leaves no stray entries.
 */
export function OnboardingFlow() {
  const { completeOnboarding } = useSettings()
  const { addConsoles, configuredConsoleIds, refresh } = useLibrary()
  const { notify } = useToast()

  const [step, setStep] = useState<Step>('welcome')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({})
  const [configureIndex, setConfigureIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  const stepIndex = STEP_LABELS.findIndex((item) => item.id === step)
  const currentConsoleId = selectedIds[configureIndex]
  const currentDefinition = currentConsoleId ? getConsoleDefinition(currentConsoleId) : undefined
  const configuredCount = useMemo(
    () => selectedIds.filter((id) => assignments[id]).length,
    [assignments, selectedIds]
  )

  const toggleConsole = (consoleId: string): void => {
    setSelectedIds((current) =>
      current.includes(consoleId) ? current.filter((id) => id !== consoleId) : [...current, consoleId]
    )
    setAssignments((current) => {
      if (!current[consoleId]) return current
      const next = { ...current }
      delete next[consoleId]
      return next
    })
  }

  const assign = (consoleId: string, info: ExecutableInfo): void => {
    setAssignments((current) => ({
      ...current,
      [consoleId]: { path: info.path, name: deriveEmulatorName(info.path, getConsoleDefinition(consoleId)) }
    }))
  }

  const clearAssignment = (consoleId: string): void => {
    setAssignments((current) => {
      const next = { ...current }
      delete next[consoleId]
      return next
    })
  }

  const goToConfigure = (): void => {
    setConfigureIndex(0)
    setStep(selectedIds.length > 0 ? 'configure' : 'done')
  }

  const saveAndFinish = async (): Promise<void> => {
    setSaving(true)
    try {
      // One call, one write, one change notification — however many consoles
      // the user picked during setup.
      const result = await addConsoles(
        selectedIds.map((consoleId) => ({
          consoleId,
          executablePath: assignments[consoleId]?.path ?? null,
          emulatorName: assignments[consoleId]?.name ?? null
        }))
      )

      // Load the library before marking setup complete: finishing swaps the
      // onboarding panel for the main window, and the home page should already
      // have the consoles rather than flashing its empty state first.
      await refresh()
      await completeOnboarding()

      if (result && result.added.length > 0) {
        notify({
          tone: 'success',
          title: 'Your library is ready',
          description: `${result.added.length} console${result.added.length === 1 ? '' : 's'} added.`
        })
      }
    } catch (error) {
      notify({ tone: 'error', title: 'Setup could not be saved', ...describeError(error) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__panel">
        {step !== 'welcome' ? (
          <ol className="onboarding__steps" aria-label="Setup progress">
            {STEP_LABELS.map((item, index) => (
              <li
                key={item.id}
                className={`onboarding__stepper${index === stepIndex ? ' is-current' : ''}${
                  index < stepIndex ? ' is-done' : ''
                }`}
                aria-current={index === stepIndex ? 'step' : undefined}
              >
                <span className="onboarding__stepper-dot">{index + 1}</span>
                <span className="onboarding__stepper-label">{item.label}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <div className="onboarding__content">
          {step === 'welcome' ? <WelcomeStep onStart={() => setStep('select')} /> : null}

          {step === 'select' ? (
            <SelectStep selectedIds={selectedIds} onToggle={toggleConsole} alreadyConfigured={configuredConsoleIds} />
          ) : null}

          {step === 'configure' && currentDefinition ? (
            <ConfigureStep
              definition={currentDefinition}
              index={configureIndex}
              total={selectedIds.length}
              configuredCount={configuredCount}
              assignment={assignments[currentDefinition.id] ?? null}
              onAssign={(info) => assign(currentDefinition.id, info)}
              onClear={() => clearAssignment(currentDefinition.id)}
            />
          ) : null}

          {step === 'done' ? (
            <DoneStep
              totalConsoles={selectedIds.length}
              configuredCount={configuredCount}
              saving={saving}
              onEnter={() => void saveAndFinish()}
            />
          ) : null}
        </div>

        {step === 'select' || step === 'configure' ? (
          <footer className="onboarding__footer">
            <Button
              variant="ghost"
              icon={<ChevronLeftIcon size={16} />}
              onClick={() => {
                if (step === 'select') setStep('welcome')
                else if (configureIndex === 0) setStep('select')
                else setConfigureIndex((index) => index - 1)
              }}
            >
              Back
            </Button>

            <div className="onboarding__footer-right">
              {step === 'select' ? (
                <>
                  <span className="onboarding__selection-count" aria-live="polite">
                    {selectedIds.length === 0
                      ? 'No consoles selected yet'
                      : `${selectedIds.length} console${selectedIds.length === 1 ? '' : 's'} selected`}
                  </span>
                  <Button
                    variant="primary"
                    trailingIcon={<ChevronRightIcon size={16} />}
                    onClick={goToConfigure}
                    disabled={selectedIds.length === 0}
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (currentConsoleId) clearAssignment(currentConsoleId)
                      if (configureIndex + 1 < selectedIds.length) setConfigureIndex((index) => index + 1)
                      else setStep('done')
                    }}
                  >
                    Skip for now
                  </Button>
                  <Button
                    variant="primary"
                    trailingIcon={<ChevronRightIcon size={16} />}
                    onClick={() => {
                      if (configureIndex + 1 < selectedIds.length) setConfigureIndex((index) => index + 1)
                      else setStep('done')
                    }}
                  >
                    {configureIndex + 1 < selectedIds.length ? 'Next console' : 'Finish setup'}
                  </Button>
                </>
              )}
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
