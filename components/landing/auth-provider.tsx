"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import posthog from "posthog-js"
import { auth } from "@/lib/firebase"

type AuthState = { user: User | null; loading: boolean }

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })
  const identifiedUserId = useRef<string | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        if (identifiedUserId.current && identifiedUserId.current !== user.uid) {
          posthog.reset()
        }

        if (identifiedUserId.current !== user.uid) {
          posthog.identify(user.uid, {
            ...(user.email ? { email: user.email } : {}),
            ...(user.displayName ? { name: user.displayName } : {}),
          })
          identifiedUserId.current = user.uid
        }
      } else if (identifiedUserId.current) {
        posthog.reset()
        identifiedUserId.current = null
      }

      setState({ user, loading: false })
    })
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function signOutUser() {
  return signOut(auth)
}
