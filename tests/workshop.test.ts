import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { lessons } from '../src/workshop/steps'
import { initialProgress, loadProgress, PROGRESS_KEY, LEGACY_PROGRESS_KEY, saveProgress, legacyProgressSummary } from '../src/workshop/progress'

afterEach(() => vi.unstubAllGlobals())
describe('Tiến độ do người học xác nhận', () => {
  it('mở lần đầu không có bước nào tự được coi là đúng', () => {
    vi.stubGlobal('localStorage', { getItem: () => null })
    expect(loadProgress().progress.checked).toEqual([])
  })
  it('giữ ghi chú và bước đã tự kiểm tra riêng với bước đã ghé', () => {
    let stored = ''
    vi.stubGlobal('localStorage', {
      getItem: () => stored,
      setItem: (key: string, value: string) => {
        expect(key).toBe(PROGRESS_KEY)
        stored = value
      },
    })
    const progress = {
      ...initialProgress(),
      current: 3,
      visited: [0, 1, 2, 3],
      checked: [0],
      notes: { '3': 'State thực sự đổi khi gõ.' },
    }
    expect(saveProgress(progress)).toBe('')
    expect(loadProgress().progress).toEqual(progress)
    expect(loadProgress().progress.checked).toHaveLength(1)
  })
  it('báo rõ lỗi lưu trữ và dữ liệu tiến độ không hợp lệ', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => '{"version":1,"current":999}',
      setItem: () => {
        throw new Error('Quota')
      },
    })
    expect(loadProgress().warning).not.toBe('')
    expect(saveProgress(initialProgress())).not.toBe('')
  })
  it('lưu v2 riêng, giữ nguyên byte tiến độ và ghi chú legacy', () => {
    const legacy = JSON.stringify({ version: 1, current: 12, checked: [0, 3, 12], notes: { 3: 'Ghi chú cũ', 12: 'Đã đọc xong' } })
    const storage = new Map([[LEGACY_PROGRESS_KEY, legacy]])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })
    expect(PROGRESS_KEY).toBe('quotation-workshop.behaviors.v2')
    expect(LEGACY_PROGRESS_KEY).toBe('quotation-workshop.guide.v1')
    expect(loadProgress()).toEqual({ progress: initialProgress(), warning: '' })
    expect(legacyProgressSummary()).toContain('Ghi chú cũ')
    expect(legacyProgressSummary()).toContain('Đã đọc xong')
    const progress = { ...initialProgress(), started: true, current: 6, checked: [1, 6], notes: { 6: 'Ghi chú mới' } }
    expect(saveProgress(progress)).toBe('')
    expect(loadProgress().progress).toEqual(progress)
    expect(JSON.parse(storage.get(PROGRESS_KEY)!)).toEqual({ ...progress, version: 2 })
    expect(storage.get(LEGACY_PROGRESS_KEY)).toBe(legacy)
    expect(saveProgress(initialProgress())).toBe('')
    expect(storage.get(LEGACY_PROGRESS_KEY)).toBe(legacy)
  })
  it.each([
    { version: 1 }, { current: 7 }, { current: -1 }, { current: 1.5 },
    { visited: [0, 7] }, { checked: [12] }, { checked: ['1'] }, { notes: [] },
  ])('từ chối tiến độ ngoài schema sáu bước: %j', (invalid) => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ ...initialProgress(), ...invalid }) })
    expect(loadProgress().progress).toEqual(initialProgress())
    expect(loadProgress().warning).not.toBe('')
  })
  it('khử trùng lặp và chỉ nhận ghi chú trong bước 0–6', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({
      ...initialProgress(), current: 6, visited: [0, 6, 6], checked: [1, 1, 6],
      notes: { 0: 'Khám phá', 6: 'Hoàn tất', 7: 'Cũ', 2: 42 },
    }) })
    expect(loadProgress()).toEqual({ progress: {
      ...initialProgress(), current: 6, visited: [0, 6], checked: [1, 6],
      notes: { 0: 'Khám phá', 6: 'Hoàn tất' },
    }, warning: '' })
  })
})

describe('Nội dung và ranh giới của workshop', () => {
  it('khám phá và sáu bước có việc làm, checkpoint, lỗi, hai cấp gợi ý và giải thích riêng', () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(
      Array.from({ length: 7 }, (_, index) => index),
    )
    for (const lesson of lessons) {
      for (const text of [
        lesson.goal,
        lesson.why,
        lesson.before,
        lesson.forbidden,
        lesson.hint1,
        lesson.hint2,
        lesson.answer,
        lesson.explanation,
        lesson.question,
      ])
        expect(text.length).toBeGreaterThan(20)
      expect(lesson.tasks.length).toBeGreaterThan(0)
      expect(lesson.run.length).toBeGreaterThan(0)
      expect(lesson.expected.length).toBeGreaterThan(0)
      expect(lesson.troubleshooting.length).toBeGreaterThan(0)
    }
  })
  it('mọi file được chỉ dẫn tồn tại lúc đến bước đó hoặc được tạo ở lời giải bước đó', () => {
    const root = resolve(import.meta.dirname, '..')
    const virtual = new Set<string>()
    function files(directory: string): string[] {
      return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? files(resolve(directory, entry.name))
          : [resolve(directory, entry.name)],
      )
    }
    for (const file of files(resolve(root, 'src')))
      virtual.add(relative(root, file).replaceAll('\\', '/'))
    virtual.add('reference.html')
    for (const lesson of lessons) {
      const folder = resolve(root, 'solutions', String(lesson.id).padStart(2, '0'))
      if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(lesson.id)) {
        for (const file of files(folder))
          virtual.add('src/practice/' + relative(folder, file).replaceAll('\\', '/'))
      }
      for (const task of lesson.tasks)
        expect(task.file.endsWith('/') || virtual.has(task.file) || existsSync(resolve(root, task.file)), task.file).toBe(true)
    }
  })
  it('bản tham chiếu và thực hành không import chéo; namespace tách biệt', () => {
    const root = resolve(import.meta.dirname, '..')
    expect(readFileSync(resolve(root, 'src/reference/App.tsx'), 'utf8')).not.toContain('/practice')
    expect(readFileSync(resolve(root, 'src/reference/_workshop/environment.ts'), 'utf8')).toContain(
      'quotation-workshop.reference.v1',
    )
    expect(readFileSync(resolve(root, 'solutions/08/mocks/storage.ts'), 'utf8')).toContain(
      'quotation-workshop.practice.v1',
    )
    expect(readFileSync(resolve(root, 'src/reference/mocks/storage.ts'), 'utf8')).not.toContain(
      'quotation-product.demo.v1',
    )
  })
})
