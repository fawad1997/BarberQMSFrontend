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
    // Handle salon ID/slug to username redirects for all salon-related paths
  // This catches URLs like /salons/123, /salons/123/check-in, /salons/old-slug/queue, etc.
  // and redirects them to use the current username
  const salonPathMatch = path.match(/^\/salons\/([^\/]+)(?:\/.*)?/)
  if (salonPathMatch) {
    try {
      const salonIdentifier = salonPathMatch[1]
      const isNumericId = /^\d+$/.test(salonIdentifier)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Always fetch salon details to ensure we have the current username
      console.log(`[Middleware] Verifying salon identifier: ${salonIdentifier}`)
      
      // Fetch salon details directly - matches salonService approach
      const endpoint = `${API_URL}/appointments/shop/${salonIdentifier}`
      console.log(`[Middleware] Fetching from: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const salon = await response.json()
        
        if (salon && salon.username) {
          // If the identifier in the URL is not the current username, redirect to username
          if (salonIdentifier !== salon.username) {
            // Preserve the rest of the path (e.g., /check-in, /queue)
            const restOfPath = path.substring(path.indexOf(salonIdentifier) + salonIdentifier.length)
            const usernamePath = `/salons/${salon.username}${restOfPath}`
            console.log(`[Middleware] Redirecting from ${path} to ${usernamePath}`)
            return NextResponse.redirect(new URL(usernamePath, req.url))
          } else {
            console.log(`[Middleware] URL already uses current username: ${salonIdentifier}`)
          }
        } else {
          console.log(`[Middleware] Salon found but no username available for identifier: ${salonIdentifier}`)
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

    const isBarberPath = path.startsWith("/barber")

    // Redirect from home to appropriate dashboard based on role
    if (isHomePath && token) {
      if (token.role === "SHOP_OWNER") {
        return NextResponse.redirect(new URL("/shop/dashboard", req.url))
      } else if (token.role === "BARBER") {
        return NextResponse.redirect(new URL("/barber/dashboard", req.url))
      }
    }

    // Handle shop owner routes
    if (isShopPath) {
      if (!token || token.role !== "SHOP_OWNER") {
        // If user is a barber, redirect to barber dashboard
        if (token && token.role === "BARBER") {
          return NextResponse.redirect(new URL("/barber/dashboard", req.url))
        }
        return NextResponse.redirect(new URL("/login", req.url))
      }
      
      const tokenExp = token.exp as number | undefined;
      if (tokenExp && Date.now() / 1000 >= tokenExp) {
        return NextResponse.redirect(new URL("/login?error=SessionExpired", req.url))
      }
    }

    // Handle barber routes
    if (isBarberPath) {
      if (!token || token.role !== "BARBER") {
        // If user is a shop owner, redirect to shop dashboard
        if (token && token.role === "SHOP_OWNER") {
          return NextResponse.redirect(new URL("/shop/dashboard", req.url))
        }
        return NextResponse.redirect(new URL("/login", req.url))
      }
      
      const tokenExp = token.exp as number | undefined;
      if (tokenExp && Date.now() / 1000 >= tokenExp) {
        return NextResponse.redirect(new URL("/login?error=SessionExpired", req.url))
      }
    }
  } catch (error) {
    if (isShopPath || path.startsWith("/barber")) {
      return NextResponse.redirect(new URL("/login?error=AuthError", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
} 