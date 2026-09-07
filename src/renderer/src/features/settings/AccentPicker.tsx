import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { AccentColor, AppearanceSettings } from '@shared/types'
import { normalizeHexColor } from '@shared/theme'
import { DropletIcon } from '../../components/icons'

/** The presets; `custom` is the picker beside them, not an entry here. */
const ACCENTS: { value: Exclude<AccentColor, 'custom'>; label: string }[] = [
  { value: 'violet', label: 'Violet' },
  { value: 'blue', label: 'Blue' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'amber', label: 'Amber' },
  { value: 'rose', label: 'Rose' },
  { value: 'cyan', label: 'Cyan' }
]

/**
 * A colour input reports every shade the pointer crosses, and each report would
 * otherwise be a write to disk and a broadcast to the renderer. The swatch
 * follows the drag; only a colour the user rests on is saved.
 */
const COMMIT_DELAY_MS = 220

interface AccentPickerProps {
  accent: AccentColor
  customAccent: string
  onChange: (appearance: Partial<AppearanceSettings>) => void
}

/**
 * The six presets plus a colour of the user's own. The custom swatch wraps a
 * native `<input type="color">` — the platform's own picker, eyedropper
 * included, and no dependency, which this project deliberately has none of.
 */
export function AccentPicker({ accent, customAccent, onChange }: AccentPickerProps) {
  const [draft, setDraft] = useState(customAccent)
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // While a pick is still settling the swatch stays on what the user is
  // choosing: the value arriving from the store is the previous one, and
  // adopting it would flicker the colour back for a frame.
  useEffect(() => {
    if (timer.current === null) setDraft(customAccent)
  }, [customAccent])

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    []
  )

  const isCustom = accent === 'custom'

  const preview = (value: string): void => {
    const hex = normalizeHexColor(value)
    if (!hex || hex === draft) return
    setDraft(hex)
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      onChange({ accent: 'custom', customAccent: hex })
    }, COMMIT_DELAY_MS)
  }

  return (
    <div className="accent-picker" role="radiogroup" aria-label="Accent colour">
      {ACCENTS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          role="radio"
          aria-checked={accent === preset.value}
          aria-label={preset.label}
          title={preset.label}
          data-accent={preset.value}
          className={`accent-swatch${accent === preset.value ? ' is-selected' : ''}`}
          onClick={() => onChange({ accent: preset.value })}
        />
      ))}

      <span className="accent-picker__divider" aria-hidden="true" />

      <span className="accent-custom">
        <button
          type="button"
          role="radio"
          aria-checked={isCustom}
          aria-label={`Custom colour, ${draft}`}
          title="Pick a colour"
          style={{ '--swatch': draft } as CSSProperties}
          className={`accent-swatch accent-swatch--custom${isCustom ? ' is-selected' : ''}`}
          onClick={() => {
            // Choosing and opening are one gesture: the accent is applied
            // straight away so the interface previews it behind the dialog.
            if (!isCustom) onChange({ accent: 'custom', customAccent: draft })
            input.current?.click()
          }}
        >
          <DropletIcon size={13} />
        </button>
        {/* Sits over the swatch, invisible and untargetable, so the platform
            dialog opens next to the colour it is editing. */}
        <input
          ref={input}
          type="color"
          className="accent-custom__input"
          value={draft}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => preview(event.target.value)}
        />
      </span>
      {isCustom && <span className="accent-picker__value">{draft.toUpperCase()}</span>}
    </div>
  )
}
