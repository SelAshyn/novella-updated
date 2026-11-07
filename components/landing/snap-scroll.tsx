"use client"

import { useEffect, useState, useRef } from "react"

/**
 * SectionSnap – enforces smooth, section-wise snap scrolling on #top
 * and renders a sleek, interactive side progress navigator.
 */

const ANIMATION_MS = 500 // duration for smooth section transition
const DEBOUNCE_MS  = 60  // quiet window after transition before unlocking

const SECTION_ITEMS = [
  { id: "hero", label: "Overview" },
  { id: "how-it-works", label: "The Problem" },
  { id: "the-loop", label: "Retention Loop" },
  { id: "features", label: "Features" },
  { id: "built-for", label: "Built For" },
  { id: "comparison", label: "Comparison" },
  { id: "for-schools", label: "Schools" },
  { id: "questions", label: "FAQ" },
  { id: "final-cta", label: "Get Started" },
]

function isScrollableChild(target: EventTarget | null, dy: number): boolean {
  if (!(target instanceof HTMLElement)) return false
  let el: HTMLElement | null = target
  while (el && el.id !== "top") {
    const overflow = getComputedStyle(el).overflowY
    if (overflow === "auto" || overflow === "scroll" || overflow === "overlay") {
      const canDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1
      const canUp   = el.scrollTop > 1
      if (dy > 0 ? canDown : canUp) return true
    }
    el = el.parentElement
  }
  return false
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  )
}

export default function SectionSnap() {
  const [activeIdx, setActiveIdx] = useState(0)
  const goToRef = useRef<((idx: number) => void) | null>(null)

  useEffect(() => {
    const container = document.getElementById("top") as HTMLElement | null
    if (!container) return

    let locked       = false
    let lockTimer    = 0
    let lastDeltaAbs = 0
    let lastWheelAt  = 0

    function unlock() {
      locked = false
      lastDeltaAbs = 0
    }

    function getSections(): HTMLElement[] {
      return Array.from(
        container!.querySelectorAll<HTMLElement>(":scope > section, :scope > footer")
      )
    }

    function currentIndex(sections: HTMLElement[]): number {
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < sections.length; i++) {
        const top = Math.abs(sections[i].getBoundingClientRect().top)
        if (top < bestDist) {
          bestDist = top
          best = i
        }
      }
      return best
    }

    function goTo(index: number, sections: HTMLElement[] = getSections()) {
      if (index < 0 || index >= sections.length) return
      locked = true
      setActiveIdx(index)

      sections[index].scrollIntoView({ behavior: "smooth", block: "start" })

      sections.forEach((sec, idx) => {
        sec.setAttribute("data-active", idx === index ? "true" : "false")
      })

      window.clearTimeout(lockTimer)
      lockTimer = window.setTimeout(unlock, ANIMATION_MS + DEBOUNCE_MS)
    }

    goToRef.current = (idx: number) => goTo(idx, getSections())

    // Set initial active section & observe scroll position to keep tags in sync
    const initialSections = getSections()
    const initialIdx = currentIndex(initialSections)
    if (initialIdx !== 0) {
      requestAnimationFrame(() => setActiveIdx(initialIdx))
    }
    initialSections.forEach((sec, idx) => {
      sec.setAttribute("data-active", idx === initialIdx ? "true" : "false")
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-active", "true")
            const sections = getSections()
            const foundIdx = sections.indexOf(entry.target as HTMLElement)
            if (foundIdx !== -1) {
              setActiveIdx(foundIdx)
            }
          } else {
            entry.target.setAttribute("data-active", "false")
          }
        })
      },
      {
        root: container,
        threshold: 0.5,
      }
    )

    initialSections.forEach((sec) => observer.observe(sec))

    function handleWheel(e: WheelEvent) {
      if (
        e.defaultPrevented ||
        e.ctrlKey ||
        e.metaKey ||
        isTypingTarget(e.target) ||
        Math.abs(e.deltaY) < 3
      ) {
        return
      }

      const now = performance.now()
      const absNow = Math.abs(e.deltaY)
      const gap = now - lastWheelAt
      lastWheelAt = now

      // Suppress decelerating trackpad momentum while locked
      if (gap < 200 && absNow <= lastDeltaAbs && locked) {
        e.preventDefault()
        lastDeltaAbs = absNow
        return
      }
      lastDeltaAbs = absNow

      if (isScrollableChild(e.target, e.deltaY)) return

      e.preventDefault()

      if (locked) return

      const sections = getSections()
      if (sections.length === 0) return

      const current = currentIndex(sections)
      const next = e.deltaY > 0 ? current + 1 : current - 1
      goTo(next, sections)
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      const sections = getSections()
      if (sections.length === 0) return
      const current = currentIndex(sections)

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault()
        goTo(current + 1, sections)
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault()
        goTo(current - 1, sections)
      }
    }

    let touchStartY = 0
    function handleTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0].clientY
    }

    function handleTouchEnd(e: TouchEvent) {
      if (locked) return
      const dy = touchStartY - e.changedTouches[0].clientY
      if (Math.abs(dy) < 40) return
      const sections = getSections()
      const current = currentIndex(sections)
      goTo(dy > 0 ? current + 1 : current - 1, sections)
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      observer.disconnect()
      goToRef.current = null
      window.clearTimeout(lockTimer)
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-2.5 p-2 rounded-full border border-border/50 bg-background/70 backdrop-blur-md shadow-md transition-all duration-300"
    >
      {SECTION_ITEMS.map((item, idx) => {
        const isActive = activeIdx === idx
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => goToRef.current?.(idx)}
            aria-label={`Jump to ${item.label}`}
            className="group relative flex items-center justify-center p-1 focus:outline-none"
          >
            {/* Tooltip on hover */}
            <span className="pointer-events-none absolute right-8 origin-right rounded-md border border-border/80 bg-popover/95 px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide text-foreground shadow-sm backdrop-blur-xs opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 whitespace-nowrap">
              {item.label}
            </span>

            {/* Glowing Active Indicator / Sleek Dot */}
            <div
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? "h-5 w-1.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                  : "size-1.5 bg-muted-foreground/35 group-hover:bg-foreground/70 group-hover:scale-125"
              }`}
            />
          </button>
        )
      })}
    </nav>
  )
}
