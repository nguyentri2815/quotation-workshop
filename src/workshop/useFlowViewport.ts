import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Node, ReactFlowInstance, Viewport } from '@xyflow/react'
import type { RuntimeEvent } from './runtime-flows'

type SavedView = { viewport: Viewport; following: boolean }
const views = new Map<string, SavedView>()
const storageKey = 'quotation-workshop.flow-view.v1:'
function restore(id: string): SavedView | undefined {
  if (views.has(id)) return views.get(id)
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey + id) ?? 'null')
    if (value && [value.viewport?.x, value.viewport?.y, value.viewport?.zoom].every(Number.isFinite) && value.viewport.zoom >= .15 && value.viewport.zoom <= 1.5 && typeof value.following === 'boolean') {
      views.set(id, value)
      return value
    }
  } catch { /* A blocked session store still permits an in-memory viewport. */ }
}

export function useFlowViewport<T extends Node>(flow: string, event: RuntimeEvent, canvas: RefObject<HTMLDivElement | null>, active: boolean) {
  const saved = useMemo(() => restore(flow), [flow])
  const instance = useRef<ReactFlowInstance<T> | null>(null)
  const [following, setFollowing] = useState(saved?.following ?? true)
  const follows = useRef(following)
  const current = useRef({ flow, event, active })
  const previousEvent = useRef({ flow, event: event.id })
  current.current = { flow, event, active }
  function remember(viewport = instance.current?.getViewport()) {
    if (!viewport) return
    const value = { viewport, following: follows.current }
    views.set(flow, value)
    try { sessionStorage.setItem(storageKey + flow, JSON.stringify(value)) } catch { /* Optional persistence. */ }
  }
  function pause() {
    follows.current = false
    setFollowing(false)
    remember()
  }
  function reveal(center = false) {
    const view = instance.current, host = canvas.current
    if (!view || !host || !host.clientWidth || !host.clientHeight) return
    const target = current.current.event
    const viewport = view.getViewport()
    const zoom = Math.min(1.1, Math.max(.65, viewport.zoom))
    const left = target.x * 320 * zoom + viewport.x, top = target.y * 190 * zoom + viewport.y
    const width = 220 * zoom, height = 112 * zoom
    const margin = Math.min(24, host.clientWidth / 10), ceiling = 72
    let x = viewport.x, y = viewport.y
    if (center || zoom !== viewport.zoom || width > host.clientWidth - margin * 2) x = host.clientWidth / 2 - (target.x * 320 + 110) * zoom
    else if (left < margin) x += margin - left
    else if (left + width > host.clientWidth - margin) x -= left + width - host.clientWidth + margin
    if (center || zoom !== viewport.zoom || height > host.clientHeight - ceiling - margin) y = (host.clientHeight + ceiling) / 2 - (target.y * 190 + 56) * zoom
    else if (top < ceiling) y += ceiling - top
    else if (top + height > host.clientHeight - margin) y -= top + height - host.clientHeight + margin
    if (x !== viewport.x || y !== viewport.y || zoom !== viewport.zoom) void view.setViewport({ x, y, zoom }, { duration: 0 }).then(() => remember(view.getViewport()))
  }
  useEffect(() => {
    follows.current = saved?.following ?? true
    setFollowing(follows.current)
  }, [flow, saved])
  useEffect(() => {
    // Only a changed event follows. Resize/fullscreen/tab visibility never claims the viewport.
    const previous = previousEvent.current
    previousEvent.current = { flow, event: event.id }
    if (active && follows.current && previous.flow === flow && previous.event !== event.id) reveal()
  }, [flow, event.id])
  return {
    instance,
    following,
    defaultViewport: saved?.viewport ?? { x: 0, y: 0, zoom: .85 },
    onInit(view: ReactFlowInstance<T>) {
      instance.current = view
      if (!saved) requestAnimationFrame(() => { if (current.current.flow === flow) { reveal(true); remember() } })
    },
    onMoveStart(input: unknown) { if (input) pause() },
    onMoveEnd(_: unknown, viewport: Viewport) { remember(viewport) },
    pause,
    reveal: () => reveal(),
    toggleFollow() {
      follows.current = !follows.current
      setFollowing(follows.current)
      if (follows.current) reveal()
      remember()
    },
    fit() { pause(); void instance.current?.fitView({ padding: .15, duration: 0 }).then(() => remember()) },
  }
}
