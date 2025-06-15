import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Endpoint to update queue client status
export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
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
    
    // Get client ID from URL params
    const clientId = params.clientId;
    if (!clientId) {
      return new NextResponse(JSON.stringify({ error: "Client ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Get status update from request body
    const { status } = await request.json();
    if (!status) {
      return new NextResponse(JSON.stringify({ error: "Status is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Get barber profile which includes their shop_id
    const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/barbers/profile`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.accessToken}`
      }
    });
    
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      return new NextResponse(JSON.stringify({ error: errorData.detail || "Failed to get barber profile" }), {
        status: profileResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const profile = await profileResponse.json();
    
    if (!profile.shop_id) {
      return new NextResponse(JSON.stringify({ error: "No shop found for this barber" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
      // Update client status through the backend API
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queue/${profile.shop_id}/client/${clientId}/status`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.accessToken}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      return new NextResponse(JSON.stringify({ error: errorData.detail || "Failed to update client status" }), {
        status: updateResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const responseData = await updateResponse.json();
    
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error updating client status:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
