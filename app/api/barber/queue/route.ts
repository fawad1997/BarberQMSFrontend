import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Endpoint to get queue data for a barber's shop
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
    
    // Get employee profile which includes their business_id
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
    
    if (!profile.business_id) {
      return new NextResponse(JSON.stringify({ error: "No business found for this employee" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
      // Get queue data for the employee's business
    const queueResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queue/${profile.business_id}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.accessToken}`
      }
    });
    
    if (!queueResponse.ok) {
      const errorData = await queueResponse.json();
      return new NextResponse(JSON.stringify({ error: errorData.detail || "Failed to fetch queue data" }), {
        status: queueResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const queueData = await queueResponse.json();
    
    return new NextResponse(JSON.stringify(queueData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error fetching barber queue data:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
