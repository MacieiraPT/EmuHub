/** Shortens a long path for display while keeping both ends readable. */
export function shortenPath(filePath: string, maxLength = 56): string {
  if (filePath.length <= maxLength) return filePath
  const separator = filePath.includes('\\') ? '\\' : '/'
  const segments = filePath.split(separator)
  if (segments.length <= 2) return `…${filePath.slice(-(maxLength - 1))}`

  const fileName = segments[segments.length - 1] ?? ''
  const root = segments[0] ?? ''
  let result = `${root}${separator}…${separator}${fileName}`

  for (let index = segments.length - 2; index > 0 && result.length < maxLength; index -= 1) {
    const candidate = `${root}${separator}…${separator}${segments.slice(index, -1).join(separator)}${separator}${fileName}`
    if (candidate.length > maxLength) break
    result = candidate
  }
  return result
}

export function fileNameOf(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath
}

export function directoryOf(filePath: string): string {
  const separator = filePath.includes('\\') ? '\\' : '/'
  const index = filePath.lastIndexOf(separator)
  return index > 0 ? filePath.slice(0, index) : filePath
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Never' : dateTimeFormatter.format(date)
}

/** "2 hours ago" style label with a sensible fallback to an absolute date. */
export function formatRelative(iso: string | null): string {
  if (!iso) return 'Never launched'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Never launched'

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function generationLabel(generation: number | null): string {
  if (generation === null) return 'Home computer'
  const suffix = generation === 1 ? 'st' : generation === 2 ? 'nd' : generation === 3 ? 'rd' : 'th'
  return `${generation}${suffix} generation`
}
