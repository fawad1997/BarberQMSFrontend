import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Endpoint to get barber profile data
export async function GET(request: NextRequest) {
  try {
    // Get token from session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.accessToken) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Get employee profile from the backend API
    const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/profile`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.accessToken}`
      }
    });
    
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      return new NextResponse(JSON.stringify({ error: errorData.detail || "Failed to get employee profile" }), {
        status: profileResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const profile = await profileResponse.json();
    
    return new NextResponse(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error fetching barber profile:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
