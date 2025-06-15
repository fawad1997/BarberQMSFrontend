import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Endpoint to get shop data by ID
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
    
    // Get shop data from the backend API using the shop-owners endpoint
    const shopResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.accessToken}`
      }
    });
    
    if (!shopResponse.ok) {
      const errorData = await shopResponse.json();
      return new NextResponse(JSON.stringify({ error: errorData.detail || "Failed to get shop data" }), {
        status: shopResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const shop = await shopResponse.json();
    
    return new NextResponse(JSON.stringify(shop), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error fetching shop data:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
