"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

const emptySubscribe = () => () => {}

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useIsMounted()

  if (!mounted) {
    return <div className={`size-10 ${className}`} />
  }

  const isDark = resolvedTheme === "dark"

  function toggleTheme(event: React.MouseEvent<HTMLButtonElement>) {
    const nextTheme = isDark ? "light" : "dark"

    // Check if the circular View Transitions API is supported
    const isAppearanceTransition =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!isAppearanceTransition) {
      setTheme(nextTheme)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const doc = document as unknown as {
      startViewTransition: (callback: () => void) => {
        ready: Promise<void>
      }
    }

    const transition = doc.startViewTransition(() => {
      setTheme(nextTheme)
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 1800,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={toggleTheme}
      className={`relative flex size-10 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground transition-all duration-200 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden cursor-pointer ${className}`}
    >
      {/* Sun icon for light mode (spins away in dark mode) */}
      <Sun className="size-4.5 text-amber-500 transition-all duration-500 transform rotate-0 scale-100 opacity-100 dark:-rotate-90 dark:scale-0 dark:opacity-0" />

      {/* Moon icon for dark mode (spins into view in dark mode) */}
      <Moon className="absolute size-4.5 text-stone-600 dark:text-stone-300 transition-all duration-500 transform rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100" />
    </button>
  )
}

