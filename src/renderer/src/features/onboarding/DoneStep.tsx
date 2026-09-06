import { Button } from '../../components/ui/Button'
import { CheckIcon, ChevronRightIcon } from '../../components/icons'
import { pluralize } from '../../lib/format'

interface DoneStepProps {
  totalConsoles: number
  configuredCount: number
  saving: boolean
  onEnter: () => void
}

export function DoneStep({ totalConsoles, configuredCount, saving, onEnter }: DoneStepProps) {
  const pending = totalConsoles - configuredCount

  return (
    <div className="onboarding__welcome">
      <div className="onboarding__done-mark">
        <CheckIcon size={30} />
      </div>
      <h1 className="onboarding__title">You’re all set</h1>
      <p className="onboarding__lede">
        {totalConsoles === 0
          ? 'Your library is ready. Add your first console whenever you like — it only takes a moment.'
          : `${pluralize(totalConsoles, 'console')} added to your library, ${configuredCount} ready to launch.`}
      </p>

      {pending > 0 ? (
        <p className="onboarding__pending">
          {pluralize(pending, 'console')} still needs an emulator. You’ll find them on the Home page marked
          “Not set up” — choose their program whenever you’re ready.
        </p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        trailingIcon={<ChevronRightIcon size={16} />}
        onClick={onEnter}
        loading={saving}
        autoFocus
      >
        Enter EmuHub
      </Button>
    </div>
  )
}
