import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

// Normalize the private key: dotenv keeps quoted values as-is, so literal
// \n sequences survive. Replace them with real newlines before passing to cert().
function getPrivateKey(): string {
  const raw = process.env.FIREBASE_PRIVATE_KEY ?? ""
  // Strip surrounding quotes that some .env editors add
  const unquoted = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  // Convert literal \n to real newlines
  return unquoted.replace(/\\n/g, "\n")
}

function getAdminAuth(): Auth {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = getPrivateKey()

    if (!projectId || !clientEmail || !privateKey) {
      console.error(
        "[firebase-admin] Missing credentials! Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in environment variables."
      )
      throw new Error(
        "Firebase Admin credentials are not set in environment variables."
      )
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }
  return getAuth()
}

export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const adminAuth = getAdminAuth()
    const value = (adminAuth as any)[prop]
    return typeof value === "function" ? value.bind(adminAuth) : value
  },
})
