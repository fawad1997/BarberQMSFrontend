import { NextRequest, NextResponse } from "next/server";
import { getApiEndpoint } from "@/lib/utils/api-config";

export async function POST(req: NextRequest) {
  try {
    // Get token from request body
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token is required" },
        { status: 400 }
      );
    }

    console.log("Validating reset token");

    // Call the backend API
    const response = await fetch(getApiEndpoint("auth/validate-reset-token"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, message: data.detail || "Failed to validate token" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { 
        valid: data.valid,
        message: data.message,
        user_email: data.user_email
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Validate reset token error:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 