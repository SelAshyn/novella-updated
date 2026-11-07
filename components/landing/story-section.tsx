"use client"

import { useLayoutEffect, useRef } from "react"
import type { CSSProperties, ReactNode } from "react"

type Props = {
  as?: "section" | "footer"
  id?: string
  className?: string
  stageClassName?: string
  /** Kept for API compatibility but unused in snap-scroll mode */
  length?: number
  children: ReactNode
}

/**
 * StorySection – in snap-scroll mode this is simply a full-viewport section
 * that fits its content via CSS zoom so it always looks spacious regardless
 * of screen size.  The `length` prop is preserved for compatibility but has
 * no effect when the page uses snap-scroll.
 */
export default function StorySection({
  as: Tag = "section",
  id,
  className = "",
  stageClassName = "",
  length: _length,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const stage = el.querySelector<HTMLElement>(".story-stage")
    const inner = stage?.firstElementChild as HTMLElement | null

    function fit() {
      if (!stage || !inner) return
      inner.style.zoom = "1"
      const cs = getComputedStyle(stage)
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      const scale = Math.min(1, (stage.clientHeight - pad) / inner.offsetHeight)
      inner.style.zoom = String(Math.max(0.6, scale))
    }

    fit()
    document.fonts?.ready.then(fit)
    window.addEventListener("resize", fit, { passive: true })
    return () => window.removeEventListener("resize", fit)
  }, [])

  return (
    <Tag ref={ref as React.Ref<never>} id={id} className={`story-section ${className}`}>
      <div className={`story-stage ${stageClassName}`}>{children}</div>
    </Tag>
  )
}
