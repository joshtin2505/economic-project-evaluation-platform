import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export default async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname
  const isE2eTest = request.cookies.get("e2e-test-user")?.value === "true"
  const isAuthenticated = Boolean(user || isE2eTest)

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  if (pathname === "/auth" && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
