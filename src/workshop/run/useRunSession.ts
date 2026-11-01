import { useEffect, useRef, useState } from 'react'
import type { LearningLink, RunMode, RunPlan, RunRecord } from './model'
import { RunDriver, waitFor } from './driver'

export interface RunSession {
  selectedFlow: string; intro: boolean; peek: LearningLink | null; id: string; plan: RunPlan; mode: RunMode; status: 'loading' | 'running' | 'paused' | 'waiting' | 'failed' | 'done'
  index: number; stage: string; error: string; records: RunRecord[]; readId: string; live: boolean
  follow: 'ui' | 'code'; following: boolean; pane: 'flow' | 'code'; speed: number
}
interface Engine { ready: boolean; blocked: boolean; id: string; controller: AbortController; playing: boolean; permit: boolean; index: number; pumping: boolean; failed: boolean; driver?: RunDriver; follow: 'ui' | 'code'; following: boolean; speed: number }
export function useRunSession(context?: { capture: () => void; restore: () => void }) {
  const [session, setSession] = useState<RunSession | null>(null)
  const current = useRef<RunSession | null>(null), engine = useRef<Engine | null>(null)
  current.current = session
  const opener = useRef<HTMLElement | null>(null)
  function patch(id: string, value: Partial<RunSession>) { setSession(old => old?.id === id ? { ...old, ...value } : old) }
  function stop() { engine.current?.controller.abort(); engine.current?.driver?.dispose(); engine.current = null }
  useEffect(() => () => stop(), [])
  function start(plan: RunPlan, mode: RunMode, restarting = false) {
    if (!plan.supported) return
    if (!restarting) { opener.current = document.activeElement as HTMLElement; context?.capture() }
    stop()
    const id = crypto.randomUUID()
    engine.current = { ready: false, blocked: Boolean(plan.journey), id, controller: new AbortController(), playing: true, permit: false, index: 0, pumping: false, failed: false, follow: 'ui', following: true, speed: 1 }
    setSession({ selectedFlow: '', intro: Boolean(plan.journey), peek: null, id, plan, mode, status: 'loading', index: 0, stage: `Mở phiên dữ liệu riêng · mốc ${plan.checkpoint.id}`, error: '', records: [], readId: '', live: true, follow: 'ui', following: true, pane: 'code', speed: 1 })
  }
  async function pump(e: Engine, run: RunSession) {
    if (e.pumping || !e.driver || !e.ready) return
    e.pumping = true
    const active = () => engine.current === e && !e.controller.signal.aborted
    try {
      while (active() && e.index < run.plan.tasks.length) {
        await waitFor(() => !e.blocked && (e.playing || e.permit) ? true : undefined, e.controller.signal, Infinity)
        const task = run.plan.tasks[e.index]
        patch(e.id, { selectedFlow: '', index: e.index, status: task.manual || run.mode === 'guided' ? 'waiting' : 'running', error: '' })
        const retryObserve = e.failed
        e.failed = false
        await e.driver.execute(task, run.mode, retryObserve)
        e.permit = false
        e.index++
        patch(e.id, e.index === run.plan.tasks.length ? { status: 'done', stage: 'Đã quan sát đủ điều kiện của kịch bản · không tăng tiến độ' } : { index: e.index, status: e.playing ? 'running' : 'paused', stage: e.playing ? 'Chuẩn bị bước trình diễn tiếp' : 'Tạm dừng trước thao tác tiếp theo' })
      }
    } catch (error) {
      if (active()) {
        e.failed = true; e.playing = false; e.permit = false
        const detail = error instanceof Error ? error.message : 'Không xác nhận được kết quả.'
        const observed = e.driver?.diagnostic() ?? 'Chưa có iframe sẵn sàng.'
        setSession(old => old?.id === e.id ? { ...old, status: 'failed', error: `${detail} Không tự gửi lại thao tác.`, stage: 'Dừng tại điều kiện chưa đạt', records: [...old.records, { id: `${e.id}:${old.records.length + 1}`, session: e.id, order: old.records.length + 1, at: Date.now(), step: e.index, action: run.plan.tasks[e.index]?.title ?? 'Mở preview', kind: 'diagnostic', title: 'Chưa xác nhận đạt', detail: observed, sources: run.plan.tasks[e.index]?.sources ?? [], ui: run.plan.tasks[e.index]?.target ?? 'root', explanation: 'Đây là trạng thái quan sát được, không phải bằng chứng hoàn thành.' }] } : old)
      }
    } finally { e.pumping = false }
  }
  async function attach(frame: HTMLIFrameElement) {
    const e = engine.current, run = current.current
    if (!e || !run || e.id !== run.id || e.driver) return
    const active = () => engine.current === e && !e.controller.signal.aborted
    e.driver = new RunDriver(frame, e.id, run.plan, e.controller.signal, {
      record: value => {
        if (!active()) return
        setSession(old => {
          if (!old || old.id !== e.id) return old
          if (value.path && value.flow === 'save' && run.plan.tasks[e.index]?.kind === 'retry') {
            const previous = old.records.filter(item => item.flow === 'save' && item.path).at(-1)
            if (previous?.path?.at(-1) === 'retry') value = { ...value, path: [...previous.path, ...value.path] }
          }
          const record: RunRecord = { ...value, id: `${e.id}:${old.records.length + 1}`, session: e.id, order: old.records.length + 1, at: Date.now(), step: e.index }
          return { ...old, records: [...old.records, record], readId: old.live ? record.id : old.readId }
        })
      },
      stage: stage => { if (active()) patch(e.id, { stage }) },
      gate: () => waitFor(() => !e.blocked && (e.playing || e.permit) ? true : undefined, e.controller.signal, Infinity).then(() => undefined),
      followUI: () => e.follow === 'ui' && e.following,
      explored: () => { if (e.follow === 'ui') { e.following = false; patch(e.id, { following: false }) } },
      speed: () => e.speed,
    })
    try { await e.driver.ready(); if (active()) { e.ready = true; void pump(e, run) } }
    catch (error) { if (active()) patch(e.id, { status: 'failed', error: error instanceof Error ? error.message : 'Iframe chưa sẵn sàng.', stage: 'Chưa mở được phiên. Chạy lại để thử phiên riêng mới.' }) }
  }
  function play() {
    const e = engine.current, run = current.current
    if (!e || !run || e.blocked || run.status === 'done') return
    e.playing = !e.playing
    patch(e.id, { status: e.playing ? 'running' : 'paused', stage: e.playing ? 'Tiếp tục phiên' : 'Tạm dừng trước thao tác kế tiếp; request đã gửi vẫn hoàn tất.' })
    if (e.playing) void pump(e, run)
  }
  function step() {
    const e = engine.current, run = current.current
    if (!e || !run || e.blocked || ['loading','done'].includes(run.status)) return
    e.playing = false; e.permit = true
    patch(e.id, { status: 'running', stage: e.failed ? 'Quan sát tiếp bước lỗi; không tự gửi lại. Có thể tự thao tác hoặc Chạy lại phiên.' : 'Chạy một bước trình diễn' })
    void pump(e, run)
  }
  function exit() {
    stop(); setSession(null); context?.restore()
    const url = new URL(location.href); url.searchParams.delete('run'); url.searchParams.delete('runMode'); url.searchParams.delete('runScope'); url.searchParams.delete('runVariant')
    history.replaceState(history.state, '', url.pathname + url.search + url.hash)
    requestAnimationFrame(() => { if (opener.current?.isConnected && opener.current.tagName !== 'BODY' && opener.current.getClientRects().length) opener.current.focus(); else document.getElementById('workspace-title')?.focus() })
  }
  function follow(value: 'ui' | 'code') { const e = engine.current; if (e) { e.follow = value; e.following = true; patch(e.id, { follow: value, following: true }) } }
  function resumeFollow() { const e = engine.current; if (e) { e.following = true; patch(e.id, { following: true }); const run = current.current, item = run?.records.find(item => item.id === run.readId); if (e.follow === 'ui' && item) e.driver?.highlight(item.ui, `Đã quan sát: ${item.title}`, true) } }
  function exploreCode() { const e = engine.current; if (e?.follow === 'code') { e.following = false; patch(e.id, { following: false }) } }
  function exploreUI() { const e = engine.current; if (e?.follow === 'ui') { e.following = false; patch(e.id, { following: false }) } }
  function read(id: string) { const run = current.current; if (run) patch(run.id, { readId: id, live: false }) }
  function live() { const run = current.current; if (run) patch(run.id, { live: true, readId: run.records.at(-1)?.id ?? '' }) }
  function begin() { const e = engine.current; if (e) { e.blocked = false; patch(e.id, { intro: false }); } }
  function inspect(link: LearningLink) { const e = engine.current; if (e) { e.playing = false; e.permit = false; e.blocked = true; patch(e.id, { peek: link, status: current.current?.status === 'done' ? 'done' : 'paused', stage: 'Xem cách xây; không phát thao tác tiếp theo.' }) } }
  function returnToRun() { const e = engine.current; if (e) { e.blocked = false; patch(e.id, { peek: null, stage: 'Đã trở lại phiên; bấm Chạy hoặc Tiếp bước để tiếp tục.' }) } }
  function flow(id: string) { const e = engine.current; if (e) { e.playing = false; e.permit = false; patch(e.id, { selectedFlow: id, pane: 'flow', status: current.current?.status === 'done' ? 'done' : 'paused', stage: 'Đọc flow tại checkpoint phiên; không phát thao tác mới.' }) } }
  return { session, flow, begin, inspect, returnToRun, start, attach, play, step, exit, follow, resumeFollow, exploreCode, exploreUI, read, live,
    retryGuided: () => { const run = current.current; if (run) start(run.plan, 'guided', true) },
    restart: () => { const run = current.current; if (run) start(run.plan, run.mode, true) },
    pane: (pane: 'flow' | 'code') => { const run = current.current; if (run) patch(run.id, { pane }) },
    speed: (speed: number) => { const e = engine.current; if (e) { e.speed = speed; patch(e.id, { speed }) } },
  }
}
export type RunController = ReturnType<typeof useRunSession>
