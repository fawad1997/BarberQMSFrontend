import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  // Get the pathname
  const path = req.nextUrl.pathname
  const isShopPath = path.startsWith("/shop")
  const isHomePath = path === "/"

  try {
    // Get token with more explicit options
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production"
    })

    console.log("Middleware triggered for path:", path)
    console.log("Token exists:", !!token)
    console.log("User role:", token?.role)

    // If user is a shop owner and trying to access home page, redirect to dashboard
    if (isHomePath && token && token.role === "SHOP_OWNER") {
      console.log("Redirecting shop owner from home to dashboard")
      return NextResponse.redirect(new URL("/shop/dashboard", req.url))
    }

    // If not a shop owner trying to access shop paths, redirect to home
    if (isShopPath && (!token || token.role !== "SHOP_OWNER")) {
      console.log("Redirecting non-shop owner from shop path to home")
      return NextResponse.redirect(new URL("/", req.url))
    }
  } catch (error) {
    console.error("Middleware error:", error)
  }

  // Allow the request to continue
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
} 