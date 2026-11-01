import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { analyzeSource } from './analyze-source.mjs'

const root = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await readFile(resolve(root, 'stage2/manifest.json'), 'utf8'))
const revision = JSON.parse(await readFile(resolve(root, 'stage2/revision-2.json'), 'utf8'))
const current = JSON.parse(await readFile(resolve(root, 'stage2/revision-3.json'), 'utf8'))
const paced = JSON.parse(await readFile(resolve(root, 'stage2/revision-4.json'), 'utf8'))
const index = { checkpoints: {}, files: {} }
for (const checkpoint of [...manifest.checkpoints,...revision.checkpoints,...current.checkpoints,...paced.checkpoints]) {
  index.checkpoints[checkpoint.id] = {}
  for (const file of checkpoint.files) {
    const code = await readFile(resolve(root, 'checkpoints', checkpoint.id, file.path), 'utf8')
    const sha256 = createHash('sha256').update(code).digest('hex')
    if (sha256 !== file.sha256) throw new Error(`Stage 2 snapshot ${checkpoint.id}/${file.path} khác manifest. Kiểm tra trước khi tiếp tục.`)
    const key = file.path + ':' + sha256
    index.checkpoints[checkpoint.id][file.path] = key
    index.files[key] ??= { sha256, ...analyzeSource(file.path, code, checkpoint.id) }
  }
}
const target = resolve(root, 'stage2/source-index.json')
const output = JSON.stringify(index) + '\n'
let old = ''
try { old = await readFile(target, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
if (old !== output) await writeFile(target, output, 'utf8')
console.log(`Verified ${Object.keys(index.checkpoints).length} stage 2 snapshots; indexed using the existing AST/CSS analyzer. Stage 1 index remains separate.`)
