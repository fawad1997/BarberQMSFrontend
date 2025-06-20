import { NextRequest, NextResponse } from "next/server";
import { getApiEndpoint } from "@/lib/utils/api-config";

export async function POST(req: NextRequest) {
  try {
    // Get email from request body
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("Processing forgot password request for:", email);

    // Call the backend API
    const response = await fetch(getApiEndpoint("auth/forgot-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to process request" },
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
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 