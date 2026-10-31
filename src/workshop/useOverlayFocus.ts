import { useEffect } from 'react'
import type { RefObject } from 'react'

// Fixed workspaces keep their React tree mounted, including the graph viewport.
export function useOverlayFocus(open: boolean, host: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open || !host.current) return
    const previous = document.activeElement as HTMLElement | null
    const root = host.current
    const visible = (el: HTMLElement) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    const controls = () => [...root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]')].filter(el => !el.hasAttribute('disabled') && visible(el))
    ;(root.querySelector<HTMLElement>('[data-overlay-close]') ?? controls()[0] ?? root).focus({ preventScroll: true })
    function keydown(event: KeyboardEvent) {
      if (root.querySelector('dialog[open]')) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
      if (event.key !== 'Tab') return
      const items = controls(), first = items[0], last = items.at(-1)
      if (!first || !last) return
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    root.addEventListener('keydown', keydown)
    return () => {
      root.removeEventListener('keydown', keydown)
      if (previous?.isConnected && visible(previous)) previous.focus({ preventScroll: true })
      else root.querySelector<HTMLElement>('nav button:not([disabled])')?.focus({ preventScroll: true })
    }
  }, [open, host])
}
