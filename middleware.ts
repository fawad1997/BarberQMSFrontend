import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Helper function to check if a string is a valid numeric ID
function isNumericId(str: string): boolean {
  return /^\d+$/.test(str);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isShopPath = path.startsWith("/shop")
  const isHomePath = path === "/"
  
  // Handle salon ID to slug redirects
  const salonPathMatch = path.match(/^\/salons\/(\d+)/)
  if (salonPathMatch) {
    try {
      const salonId = salonPathMatch[1]
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
      const response = await fetch(`${API_URL}/appointments/shop/${salonId}`)
      
      if (response.ok) {
        const salon = await response.json()
        if (salon && salon.slug) {
          const slugPath = path.replace(salonId, salon.slug)
          return NextResponse.redirect(new URL(slugPath, req.url))
        }
      }
    } catch (error) {
      // If we can't redirect, continue with the request
    }
  }

  try {
    // Get token with more explicit options
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production"
    })
    
    // If user is a shop owner and trying to access home page, redirect to dashboard
    if (isHomePath && token && token.role === "SHOP_OWNER") {
      return NextResponse.redirect(new URL("/shop/dashboard", req.url))
    }

    // If shop path but no token, expired token, or not a shop owner, redirect to login
    if (isShopPath) {
      if (!token || token.role !== "SHOP_OWNER") {
        return NextResponse.redirect(new URL("/login", req.url))
      }
      
      // Check if token is expired
      const tokenExp = token.exp as number | undefined;
      if (tokenExp && Date.now() / 1000 >= tokenExp) {
        return NextResponse.redirect(new URL("/login?error=SessionExpired", req.url))
      }
    }
  } catch (error) {
    // If there's an error processing the token, redirect to login
    if (isShopPath) {
      return NextResponse.redirect(new URL("/login?error=AuthError", req.url))
    }
  }

  // Allow the request to continue
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
} 