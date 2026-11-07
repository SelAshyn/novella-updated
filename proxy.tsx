import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_HINT, SIGNED_IN_HOME } from "@/lib/routes"

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_HINT)) {
    return NextResponse.redirect(new URL(SIGNED_IN_HOME, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: "/",
}
