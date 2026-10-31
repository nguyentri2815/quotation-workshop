import { useEffect, useRef, useState } from 'react'
import { checkpoints, substepsFor } from './catalog'
import type { Checkpoint } from './catalog'
import styles from './workshop.module.css'
import { usePreviewGuide } from './PreviewGuide'

function PreviewFrame({ src, title, guided = false }: { src: string; title: string; guided?: boolean }) {
  const { attach } = usePreviewGuide()
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const frame = useRef<HTMLIFrameElement>(null)
  const cleanup = useRef<() => void>(() => undefined)
  useEffect(() => () => { cleanup.current(); if (guided) attach(null) }, [attach, guided])
  function loaded() {
    cleanup.current()
    setLoading(false)
    setError('')
    if (guided) attach(frame.current)
    const win = frame.current?.contentWindow
    const doc = frame.current?.contentDocument
    if (!win || !doc) {
      setError(
        'Không truy cập được preview cùng origin. Hãy mở lại bằng localhost.',
      )
      return
    }
    const runtimeError = (event: ErrorEvent) =>
      setError(
        event.message ||
          'Preview gặp lỗi runtime. Xem Console của iframe để kiểm tra source.',
      )
    const rejection = (event: PromiseRejectionEvent) =>
      setError(
        event.reason instanceof Error
          ? event.reason.message
          : 'Preview có tác vụ không xử lý được.',
      )
    const inspect = () => {
      if (doc.querySelector('vite-error-overlay'))
        setError(
          'Source preview đang có lỗi biên dịch/import. Kiểm tra terminal Vite hoặc mở preview riêng.',
        )
      else if (
        doc.getElementById('root')?.textContent?.startsWith('Không mở được')
      )
        setError(
          doc.getElementById('root')?.textContent ?? 'Không mở được preview.',
        )
    }
    const observer = new MutationObserver(inspect)
    observer.observe(doc.documentElement, { childList: true, subtree: true })
    win.addEventListener('error', runtimeError)
    win.addEventListener('unhandledrejection', rejection)
    cleanup.current = () => {
      observer.disconnect()
      win.removeEventListener('error', runtimeError)
      win.removeEventListener('unhandledrejection', rejection)
    }
    inspect()
  }
  return (
    <div className={styles.frameHost}>
      {loading && (
        <p className={styles.frameStatus} role="status">
          Đang mở preview…
        </p>
      )}
      {error && (
        <div className={styles.previewError} role="alert">
          <strong>Preview cần kiểm tra</strong>
          <p>{error}</p>
          <button
            onClick={() => {
              setError('')
              setLoading(true)
              setAttempt(attempt + 1)
            }}
          >
            Tải lại preview
          </button>
          <a href={src} target="_blank" rel="noreferrer">
            Mở riêng ↗
          </a>
        </div>
      )}
      <iframe
        ref={frame}
        key={attempt}
        src={src}
        title={title}
        onLoad={loaded}
        onError={() =>
          setError('Không tải được preview. Kiểm tra server Vite.')
        }
      />
    </div>
  )
}

export function Preview({
  checkpoint,
  mode,
  onMode,
  onCheckpoint,
  comparison,
}: {
  checkpoint: Checkpoint
  mode: 'sample' | 'mine'
  onMode: (mode: 'sample' | 'mine') => void
  onCheckpoint: (id: string) => void
  comparison: string
}) {
  const [mountMine, setMountMine] = useState(mode === 'mine')
  useEffect(() => {
    if (mode === 'mine') setMountMine(true)
  }, [mode])
  const sampleUrl = `/checkpoints/${checkpoint.id}/index.html#/quotations/new`
  const mineUrl = '/practice.html#/quotations/new'
  const url = mode === 'sample' ? sampleUrl : mineUrl
  const lastInStep =
    substepsFor(checkpoint.step).at(-1)?.checkpoint.id ?? checkpoint.id
  return (
    <>
      <div className={styles.previewHeader}>
        <div>
          <strong>Preview</strong>
          <a href={url} target="_blank" rel="noreferrer">
            Mở riêng ↗
          </a>
        </div>
        <div className={styles.segmented} aria-label="Chế độ preview">
          <button
            aria-pressed={mode === 'sample'}
            onClick={() => onMode('sample')}
          >
            Theo bước mẫu
          </button>
          <button
            aria-pressed={mode === 'mine'}
            onClick={() => {
              setMountMine(true)
              onMode('mine')
            }}
          >
            Bài tôi đang làm
          </button>
        </div>
      </div>
      {mode === 'sample' ? (
        <div className={styles.previewContext}>
          <strong
            className={styles.previewComparison}
            data-testid="preview-side"
          >
            {comparison}
          </strong>
          <label htmlFor="checkpoint-select">Checkpoint mẫu</label>
          <select
            id="checkpoint-select"
            value={checkpoint.id}
            onChange={(event) => onCheckpoint(event.target.value)}
          >
            {checkpoints.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.id} · {cp.title}
              </option>
            ))}
          </select>
          <p>{checkpoint.ui}</p>
          <details><summary>Thay đổi · source · dữ liệu theo mốc</summary>
          <div className={styles.previewChanges}>
            <strong>So với mốc {checkpoint.previous ?? 'bắt đầu'}</strong>
            <span>
              {checkpoint.previous
                ? checkpoint.files
                    .filter((file) => file.status !== 'unchanged')
                    .map((file) => file.path)
                    .join(', ') || 'Không đổi code; bước đối chiếu.'
                : 'Scaffold được cung cấp; chưa có nghiệp vụ.'}
            </span>
          </div>
          {checkpoint.id !== lastInStep && (
            <button onClick={() => onCheckpoint(lastInStep)}>
              Xem mốc cuối bước {checkpoint.step} →
            </button>
          )}
          <small>
            Source: checkpoints/{checkpoint.id}/ · Dữ liệu riêng theo mốc.
            Đổi checkpoint khởi tạo lại form; chuyển file/tab giữ dữ liệu đang nhập.
          </small>
          </details>
          <small>Đổi checkpoint khởi tạo lại form. Đổi file/tab giữ dữ liệu đang nhập.</small>
        </div>
      ) : (
        <div className={styles.previewContext}>
          <strong>Source thật · src/practice</strong>
          <p>
            HMR từ bài bạn sửa trong IDE. Chuyển bước chỉ đổi hướng dẫn; chưa
            xác minh bài này đang ở checkpoint nào.
          </p>
          <small>Giữ nguyên source và dữ liệu bài đang làm.</small>
        </div>
      )}
      <div className={styles.frames}>
        <div hidden={mode !== 'sample'} className={styles.frameSlot}>
          <PreviewFrame
            key={checkpoint.id}
            guided
            src={sampleUrl}
            title={`Preview mẫu checkpoint ${checkpoint.id}`}
          />
        </div>
        {mountMine && (
          <div hidden={mode !== 'mine'} className={styles.frameSlot}>
            <PreviewFrame src={mineUrl} title="Bài tôi đang làm · HMR" />
          </div>
        )}
      </div>
      <div className={styles.referenceLink}>
        <a href="/reference.html#/quotations" target="_blank" rel="noreferrer">
          Mở bản hoàn chỉnh tham chiếu riêng ↗
        </a>
        <small>Không dùng bản hoàn chỉnh để giả lập các bước trước.</small>
      </div>
    </>
  )
}
