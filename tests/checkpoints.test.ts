import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { applyPatch } from 'diff'
import { sourceDiff } from '../src/workshop/source'
import {
  checkpoints,
  checkpointFor,
  checkpointById,
  substepsFor,
  parts,
  partStatus,
} from '../src/workshop/catalog'
import { lessons } from '../src/workshop/steps'

const root = resolve(import.meta.dirname, '..')
const hash = (code: string | Buffer) =>
  createHash('sha256').update(code).digest('hex')
function practiceHashes() {
  function walk(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(resolve(directory, entry.name))
        : [resolve(directory, entry.name)],
    )
  }
  return Object.fromEntries(
    walk(resolve(root, 'src/practice')).map((path) => [
      relative(root, path),
      hash(readFileSync(path)),
    ]),
  )
}

describe('Checkpoint materialize và liên kết thật', () => {
  it('tái hiện được, đúng hash manifest và giữ nguyên toàn bộ bài đang làm', () => {
    const before = practiceHashes()
    const manifest = readFileSync(
      resolve(root, 'checkpoints/manifest.json'),
      'utf8',
    )
    execFileSync(process.execPath, ['scripts/prepare-source.mjs'], {
      cwd: root,
    })
    expect(
      readFileSync(resolve(root, 'checkpoints/manifest.json'), 'utf8'),
    ).toBe(manifest)
    expect(practiceHashes()).toEqual(before)
    for (const cp of checkpoints)
      for (const file of cp.files) {
        expect(
          hash(readFileSync(resolve(root, 'checkpoints', cp.id, file.path))),
          `${cp.id}/${file.path}`,
        ).toBe(file.sha256)
      }
  })
  it('mọi bước con dẫn tới checkpoint có thật và file source của chính checkpoint', () => {
    expect(checkpoints.length).toBeGreaterThanOrEqual(22)
    for (const { id: step } of lessons)
      for (const sub of substepsFor(step)) {
        expect(checkpointFor(step, sub.index).id).toBe(sub.checkpoint.id)
        expect(
          sub.checkpoint.files.some((file) => file.path === sub.sourceFile),
        ).toBe(true)
      }
  })
  it('diff của từng file tái dựng đúng code sau; trạng thái mới/sửa/giữ nguyên khớp bytes', () => {
    for (const cp of checkpoints.filter((cp) => cp.previous !== null))
      for (const file of cp.files) {
        const previous = checkpoints.find((item) => item.id === cp.previous)
        const oldExists = previous?.files.some(
          (item) => item.path === file.path,
        )
        const before = oldExists
          ? readFileSync(
              resolve(root, 'checkpoints', cp.previous ?? '', file.path),
              'utf8',
            )
          : ''
        const after = readFileSync(
          resolve(root, 'checkpoints', cp.id, file.path),
          'utf8',
        )
        expect(file.status).toBe(
          !oldExists ? 'new' : before === after ? 'unchanged' : 'modified',
        )
        expect(
          applyPatch(
            before,
            sourceDiff(file.path, before, after, cp.previous ?? '', cp.id),
          ),
        ).toBe(after)
      }
  })
  it('mốc trước không chứa component tương lai và trạng thái sơ đồ theo source có thật', () => {
    expect(
      checkpointById('02').files.some(
        (file) => file.path === 'components/FormFields.tsx',
      ),
    ).toBe(false)
    const pricing = parts.find((part) => part.id === 'pricing')
    if (!pricing) throw new Error('Thiếu pricing')
    expect(partStatus(pricing, checkpointById('02'))).toBe('future')
    expect(partStatus(pricing, checkpointById('05'))).toBe('current')
    const before = readFileSync(
      resolve(root, 'checkpoints/04/pages/CreateQuotation.tsx'),
      'utf8',
    )
    const after = readFileSync(
      resolve(root, 'checkpoints/05/pages/CreateQuotation.tsx'),
      'utf8',
    )
    expect(before).not.toMatch(/setPremium\(\s*calculatePremium/)
    expect(after).toMatch(/setPremium\(\s*calculatePremium/)
  })
})
