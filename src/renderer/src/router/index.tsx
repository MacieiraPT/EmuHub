import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode
} from 'react'

/**
 * A hash router sized for this application.
 *
 * EmuHub has four screens and one parameter. A general-purpose routing library
 * costs roughly a tenth of the renderer bundle plus its matching machinery on
 * every navigation, which is a poor trade for a desktop window that never
 * touches a URL bar. This provides exactly what the interface uses.
 */

interface RouterValue {
  path: string
  navigate: (to: string, options?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterValue | null>(null)
const ParamsContext = createContext<Record<string, string>>({})

const readPath = (): string => {
  const hash = window.location.hash.replace(/^#/, '')
  return hash.length > 0 ? hash : '/'
}

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(readPath)

  useEffect(() => {
    const onHashChange = (): void => setPath(readPath())
    window.addEventListener('hashchange', onHashChange)
    if (window.location.hash === '') window.location.replace('#/')
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback<RouterValue['navigate']>((to, options) => {
    if (readPath() === to) return
    if (options?.replace) window.location.replace(`#${to}`)
    else window.location.hash = to
  }, [])

  const value = useMemo(() => ({ path, navigate }), [path, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

function useRouter(): RouterValue {
  const context = useContext(RouterContext)
  if (!context) throw new Error('Router hooks must be used inside <Router>')
  return context
}

export function useNavigate(): RouterValue['navigate'] {
  return useRouter().navigate
}

export function usePath(): string {
  return useRouter().path
}

export function useParams(): Record<string, string> {
  return useContext(ParamsContext)
}

export interface RouteDefinition {
  /** A path with optional `:name` segments, e.g. `/console/:entryId`. */
  path: string
  element: ReactNode
}

/** Matches a concrete path against a route pattern, extracting parameters. */
function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index] as string
    const actual = pathParts[index] as string
    if (expected.startsWith(':')) params[expected.slice(1)] = decodeURIComponent(actual)
    else if (expected !== actual) return null
  }
  return params
}

/** Renders the first matching route, or `fallback` when nothing matches. */
export function Routes({ routes, fallback }: { routes: RouteDefinition[]; fallback: ReactNode }) {
  const path = usePath()

  for (const route of routes) {
    const params = matchRoute(route.path, path)
    if (params) {
      return <ParamsContext.Provider value={params}>{route.element}</ParamsContext.Provider>
    }
  }
  return <>{fallback}</>
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
}

export function Link({ to, children, onClick, ...props }: LinkProps) {
  const navigate = useNavigate()
  return (
    <a
      href={`#${to}`}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.metaKey || event.ctrlKey) return
        event.preventDefault()
        navigate(to)
      }}
      {...props}
    >
      {children}
    </a>
  )
}

interface NavLinkProps extends Omit<LinkProps, 'className'> {
  /** `end` requires an exact match instead of a prefix match. */
  end?: boolean
  className: (state: { isActive: boolean }) => string
}

export function NavLink({ to, end = false, className, children, ...props }: NavLinkProps) {
  const path = usePath()
  const isActive = end ? path === to : path === to || path.startsWith(`${to}/`)
  return (
    <Link to={to} className={className({ isActive })} aria-current={isActive ? 'page' : undefined} {...props}>
      {children}
    </Link>
  )
}
