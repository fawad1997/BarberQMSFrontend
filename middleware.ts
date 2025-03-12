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
    
    if (token) {
      // Log token expiry info for debugging
      const tokenExp = token.exp as number | undefined;
      const currentTime = Date.now() / 1000;
      if (tokenExp) {
        console.log("Token expiry time:", new Date(tokenExp * 1000).toISOString());
        console.log("Current time:", new Date(currentTime * 1000).toISOString());
        console.log("Token expired:", currentTime >= tokenExp);
      } else {
        console.log("Token has no expiration");
      }
    }

    // If user is a shop owner and trying to access home page, redirect to dashboard
    if (isHomePath && token && token.role === "SHOP_OWNER") {
      console.log("Redirecting shop owner from home to dashboard")
      return NextResponse.redirect(new URL("/shop/dashboard", req.url))
    }

    // If shop path but no token, expired token, or not a shop owner, redirect to login
    if (isShopPath) {
      if (!token || token.role !== "SHOP_OWNER") {
        console.log("Redirecting to login: token missing or invalid role")
        return NextResponse.redirect(new URL("/login", req.url))
      }
      
      // Check if token is expired by checking token expiry
      // The exp claim is in seconds since Unix epoch, Date.now() is in milliseconds
      const tokenExp = token.exp as number | undefined;
      if (tokenExp && Date.now() / 1000 >= tokenExp) {
        console.log("Redirecting to login: token expired")
        return NextResponse.redirect(new URL("/login?error=SessionExpired", req.url))
      }
    }
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error processing the token (like an expired JWT), redirect to login
    if (isShopPath) {
      console.log("Redirecting to login due to token error")
      return NextResponse.redirect(new URL("/login?error=AuthError", req.url))
    }
  }

  // Allow the request to continue
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
} 