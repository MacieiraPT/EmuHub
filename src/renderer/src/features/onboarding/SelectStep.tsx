import { ConsolePicker } from '../../components/ConsolePicker'

interface SelectStepProps {
  selectedIds: string[]
  onToggle: (consoleId: string) => void
  alreadyConfigured: Set<string>
}

export function SelectStep({ selectedIds, onToggle, alreadyConfigured }: SelectStepProps) {
  return (
    <div className="onboarding__step">
      <header className="onboarding__step-header">
        <h2>Which consoles do you emulate?</h2>
        <p>
          Select every platform you already have an emulator for. You can add more at any time from the Home page — this
          is only a starting point.
        </p>
      </header>
      <ConsolePicker
        selectedIds={selectedIds}
        onToggle={onToggle}
        disabledIds={alreadyConfigured}
        autoFocus
      />
    </div>
  )
}
