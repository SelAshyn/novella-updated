"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { usePathname } from "next/navigation"

export default function BackToTop() {
  const pathname = usePathname()
  if (pathname !== "/") {
    return null
  }

  return <BackToTopContent />
}

function BackToTopContent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    function updateVisibility() {
      const container = document.getElementById("top")
      if (!container) return

      const sections = Array.from(
        container.querySelectorAll<HTMLElement>(":scope > section[id], :scope > footer[id]")
      )
      if (sections.length === 0) return

      // Find the section whose top is closest to the container's current scroll position
      const scrollTop = container.scrollTop
      let bestIdx  = 0
      let bestDist = Infinity

      for (let i = 0; i < sections.length; i++) {
        const dist = Math.abs(sections[i].offsetTop - container.offsetTop - scrollTop)
        if (dist < bestDist) { bestDist = dist; bestIdx = i }
      }

      setIsVisible(bestIdx >= 1)
    }

    updateVisibility()
    const container = document.getElementById("top") as HTMLElement | null
    if (container) {
      container.addEventListener("scroll", updateVisibility, { passive: true })
    } else {
      document.addEventListener("scroll", updateVisibility, { passive: true, capture: true })
    }
    window.addEventListener("resize", updateVisibility, { passive: true })

    return () => {
      if (container) {
        container.removeEventListener("scroll", updateVisibility)
      } else {
        document.removeEventListener("scroll", updateVisibility, true)
      }
      window.removeEventListener("resize", updateVisibility)
    }
  }, [])

  function handleClick() {
    const container = document.getElementById("top") as HTMLElement | null
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (container) {
      container.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
    } else {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
    }
  }

  return (
    <button
      type="button"
      aria-label="Return to hero section"
      className={`back-to-top group fixed right-5 bottom-5 z-40 flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md text-foreground shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 active:translate-y-0 sm:right-8 sm:bottom-8 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0 invisible"
      }`}
      onClick={handleClick}
    >
    <ArrowUp
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
      size={18}
      strokeWidth={2}
    />
    </button>
  )
}
