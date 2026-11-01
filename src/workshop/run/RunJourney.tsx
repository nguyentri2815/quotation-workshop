import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { Route } from 'lucide-react'
import { SourcePanel } from '../SourcePanel'
import { PreviewGuideProvider } from '../PreviewGuide'
import { selectionAt } from '../navigation'
import { checkpoints } from '../catalog'
import { revisionCheckpoints } from '../../stage2/revision'
import { findSymbol } from '../source'
import { learningOperation } from './step-plans'
import type { RunController } from './useRunSession'
import type { Selection } from '../navigation'
import styles from './run.module.css'

export function RunJourney({ controller }: { controller: RunController }) {
  const run = controller.session!,
    journey = run.plan.journey!
  const dialog = useRef<HTMLDialogElement>(null)
  const shownDone = useRef(false)
  const [summary, setSummary] = useState(false)
  const segment = journey.segments.find((s) => s.taskIds.includes(run.plan.tasks[run.index]?.id))
  useEffect(() => {
    if (run.intro) dialog.current?.showModal()
  }, [run.intro])
  useEffect(() => {
    if (run.status === 'done' && !run.peek && !shownDone.current) {
      shownDone.current = true
      setSummary(true)
      dialog.current?.showModal()
    }
  }, [run.status, run.peek])
  function close() {
    if (run.intro) controller.begin()
    dialog.current?.close()
  }
  return (
    <>
      <button
        aria-label="Hành trình cả bước"
        title={`Hành trình: ${segment?.title}`}
        onClick={() => {
          setSummary(run.status === 'done')
          dialog.current?.showModal()
        }}
      >
        <Route aria-hidden />
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-label="Hành trình cả bước"
          onCancel={(e) => {
            e.preventDefault()
            if (run.intro) controller.exit()
            else close()
          }}
        >
          <header>
            <strong>{run.plan.title}</strong>
            <button autoFocus onClick={close}>
              {run.intro ? 'Bắt đầu hành trình' : 'Đóng hành trình'}
            </button>
          </header>
          <p>
            <b>Checkpoint đầu ra:</b> {journey.outputCheckpoint} · Chặng {journey.stage} · revision{' '}
            {journey.revision}
          </p>
          {run.intro && <button onClick={controller.exit}>Quay về bài học</button>}
          {run.intro ? (
            <>
              <h3>Bạn sẽ quan sát</h3>
              <p>{journey.observe}</p>
              <h3>Dữ liệu khởi đầu</h3>
              <p>{journey.initial}</p>
              <h3>Phạm vi đã hỗ trợ</h3>
              <p>{journey.segments.map((s) => s.observation).join(' ')}</p>
            </>
          ) : (
            <p>
              Đang ở đoạn {journey.segments.indexOf(segment!) + 1}/{journey.segments.length}:{' '}
              {segment?.title}. Mở source sẽ tạm dừng; iframe, vị trí và dữ liệu phiên được giữ.
            </p>
          )}
          {summary && (
            <>
              <h3>Kết quả quan sát được</h3>
              <p>{journey.summary}</p>
              <ul>
                {journey.segments.map((s) => {
                  const records = run.records.filter(
                    (r) => r.kind === 'ui' && s.taskIds.includes(run.plan.tasks[r.step]?.id),
                  )
                  return (
                    <li key={s.id}>
                      <b>{s.title}:</b>{' '}
                      {records.length
                        ? records.map((r) => `${r.title}: ${r.detail.slice(0, 280)}`).join(' · ')
                        : 'Chưa có bằng chứng UI'}
                    </li>
                  )
                })}
              </ul>
              <button onClick={controller.retryGuided}>Tự thử lại từ đầu</button>
              <button onClick={controller.exit}>Quay về bài học</button>
            </>
          )}
          <ol aria-label="Các đoạn hành trình">
            {journey.segments.map((s) => (
              <li key={s.id} aria-current={s.id === segment?.id ? 'step' : undefined}>
                <b>{s.title}</b>
                <p>{s.observation}</p>
                {s.flow && !run.intro && (
                  <button
                    onClick={() => {
                      dialog.current?.close()
                      controller.flow(s.flow!)
                    }}
                  >
                    Xem flow · {s.flow} · {run.plan.checkpoint.id}
                  </button>
                )}
                <p>Được xây tại…</p>
                {s.builtAt.map((link, i) => {
                  const range = findSymbol(link.checkpoint, link.file, link.symbol)
                  return (
                    <button
                      key={i}
                      aria-label={`Xem cách xây: ${link.title}`}
                      onClick={() => {
                        dialog.current?.close()
                        if (run.intro) controller.begin()
                        controller.inspect(link)
                      }}
                    >
                      {link.title}
                      <small>
                        {link.foundation ? 'Nền tảng từ source; không có event runtime. ' : ''}
                        {link.checkpoint} · {link.file} · {link.symbol} · {range?.start}–
                        {range?.end}
                      </small>
                    </button>
                  )
                })}
              </li>
            ))}
          </ol>
          <p>
            DOM/MSW và diễn giải source được phân biệt trong lịch sử. Xem cách xây hoặc đọc lịch sử
            không replay thao tác và không gửi request nghiệp vụ.
          </p>
        </dialog>,
        document.body,
      )}
    </>
  )
}

/** Separate reading context: never navigate the lesson or remount the run iframe. */
export function RunConstruction({ controller }: { controller: RunController }) {
  const run = controller.session!,
    link = run.peek!,
    journey = run.plan.journey!
  const op = learningOperation(journey.stage, link)
  const [selection, setSelection] = useState<Selection>(() => ({
    ...selectionAt(0),
    step: link.step,
    sub: link.sub,
    file: link.file,
    symbol: link.symbol,
    side: 'after',
    section: '',
    position: 0,
  }))
  const [notice, setNotice] = useState('')
  const checkpoint = selection.side === 'before' ? op.before : op.after
  return (
    <section
      className={styles.construction}
      aria-label="Xem cách xây"
      data-checkpoint={checkpoint.id}
    >
      <header>
        <button onClick={controller.returnToRun}>Trở lại phiên chạy cả bước</button>
        <strong>{link.title}</strong>
      </header>
      <p className={styles.comparisonNotice}>
        Source {checkpoint.id} ↔ Phiên {run.plan.checkpoint.id}. Chỉ đối chiếu source; preview giữ
        nguyên checkpoint phiên.
      </p>
      <details open={window.innerWidth >= 1051}>
        <summary>
          Được xây tại sub-step {link.step}.{link.sub + 1}
        </summary>
        <p>{op.intention}</p>
        <p>{op.input}</p>
        <p>
          {link.foundation
            ? 'Đây là nền tảng từ source, không dựng sự kiện runtime cho type/contract. '
            : ''}
          Đối chiếu source {checkpoint.id} với checkpoint phiên {run.plan.checkpoint.id}. Preview
          vẫn là phiên riêng tại {run.plan.checkpoint.id}; không đổi checkpoint khi đọc.
        </p>
      </details>
      <label>
        File ở mốc đang đối chiếu
        <select
          aria-label="File cách xây"
          value={selection.file}
          onChange={(e) =>
            setSelection((s) => ({
              ...s,
              file: e.target.value,
              symbol: '',
              section: '',
              position: 0,
            }))
          }
        >
          {op.after.files.map((f) => (
            <option key={f.path}>{f.path}</option>
          ))}
        </select>
      </label>
      {notice && <p role="status">{notice}</p>}
      <PreviewGuideProvider mode="comparison" onReveal={() => undefined}>
        <SourcePanel
          catalog={journey.stage === 1 ? checkpoints : revisionCheckpoints}
          checkpoint={checkpoint}
          operation={op}
          selection={selection}
          label="Source cách xây"
          onChange={(patch) => setSelection((s) => ({ ...s, ...patch }))}
          onCheckpoint={(id) =>
            setNotice(
              `Mốc ${id}: chọn sub-step tương ứng trong Hành trình cả bước để mở ngữ cảnh riêng; phiên vẫn ở ${run.plan.checkpoint.id}.`,
            )
          }
        />
      </PreviewGuideProvider>
    </section>
  )
}
