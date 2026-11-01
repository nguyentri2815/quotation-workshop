import { access } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
try {
  await access(resolve(root, 'checkpoints/manifest.json'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  execFileSync(process.execPath, ['scripts/materialize-checkpoints.mjs'], {
    cwd: root,
    stdio: 'inherit',
  })
}
// Existing snapshots are read and verified, never overwritten during dev/build/test.
await import('./index-source.mjs')
await import('./index-stage2.mjs')
