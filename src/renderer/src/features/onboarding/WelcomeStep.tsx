import { Button } from '../../components/ui/Button'
import { BrandMark } from '../../components/TitleBar'
import { ChevronRightIcon, FolderIcon, PlayIcon, SparkIcon } from '../../components/icons'

const HIGHLIGHTS = [
  {
    icon: <SparkIcon size={17} />,
    title: 'Pick your consoles',
    description: 'Choose from more than fifty platforms, from the Atari 2600 to the Nintendo Switch.'
  },
  {
    icon: <FolderIcon size={17} />,
    title: 'Point to your emulators',
    description: 'Select the programs already installed on this PC. Nothing is downloaded or installed for you.'
  },
  {
    icon: <PlayIcon size={15} />,
    title: 'Launch from one place',
    description: 'Your whole collection becomes a single library you can start from with one click.'
  }
]

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="onboarding__welcome">
      <div className="onboarding__welcome-mark">
        <BrandMark size={54} />
      </div>
      <h1 className="onboarding__title">Welcome to EmuHub</h1>
      <p className="onboarding__lede">
        EmuHub brings every console emulator on your computer together into one clean library — so you can stop hunting
        through folders and shortcuts and just start playing.
      </p>

      <ul className="onboarding__highlights">
        {HIGHLIGHTS.map((item) => (
          <li key={item.title}>
            <span className="onboarding__highlight-icon">{item.icon}</span>
            <div>
              <p className="onboarding__highlight-title">{item.title}</p>
              <p className="onboarding__highlight-text">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <Button variant="primary" size="lg" trailingIcon={<ChevronRightIcon size={16} />} onClick={onStart} autoFocus>
        Get started
      </Button>
      <p className="onboarding__footnote">Takes about a minute. You can change anything later in Settings.</p>
    </div>
  )
}
