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
  
  // Handle salon ID to slug redirects for all salon-related paths
  // This catches URLs like /salons/123, /salons/123/check-in, /salons/123/queue, etc.
  const salonPathMatch = path.match(/^\/salons\/(\d+)(?:\/.*)?/)
  if (salonPathMatch) {
    try {
      const salonId = salonPathMatch[1]
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      console.log(`[Middleware] Redirecting from ID to slug for salon ID: ${salonId}`)
      
      // Fetch salon details directly - matches salonService approach
      const endpoint = `${API_URL}/appointments/shop/${salonId}`
      console.log(`[Middleware] Fetching from: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const salon = await response.json()
        
        if (salon && salon.slug) {
          // Preserve the rest of the path (e.g., /check-in, /queue)
          const restOfPath = path.substring(path.indexOf(salonId) + salonId.length)
          const slugPath = `/salons/${salon.slug}${restOfPath}`
          console.log(`[Middleware] Redirecting from ${path} to ${slugPath}`)
          return NextResponse.redirect(new URL(slugPath, req.url))
        } else {
          console.log(`[Middleware] Salon found but no slug available for ID: ${salonId}`)
        }
      } else {
        console.log(`[Middleware] Failed to fetch salon details. Status: ${response.status}`)
      }
    } catch (error) {
      console.error('[Middleware] Error in redirect:', error)
    }
  }

  // Handle auth logic
  try {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production"
    })

    if (isHomePath && token && token.role === "SHOP_OWNER") {
      return NextResponse.redirect(new URL("/shop/dashboard", req.url))
    }

    if (isShopPath) {
      if (!token || token.role !== "SHOP_OWNER") {
        return NextResponse.redirect(new URL("/login", req.url))
      }
      
      const tokenExp = token.exp as number | undefined;
      if (tokenExp && Date.now() / 1000 >= tokenExp) {
        return NextResponse.redirect(new URL("/login?error=SessionExpired", req.url))
      }
    }
  } catch (error) {
    if (isShopPath) {
      return NextResponse.redirect(new URL("/login?error=AuthError", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
} 