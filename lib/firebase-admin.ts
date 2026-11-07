import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

// Normalize the private key: dotenv keeps quoted values as-is, so literal
// \n sequences survive. Replace them with real newlines before passing to cert().
function getPrivateKey(): string {
  const raw = process.env.FIREBASE_PRIVATE_KEY ?? ""
  // Strip surrounding quotes that some .env editors add
  const unquoted = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  // Convert literal \n to real newlines
  return unquoted.replace(/\\n/g, "\n")
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  })
}

export const auth = getAuth()
