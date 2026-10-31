export const LEGACY_PROGRESS_KEY = 'quotation-workshop.guide.v1'
export const PROGRESS_KEY = 'quotation-workshop.behaviors.v2'
export interface Progress {
  version: 2
  started: boolean
  current: number
  visited: number[]
  checked: number[]
  notes: Record<string, string>
}
export const initialProgress = (): Progress => ({
  version: 2,
  started: false,
  current: 0,
  visited: [0],
  checked: [],
  notes: {},
})
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function validSteps(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => Number.isInteger(id) && id >= 0 && id <= 6)
}

export function loadProgress(): { progress: Progress; warning: string } {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw === null) return { progress: initialProgress(), warning: '' }
    const data: unknown = JSON.parse(raw)
    if (
      !record(data) ||
      data.version !== 2 ||
      typeof data.started !== 'boolean' ||
      typeof data.current !== 'number' ||
      !Number.isInteger(data.current) ||
      data.current < 0 ||
      data.current > 6 ||
      !validSteps(data.visited) ||
      !validSteps(data.checked) ||
      !record(data.notes)
    )
      throw new Error('Tiến độ không hợp lệ')
    const notes: Record<string, string> = {}
    for (let i = 0; i <= 6; i++) {
      const note = data.notes[String(i)]
      if (typeof note === 'string') notes[String(i)] = note
    }
    return {
      progress: {
        version: 2,
        started: data.started,
        current: data.current,
        visited: [...new Set(data.visited)],
        checked: [...new Set(data.checked)],
        notes,
      },
      warning: '',
    }
  } catch {
    return {
      progress: initialProgress(),
      warning:
        'Không đọc được tiến độ đã lưu. Bạn vẫn có thể học; thay đổi tiếp theo sẽ lưu tiến độ mới nếu trình duyệt cho phép.',
    }
  }
}

export function saveProgress(progress: Progress): string {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    return ''
  } catch {
    return 'Không lưu được tiến độ trên trình duyệt. Phiên này vẫn dùng được, nhưng có thể mất dấu đã học khi reload.'
  }
}

export function legacyProgressSummary(): string {
  try {
    const raw = localStorage.getItem(LEGACY_PROGRESS_KEY)
    if (!raw) return ''
    const value: unknown = JSON.parse(raw)
    if (!record(value)) return 'Tiến độ cũ vẫn được giữ nguyên trong trình duyệt.'
    const checked = Array.isArray(value.checked) ? value.checked.filter(id => Number.isInteger(id) && id >= 0 && id <= 12) : []
    const notes = record(value.notes) ? Object.entries(value.notes).filter(([, note]) => typeof note === 'string') : []
    return 'Tiến độ cũ (tham khảo): ' + checked.length + '/13 mục đã tự xác nhận. Tiêu chí mới cần xác nhận lại. ' + notes.map(([id, note]) => 'Ghi chú bước cũ ' + id + ': ' + note).join(' • ')
  } catch {
    return 'Chưa đọc được tiến độ cũ; dữ liệu gốc vẫn được giữ nguyên.'
  }
}
