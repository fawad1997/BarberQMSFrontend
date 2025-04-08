import { NextRequest, NextResponse } from "next/server";
import { getApiEndpoint } from "@/lib/utils/api-config";

export async function GET(request: NextRequest) {
  // Get the Authorization header
  const authorization = request.headers.get("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authorization token is required" },
      { status: 401 }
    );
  }

  const token = authorization.split(" ")[1];

  try {
    // Forward the token to the backend for validation
    const response = await fetch(getApiEndpoint("auth/validate-token"), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If the backend returns an error, forward it to the client
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Invalid token" },
        { status: response.status }
      );
    }

    // Return the user data from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  }
} 