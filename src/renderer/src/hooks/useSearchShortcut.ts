import { useEffect, useRef } from 'react'

/**
 * Focuses a search field on Ctrl/Cmd+F. The browser's own find bar is not
 * available in the app window, so this does not take a shortcut away from the
 * user.
 */
export function useSearchShortcut() {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        ref.current?.focus()
        ref.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return ref
}
