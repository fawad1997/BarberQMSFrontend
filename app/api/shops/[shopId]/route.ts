import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Endpoint to get business data by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    // Get token from session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.accessToken) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const { shopId } = params;
    
    // Get business data from the backend API using the business-owners endpoint
    const businessResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business-owners/businesses/${shopId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.accessToken}`
      }
    });
    
    if (!businessResponse.ok) {
      const errorData = await businessResponse.json();
      return new NextResponse(JSON.stringify({ error: errorData.detail || "Failed to get business data" }), {
        status: businessResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const business = await businessResponse.json();
    
    return new NextResponse(JSON.stringify(business), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error fetching business data:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
