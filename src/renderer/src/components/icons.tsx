import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

/** Stroke-based icon set drawn on a 24px grid for consistent optical weight. */
function Icon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const GridIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Icon>
)

export const SettingsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.6 14.4a1.5 1.5 0 0 0 .3 1.65l.05.05a1.8 1.8 0 1 1-2.55 2.55l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37V20a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.05.05A1.8 1.8 0 1 1 4 16.33l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H2.8a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65L3.92 7.4A1.8 1.8 0 1 1 6.47 4.85l.05.05a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37V3.7a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.8 1.8 0 1 1 2.55 2.55l-.05.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9h.19a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.76z" />
  </Icon>
)

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.6" />
    <path d="m20 20-3.6-3.6" />
  </Icon>
)

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const PlayIcon = ({ size = 18, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
    <path d="M8.4 5.3a1 1 0 0 1 1.52-.86l8.2 5.9a1.3 1.3 0 0 1 0 2.2l-8.2 5.9a1 1 0 0 1-1.52-.86z" />
  </svg>
)

export const MoreIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
)

export const FolderIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 7.4A1.9 1.9 0 0 1 5.4 5.5h3.3l2 2.4h7.9a1.9 1.9 0 0 1 1.9 1.9v7.3a1.9 1.9 0 0 1-1.9 1.9H5.4a1.9 1.9 0 0 1-1.9-1.9z" />
  </Icon>
)

export const EditIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20h4.2l9.1-9.1a2 2 0 0 0 0-2.83l-1.37-1.37a2 2 0 0 0-2.83 0L4 15.8z" />
    <path d="m13.6 6.4 4 4" />
  </Icon>
)

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 6.8h15M9.5 6.8V5.4a1.6 1.6 0 0 1 1.6-1.6h1.8a1.6 1.6 0 0 1 1.6 1.6v1.4" />
    <path d="M6.6 6.8 7.4 19a1.7 1.7 0 0 0 1.7 1.6h5.8a1.7 1.7 0 0 0 1.7-1.6l.8-12.2" />
    <path d="M10.5 10.6v6M13.5 10.6v6" />
  </Icon>
)

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m4.8 12.5 4.6 4.6L19.2 7.3" />
  </Icon>
)

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Icon>
)

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Icon>
)

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5.8 9.2 6.2 6.2 6.2-6.2" />
  </Icon>
)

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />
  </Icon>
)

export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10.3 4.3 2.9 17.1a1.9 1.9 0 0 0 1.65 2.85h14.9a1.9 1.9 0 0 0 1.65-2.85L13.7 4.3a1.9 1.9 0 0 0-3.4 0z" />
    <path d="M12 9.4v4.2M12 17.1h.01" />
  </Icon>
)

export const InfoIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
)

export const RefreshIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 11.5A8 8 0 0 0 6.1 6.6L4 8.6" />
    <path d="M4 12.5a8 8 0 0 0 13.9 4.9l2.1-2" />
    <path d="M4 4.5v4.1h4.1M20 19.5v-4.1h-4.1" />
  </Icon>
)

export const ExternalIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M13.5 4.5H19.5V10.5" />
    <path d="m19.5 4.5-8 8" />
    <path d="M18 14.4v4.1a1.9 1.9 0 0 1-1.9 1.9H5.4a1.9 1.9 0 0 1-1.9-1.9V7.8a1.9 1.9 0 0 1 1.9-1.9h4.1" />
  </Icon>
)

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.8v10.4" />
    <path d="m7.9 10.1 4.1 4.1 4.1-4.1" />
    <path d="M4.5 16.4v2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-2" />
  </Icon>
)

export const UploadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 14.2V3.8" />
    <path d="m7.9 7.9 4.1-4.1 4.1 4.1" />
    <path d="M4.5 16.4v2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-2" />
  </Icon>
)

export const SparkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6L4.5 10.9 10.1 9z" />
  </Icon>
)

export const StarIcon = ({ filled = false, size = 18, ...props }: IconProps & { filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="m12 4 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-3.9 5.6-.8z" />
  </svg>
)

export const MinimizeIcon = (props: IconProps) => (
  <Icon strokeWidth={1.4} {...props}>
    <path d="M5.5 12h13" />
  </Icon>
)

export const MaximizeIcon = (props: IconProps) => (
  <Icon strokeWidth={1.4} {...props}>
    <rect x="5.8" y="5.8" width="12.4" height="12.4" rx="1.6" />
  </Icon>
)

export const RestoreIcon = (props: IconProps) => (
  <Icon strokeWidth={1.4} {...props}>
    <rect x="4.8" y="7.8" width="10.4" height="10.4" rx="1.6" />
    <path d="M8.4 7.8V6.4a1.6 1.6 0 0 1 1.6-1.6h7.6a1.6 1.6 0 0 1 1.6 1.6V14a1.6 1.6 0 0 1-1.6 1.6h-1.4" />
  </Icon>
)

export const LayersIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m12 3.6 8.4 4.3-8.4 4.3-8.4-4.3z" />
    <path d="m3.6 12.3 8.4 4.3 8.4-4.3" />
    <path d="m3.6 16.4 8.4 4.3 8.4-4.3" />
  </Icon>
)

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.8v2.2M12 19v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.8 12H5M19 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
  </Icon>
)

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
  </Icon>
)

export const MonitorIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.2" y="4.6" width="17.6" height="11.6" rx="2" />
    <path d="M9 20h6M12 16.2V20" />
  </Icon>
)
