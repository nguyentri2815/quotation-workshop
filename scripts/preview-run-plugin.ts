import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import ts from 'typescript'

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
        // Formatting may split an initializer across multiple lines. Resolve
        // the declaration, not a particular textual layout, for both stages.
        const file = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true)
        const edits: Array<{ start: number; end: number; text: string }> = []
        for (const statement of file.statements) {
          if (!ts.isVariableStatement(statement)) continue
          for (const declaration of statement.declarationList.declarations) {
            const name = declaration.name.getText(file)
            if (!['apiBase', 'storageKey'].includes(name) || !declaration.initializer) continue
            const value = declaration.initializer
            edits.push({ start: value.getStart(file), end: value.end, text: `runEnvironment(checkpointId)?.${name} ?? (${value.getText(file)})` })
          }
        }
        for (const edit of edits.sort((a,b)=>b.start-a.start)) code = code.slice(0,edit.start)+edit.text+code.slice(edit.end)
        return `import { runEnvironment } from ${adapter}\n` + code
      }
      if (path.endsWith('/mocks/browser.ts')) return code + `\nimport { observeRunWorker } from ${adapter}\nobserveRunWorker(worker)\n`
    },
  }
}
