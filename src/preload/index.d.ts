import type { EmuHubApi } from './index'

declare global {
  interface Window {
    emuhub: EmuHubApi
  }
}

export {}
