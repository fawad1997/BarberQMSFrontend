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
      // Use consistent API_URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      console.log(`[Middleware] Redirecting ID to slug for salon ID: ${salonId}`)
      console.log(`[Middleware] API URL: ${API_URL}`)
      
      // Fetch salon details to get the slug
      const endpoint = `${API_URL}/appointments/shop/${salonId}`
      console.log(`[Middleware] Fetching from: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't cache this request to ensure we get the latest data
        cache: 'no-store'
      })
      
      if (response.ok) {
        const salon = await response.json()
        console.log(`[Middleware] Salon data retrieved: ${JSON.stringify(salon)}`)
        
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
        console.log(`[Middleware] Direct salon lookup failed with status: ${response.status}`)
        // If that fails, try the all salons endpoint as fallback
        const allSalonsEndpoint = `${API_URL}/appointments/shops`
        console.log(`[Middleware] Trying fallback endpoint: ${allSalonsEndpoint}`)
        
        const allSalonsResponse = await fetch(allSalonsEndpoint, { 
          cache: 'no-store' 
        })
        
        if (allSalonsResponse.ok) {
          const salonsData = await allSalonsResponse.json()
          if (salonsData && salonsData.items && Array.isArray(salonsData.items)) {
            console.log(`[Middleware] Searching through ${salonsData.items.length} salons for ID: ${salonId}`)
            
            const salon = salonsData.items.find((s: any) => s.id === parseInt(salonId))
            if (salon && salon.slug) {
              const restOfPath = path.substring(path.indexOf(salonId) + salonId.length)
              const slugPath = `/salons/${salon.slug}${restOfPath}`
              console.log(`[Middleware] Found salon by ID in list. Redirecting to ${slugPath}`)
              return NextResponse.redirect(new URL(slugPath, req.url))
            } else {
              console.log(`[Middleware] No matching salon found in list for ID: ${salonId}`)
            }
          } else {
            console.log(`[Middleware] Invalid response format from salons endpoint`)
          }
        } else {
          console.log(`[Middleware] Fallback request failed with status: ${allSalonsResponse.status}`)
        }
      }
    } catch (error) {
      console.error('[Middleware] Error in redirect:', error)
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