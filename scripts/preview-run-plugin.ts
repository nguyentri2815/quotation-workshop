import { resolve } from 'node:path'
import type { Plugin } from 'vite'

// Transform only workshop adapters in the served/built preview. Pinned files on
// disk and source displayed by the lesson remain untouched.
export function previewRunPlugin(): Plugin {
  const adapter = JSON.stringify(resolve(import.meta.dirname, '../src/workshop/run/preview-adapter.ts').replaceAll('\\', '/'))
  return {
    name: 'workshop-run-adapter',
    enforce: 'pre',
    transform(code, id) {
      const query = new URLSearchParams(id.split('?')[1])
      if (query.has('raw') || query.has('url')) return
      const path = id.replaceAll('\\', '/').split('?')[0]
      if (!/\/checkpoints\/[^/]+\//.test(path)) return
      if (path.endsWith('/_workshop/environment.ts')) {
        return `import { runEnvironment } from ${adapter}\n` + code
          .replace(/export const apiBase = (.+)/, 'export const apiBase = runEnvironment(checkpointId)?.apiBase ?? ($1)')
          .replace(/export const storageKey = (.+)/, 'export const storageKey = runEnvironment(checkpointId)?.storageKey ?? ($1)')
      }
      if (path.endsWith('/mocks/browser.ts')) return code + `\nimport { observeRunWorker } from ${adapter}\nobserveRunWorker(worker)\n`
    },
  }
}
