"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { ArrowRight, BookOpen } from "lucide-react"
import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/landing/theme-toggle"

// Primary navigation links: [href, navKey, label]
const NAV_LINKS: [string, string, string][] = [
  ["#hero",         "hero",         "Home"],
  ["#how-it-works", "how-it-works", "How it works"],
  ["#features",     "features",     "Features"],
  ["#built-for",    "built-for",    "Who it's for"],
  ["#for-schools",  "for-schools",  "Schools"],
]

// Maps intermediate sub-sections to their corresponding nav item
const SECTION_TO_NAV: Record<string, string> = {
  hero:           "hero",
  "how-it-works": "how-it-works",
  "the-loop":     "how-it-works",
  features:       "features",
  "built-for":    "built-for",
  comparison:     "built-for",
  "for-schools":  "for-schools",
}

export default function Navbar() {
  const pathname = usePathname()
  if (pathname === "/auth") return null
  return <NavbarContent />
}

function NavbarContent() {
  const [isVisible, setIsVisible]         = useState(true)
  const [activeNav, setActiveNav]         = useState("hero")
  const [scrolled, setScrolled]           = useState(false)

  const stateRef = useRef({
    lastY:       0,
    pointerY:    0,
    isAnimating: false,
    hideTimer:   null as ReturnType<typeof setTimeout> | null,
    currentRawId: "hero",
  })

  const getContainer = useCallback(
    (): HTMLElement | null => document.getElementById("top"),
    []
  )

  /** Smoothly scroll to a section and keep the URL hash in sync */
  const scrollToSection = useCallback((targetId: string) => {
    const rawId = targetId === "top" ? "hero" : targetId
    const target = document.getElementById(rawId)

    if (!target) return

    stateRef.current.isAnimating = true
    if (stateRef.current.hideTimer) clearTimeout(stateRef.current.hideTimer)
    setIsVisible(true)

    // Smooth scroll directly to the element within the snap container
    target.scrollIntoView({ behavior: "smooth", block: "start" })

    const mappedNav = SECTION_TO_NAV[rawId] || rawId
    setActiveNav(mappedNav)
    stateRef.current.currentRawId = rawId

    // Update URL hash without causing an un-smooth page jump
    if (rawId === "hero") {
      history.replaceState(null, "", window.location.pathname)
    } else {
      history.replaceState(null, "", `#${rawId}`)
    }

    stateRef.current.hideTimer = setTimeout(() => {
      stateRef.current.isAnimating = false
    }, 850)
  }, [])

  /** On load: handle initial URL hash */
  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, "")
    if (rawHash) {
      const targetId = rawHash === "top" ? "hero" : rawHash
      const timer = setTimeout(() => {
        scrollToSection(targetId)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [scrollToSection])

  /** Track scrolling inside #top container to update active indicator & URL hash */
  useEffect(() => {
    const container = getContainer()
    if (!container) return

    const state = stateRef.current

    function detectActiveSection() {
      const sections = Array.from(
        container!.querySelectorAll<HTMLElement>(":scope > section[id], :scope > footer[id]")
      )
      if (sections.length === 0) return

      // Find section closest to the top of the viewport
      let closestIdx = 0
      let minDistance = Infinity

      for (let i = 0; i < sections.length; i++) {
        const top = sections[i].getBoundingClientRect().top
        const dist = Math.abs(top)
        if (dist < minDistance) {
          minDistance = dist
          closestIdx = i
        }
      }

      const rawId = sections[closestIdx].id
      if (rawId && rawId !== state.currentRawId) {
        state.currentRawId = rawId
        const mappedNav = SECTION_TO_NAV[rawId] || rawId
        setActiveNav(mappedNav)

        // Only update URL hash if user is scrolling manually (not during programmatic click animation)
        if (!state.isAnimating) {
          if (rawId === "hero") {
            history.replaceState(null, "", window.location.pathname)
          } else {
            history.replaceState(null, "", `#${rawId}`)
          }
        }
      }
    }

    function onScroll() {
      const scrollY = container!.scrollTop
      setScrolled(scrollY > 20)

      if (!state.isAnimating) {
        const scrollingDown = scrollY > state.lastY
        const shouldHide = scrollingDown && scrollY > 100 && state.pointerY > 100
        setIsVisible(!shouldHide)
      }
      state.lastY = scrollY

      detectActiveSection()
    }

    function onPointerMove(e: PointerEvent) {
      state.pointerY = e.clientY
      if (e.clientY < 100) setIsVisible(true)
    }

    container.addEventListener("scroll", onScroll, { passive: true })
    document.addEventListener("pointermove", onPointerMove, { passive: true })

    // Initial check
    detectActiveSection()

    return () => {
      container.removeEventListener("scroll", onScroll)
      document.removeEventListener("pointermove", onPointerMove)
      if (state.hideTimer) clearTimeout(state.hideTimer)
    }
  }, [getContainer])

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/80 bg-background/85 backdrop-blur-xl shadow-xs py-3"
          : "border-b border-transparent bg-background/50 backdrop-blur-md py-4"
      } ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <div className="min-w-0 shrink-0">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection("hero")
            }}
            className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-4.5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground leading-none">
                Novella
              </span>
              <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
                Reading notebook
              </span>
            </div>
          </a>
        </div>

        {/* Navigation Links with Active Indicator */}
        <nav aria-label="Primary navigation" className="hidden min-w-0 md:block">
          <ul className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 p-1.5 backdrop-blur-md shadow-inner">
            {NAV_LINKS.map(([href, navKey, label]) => {
              const isActive = activeNav === navKey

              return (
                <li key={href}>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(navKey)
                    }}
                    aria-current={isActive ? "location" : undefined}
                    className={`block rounded-full px-4 py-1.5 font-sans text-xs font-medium tracking-wide transition-all duration-200 ${
                      isActive
                        ? "bg-card text-foreground dark:bg-white dark:text-black shadow-xs font-semibold ring-1 ring-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    }`}
                  >
                    {label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Theme Toggle & CTA */}
        <div className="flex shrink-0 items-center gap-2.5">
          <ThemeToggle />
          <a
            href="/auth#create"
            className="site-button site-button-primary group hidden sm:inline-flex"
          >
            <span>Get started free</span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  )
}
