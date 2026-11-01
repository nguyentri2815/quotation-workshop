import { RunScopePicker } from './run/RunScopePicker'
import { useState } from 'react'
import {
  Play,
  Lightbulb,
  BookOpen,
  CheckCheck,
  MessageSquare,
} from 'lucide-react'
import type { Operation } from './operations'
import { lessons } from './steps'
import styles from './workshop.module.css'
import { defaultScenario, runPlan, scenarioIds, scenarioNames } from './run/model'
import type { RunPlan, RunMode, Scenario } from './run/model'
import type { Checkpoint } from './catalog'

export function OperationCheck({
  operation,
  checked,
  note,
  onNote,
  onCheck,
  onTry,
  onAnswer,
  checkpoint,
  onRun,
}: {
  operation: Operation
  checked: boolean
  note: string
  onNote: (value: string) => void
  onCheck: () => void
  onTry: (mode: 'sample' | 'mine') => void
  onAnswer: () => void
  checkpoint: Checkpoint
  onRun: (plan: RunPlan, mode: RunMode) => void
}) {
  const [hint, setHint] = useState(0)
  const [answer, setAnswer] = useState(false)
  const lesson = lessons[operation.step]
  const [scenario, setScenario] = useState<Scenario>(() => defaultScenario(operation.step, checkpoint))
  const plan = runPlan(checkpoint, scenario)
  return (
    <section className={styles.operationCheck} aria-label="Chạy thử bước này">
      <div className={styles.checkHeading}>
        <h3>
          <Play aria-hidden />
          Chạy thử bước này
        </h3>
        <div className={styles.actions}>
          <button onClick={() => onTry('sample')}>Chỉ mở preview mẫu</button>
          <button onClick={() => onTry('mine')}>Thử bài tôi đang làm</button>
        </div>
      </div>
      <RunScopePicker stage={1} step={operation.step} current={plan} onRun={onRun}>
        <label>Kịch bản tại mốc {checkpoint.id}<select aria-label="Kịch bản chạy thử" value={scenario} onChange={event => setScenario(event.target.value as Scenario)}>{scenarioIds.map(id => <option key={id} value={id}>{scenarioNames[id]}</option>)}</select></label>
      </RunScopePicker>
      <dl className={styles.checkGrid}>
        <div>
          <dt>Dữ liệu nhập</dt>
          <dd>{operation.input}</dd>
        </div>
        <div>
          <dt>Hành động</dt>
          <dd>{operation.run}</dd>
        </div>
        <div>
          <dt>Kết quả mong đợi</dt>
          <dd>{operation.expected}</dd>
        </div>
        <div>
          <dt>Dấu hiệu sai · kiểm tra ở đâu</dt>
          <dd>{lesson.troubleshooting.join(' ')}</dd>
        </div>
      </dl>
      <div className={styles.helpActions}>
        <button
          onClick={() => setHint(Math.min(2, hint + 1))}
          disabled={hint === 2}
        >
          <Lightbulb aria-hidden />
          {hint === 0
            ? 'Gợi ý cấp 1'
            : hint === 1
              ? 'Gợi ý cấp 2'
              : 'Đã mở hai cấp'}
        </button>
        <button aria-expanded={answer} onClick={() => setAnswer(!answer)}>
          <BookOpen aria-hidden />
          Lời giải
        </button>
        <button
          className={checked ? styles.checkedButton : ''}
          onClick={onCheck}
        >
          <CheckCheck aria-hidden />
          {checked ? 'Đã tự kiểm tra cả bước' : 'Tự xác nhận cả bước'}
        </button>
      </div>
      {hint > 0 && (
        <div className={styles.hint}>
          <strong>Hướng suy nghĩ</strong>
          <p>{operation.prerequisite}</p>
          {hint > 1 && (
            <>
              <strong>Gợi ý nối các phần</strong>
              <p>{operation.intention}</p>
            </>
          )}
        </div>
      )}
      {answer && (
        <div className={styles.hint}>
          <strong>Lời giải tham chiếu</strong>
          <p>{operation.expected}</p>
          <button onClick={onAnswer}>Xem nhóm code của thao tác</button>
        </div>
      )}
      <details className={styles.reflection}>
        <summary>
          <MessageSquare aria-hidden />
          Giải thích, ghi chú & phạm vi kiểm tra
        </summary>
        <p>{lesson.explanation}</p>
        <label htmlFor="reflection">{lesson.question}</label>
        <textarea
          id="reflection"
          value={note}
          onChange={(event) => onNote(event.target.value)}
          rows={3}
        />
        <p>
          Xem mẫu không chứng minh bài của bạn đúng. Tự xác nhận chỉ lưu dấu của
          người học; phiên chạy mẫu không chấm source bài của bạn.
        </p>
        <p>
          Trình tự xây được tái dựng từ phiên bản sản phẩm đã đạt, không phải
          lịch sử commit được xác minh. {lesson.forbidden}
        </p>
        {operation.step === 0 && (
          <a
            href="/reference.html#/quotations"
            target="_blank"
            rel="noreferrer"
          >
            Mở bản hoàn chỉnh tham chiếu riêng
          </a>
        )}
      </details>
    </section>
  )
}
