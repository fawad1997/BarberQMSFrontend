import { NextRequest, NextResponse } from "next/server";
import { getApiEndpoint } from "@/lib/utils/api-config";

export async function POST(req: NextRequest) {
  try {
    // Get token and new password from request body
    const { token, new_password } = await req.json();

    if (!token || !new_password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    console.log("Processing password reset");

    // Call the backend API
    const response = await fetch(getApiEndpoint("auth/reset-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, new_password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to reset password" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { 
        success: data.success,
        message: data.message
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 