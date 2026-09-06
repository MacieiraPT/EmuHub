import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const shared = resolve('src/shared')

/**
 * The renderer ships a strict Content-Security-Policy. Vite injects an inline
 * preamble while developing, so the policy is relaxed for the dev server only
 * and the production build keeps the strict one.
 */
function devFriendlyCsp(): Plugin {
  return {
    name: 'emuhub-dev-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        if (!context.server) return html
        return html
          .replace("script-src 'self'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'")
          .replace("connect-src 'self'", "connect-src 'self' ws: http://localhost:*")
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': shared } },
    build: { rollupOptions: { input: { index: resolve('src/main/index.ts') } } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': shared } },
    build: {
      rollupOptions: {
        input: { index: resolve('src/preload/index.ts') },
        // A sandboxed preload must be CommonJS, so it is emitted as .cjs even
        // though the rest of the application is ESM.
        output: { format: 'cjs', entryFileNames: '[name].cjs' }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': shared
      }
    },
    plugins: [react(), devFriendlyCsp()],
    build: {
      minify: 'esbuild',
      target: 'chrome130',
      chunkSizeWarningLimit: 900,
      rollupOptions: { input: { index: resolve('src/renderer/index.html') } }
    }
  }
})
