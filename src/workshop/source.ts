import { createTwoFilesPatch, structuredPatch } from 'diff'
import generated from '../../.workshop/source-index.json'
import { checkpoints } from './catalog'

export interface SymbolRange {
  name: string
  qualified: string
  kind: string
  start: number
  end: number
}
interface IndexedFile {
  sha256: string
  ranges: SymbolRange[]
  sections: FileSection[]
}
export interface FileSection {
  id: string
  title: string
  role: string
  input: string
  output: string
  links: Array<{ file: string; symbol: string; label: string }>
  ranges: SymbolRange[]
}
const index: { checkpoints: Record<string, Record<string, string>>; files: Record<string, IndexedFile> } = generated
const indexedFile = (checkpoint: string, path: string) => index.files[index.checkpoints[checkpoint]?.[path]]
export const sectionsAt = (checkpoint: string, path: string): FileSection[] =>
  indexedFile(checkpoint, path)?.sections ?? []
export const symbolsAt = (checkpoint: string, path: string): SymbolRange[] =>
  indexedFile(checkpoint, path)?.ranges ?? []
export function findSymbol(checkpoint: string, path: string, symbol: string) {
  const ranges = symbolsAt(checkpoint, path)
  return (
    ranges.find((range) => range.qualified === symbol) ??
    ranges.find((range) => range.name === symbol)
  )
}
export function symbolBirth(path: string, symbol: string) {
  return checkpoints.find((checkpoint) =>
    findSymbol(checkpoint.id, path, symbol),
  )
}
export interface CodeRow {
  text: string
  line?: number
  oldLine?: number
  newLine?: number
  kind?: 'add' | 'remove' | 'context' | 'hunk'
}
export function diffRows(
  path: string,
  before: string,
  after: string,
  full = true,
): CodeRow[] {
  return structuredPatch(path, path, before, after, '', '', {
    context: full ? Number.MAX_SAFE_INTEGER : 3,
  }).hunks.flatMap((hunk) => {
    let oldLine = hunk.oldStart
    let newLine = hunk.newStart
    const rows: CodeRow[] = [
      {
        kind: 'hunk',
        text: `@@ −${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
      },
    ]
    for (const line of hunk.lines) {
      if (line.startsWith('+'))
        rows.push({ text: line.slice(1), newLine: newLine++, kind: 'add' })
      else if (line.startsWith('-'))
        rows.push({ text: line.slice(1), oldLine: oldLine++, kind: 'remove' })
      else if (line.startsWith(' '))
        rows.push({
          text: line.slice(1),
          oldLine: oldLine++,
          newLine: newLine++,
          kind: 'context',
        })
    }
    return rows
  })
}
export function sourceRows(
  code: string,
  range?: SymbolRange,
  related = false,
): CodeRow[] {
  const lines = code.split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop()
  const start = related && range ? range.start : 1
  const end = related && range ? range.end : lines.length
  return lines
    .slice(start - 1, end)
    .map((text, offset) => ({ text, line: start + offset }))
}

const loaders = import.meta.glob('../../checkpoints/**/*.{ts,tsx,css,html}', {
  query: '?raw',
  import: 'default',
})
const cache = new Map<string, Promise<string>>()
export function readSource(checkpoint: string, path: string): Promise<string> {
  const key = `../../checkpoints/${checkpoint}/${path}`
  if (!cache.has(key)) {
    const loader = loaders[key]
    if (!loader)
      return Promise.reject(
        new Error(`File ${path} chưa có ở checkpoint ${checkpoint}.`),
      )
    cache.set(
      key,
      loader()
        .then((code) => String(code))
        .catch((error) => {
          cache.delete(key)
          throw error
        }),
    )
  }
  return cache.get(key) ?? Promise.reject(new Error('Không nạp được source.'))
}
export function sourceDiff(
  path: string,
  before: string,
  after: string,
  previous: string,
  current: string,
) {
  return createTwoFilesPatch(
    `${previous}/${path}`,
    `${current}/${path}`,
    before,
    after,
    '',
    '',
    {
      context: 4,
    },
  )
}
