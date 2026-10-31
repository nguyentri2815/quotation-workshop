import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { analyzeSource } from './analyze-source.mjs'

const root = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await readFile(resolve(root, 'checkpoints/manifest.json'), 'utf8'))
const index = { checkpoints: {}, files: {} }
for (const checkpoint of manifest.checkpoints) {
  index.checkpoints[checkpoint.id] = {}
  for (const file of checkpoint.files) {
    const code = await readFile(resolve(root, 'checkpoints', checkpoint.id, file.path), 'utf8')
    const sha256 = createHash('sha256').update(code).digest('hex')
    if (sha256 !== file.sha256) throw new Error(`Snapshot ${checkpoint.id}/${file.path} khác manifest. Giữ nguyên và kiểm tra trước khi tiếp tục.`)
    const key = file.path + ':' + sha256
    index.checkpoints[checkpoint.id][file.path] = key
    if (!index.files[key]) index.files[key] = { sha256, ...analyzeSource(file.path, code, checkpoint.id) }
  }
}
const target = resolve(root, '.workshop/source-index.json')
await mkdir(resolve(root, '.workshop'), { recursive: true })
const output = JSON.stringify(index) + '\n'
let old = ''
try { old = await readFile(target, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
if (old !== output) await writeFile(target, output, 'utf8')
console.log(`Verified ${manifest.checkpoints.length} snapshots; indexed AST ranges and file analysis. No snapshot/practice edits.`)
