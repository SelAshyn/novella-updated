'use client'
import { useState, useEffect } from "react"
import { Cookie } from "lucide-react"

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem("cookie-consent", "accepted")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[45] flex flex-col items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-5 shadow-xl sm:flex-row sm:left-auto sm:right-6 sm:w-[440px]">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Cookie className="size-4" />
        </div>
        <p className="font-sans text-xs text-muted-foreground leading-relaxed">
          Novella uses essential cookies to keep you signed in and remember your reading preferences.
        </p>
      </div>
      <button
        onClick={handleAccept}
        className="site-button site-button-primary shrink-0 w-full sm:w-auto text-xs py-2 px-4 min-h-9"
      >
        Accept
      </button>
    </div>
  )
}
