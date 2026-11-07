"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { ArrowRight, BookOpen, Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/landing/theme-toggle"

const NAV_LINKS: [string, string, string][] = [
  ["#hero",         "hero",         "Home"],
  ["#how-it-works", "how-it-works", "How it works"],
  ["#features",     "features",     "Features"],
  ["#built-for",    "built-for",    "Who it's for"],
  ["#for-schools",  "for-schools",  "Schools"],
]

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
  const [isVisible, setIsVisible]   = useState(true)
  const [activeNav, setActiveNav]   = useState("hero")
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const stateRef = useRef({
    lastY:        0,
    pointerY:     0,
    isAnimating:  false,
    hideTimer:    null as ReturnType<typeof setTimeout> | null,
    currentRawId: "hero",
  })

  const getContainer = useCallback((): HTMLElement | null => document.getElementById("top"), [])

  const scrollToSection = useCallback((targetId: string) => {
    const rawId = targetId === "top" ? "hero" : targetId
    const target = document.getElementById(rawId)
    if (!target) return
    setMobileOpen(false)
    stateRef.current.isAnimating = true
    if (stateRef.current.hideTimer) clearTimeout(stateRef.current.hideTimer)
    setIsVisible(true)
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    const mappedNav = SECTION_TO_NAV[rawId] || rawId
    setActiveNav(mappedNav)
    stateRef.current.currentRawId = rawId
    if (rawId === "hero") {
      history.replaceState(null, "", window.location.pathname)
    } else {
      history.replaceState(null, "", `#${rawId}`)
    }
    stateRef.current.hideTimer = setTimeout(() => { stateRef.current.isAnimating = false }, 850)
  }, [])

  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, "")
    if (rawHash) {
      const targetId = rawHash === "top" ? "hero" : rawHash
      const timer = setTimeout(() => scrollToSection(targetId), 150)
      return () => clearTimeout(timer)
    }
  }, [scrollToSection])

  useEffect(() => {
    const container = getContainer()
    if (!container) return
    const state = stateRef.current

    function detectActiveSection() {
      const sections = Array.from(container!.querySelectorAll<HTMLElement>(":scope > section[id], :scope > footer[id]"))
      if (sections.length === 0) return
      let closestIdx = 0; let minDistance = Infinity
      for (let i = 0; i < sections.length; i++) {
        const dist = Math.abs(sections[i].getBoundingClientRect().top)
        if (dist < minDistance) { minDistance = dist; closestIdx = i }
      }
      const rawId = sections[closestIdx].id
      if (rawId && rawId !== state.currentRawId) {
        state.currentRawId = rawId
        setActiveNav(SECTION_TO_NAV[rawId] || rawId)
        if (!state.isAnimating) {
          rawId === "hero"
            ? history.replaceState(null, "", window.location.pathname)
            : history.replaceState(null, "", `#${rawId}`)
        }
      }
    }

    function onScroll() {
      const scrollY = container!.scrollTop
      setScrolled(scrollY > 20)
      if (!state.isAnimating) {
        setIsVisible(!(scrollY > state.lastY && scrollY > 100 && state.pointerY > 100))
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
    detectActiveSection()

    return () => {
      container.removeEventListener("scroll", onScroll)
      document.removeEventListener("pointermove", onPointerMove)
      if (state.hideTimer) clearTimeout(state.hideTimer)
    }
  }, [getContainer])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [mobileOpen])

  return (
    <>
      <header className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border/80 bg-background/85 backdrop-blur-xl shadow-xs py-3" : "border-b border-transparent bg-background/50 backdrop-blur-md py-4"
      } ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}>
        <div className="mx-auto flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Brand */}
          <div className="min-w-0 shrink-0">
            <a href="#hero" onClick={(e) => { e.preventDefault(); scrollToSection("hero") }}
              className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <BookOpen className="size-4.5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-foreground leading-none">Novella</span>
                <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">Reading notebook</span>
              </div>
            </a>
          </div>

          {/* Desktop nav */}
          <nav aria-label="Primary navigation" className="hidden min-w-0 md:block">
            <ul className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 p-1.5 backdrop-blur-md shadow-inner">
              {NAV_LINKS.map(([href, navKey, label]) => {
                const isActive = activeNav === navKey
                return (
                  <li key={href}>
                    <a href={href} onClick={(e) => { e.preventDefault(); scrollToSection(navKey) }}
                      aria-current={isActive ? "location" : undefined}
                      className={`block rounded-full px-4 py-1.5 font-sans text-xs font-medium tracking-wide transition-all duration-200 ${
                        isActive ? "bg-card text-foreground dark:bg-white dark:text-black shadow-xs font-semibold ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                      }`}>
                      {label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Right: theme + CTA + hamburger */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <a href="/auth#create" className="site-button site-button-primary group hidden sm:inline-flex">
              <span>Get started free</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <button onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-foreground transition-colors hover:bg-secondary md:hidden">
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile drawer */}
      <div role="dialog" aria-modal="true" aria-label="Mobile navigation"
        className={`fixed top-0 right-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-background border-l border-border shadow-2xl transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}>
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <span className="font-serif text-xl font-bold text-foreground">Menu</span>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {NAV_LINKS.map(([href, navKey, label]) => {
            const isActive = activeNav === navKey
            return (
              <a key={href} href={href} onClick={(e) => { e.preventDefault(); scrollToSection(navKey) }}
                aria-current={isActive ? "location" : undefined}
                className={`flex items-center rounded-xl px-4 py-3 font-sans text-sm font-medium transition-all ${
                  isActive ? "bg-card text-foreground font-semibold border border-border/80 shadow-xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                {label}
              </a>
            )
          })}
        </nav>

        <div className="border-t border-border/60 p-4">
          <a href="/auth#create" onClick={() => setMobileOpen(false)}
            className="site-button site-button-primary group w-full justify-center">
            <span>Get started free</span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
          <a href="/auth" onClick={() => setMobileOpen(false)}
            className="mt-2 block text-center font-sans text-xs text-muted-foreground hover:text-foreground py-2">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </>
  )
}
