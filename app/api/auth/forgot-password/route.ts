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

    // In a real implementation, we would forward this request to our backend API
    // For now, we'll just simulate a successful response for any valid email format
    
    console.log("Processing forgot password request for:", email);

    // This would be the actual API call in production:
    // const response = await fetch(getApiEndpoint("auth/forgot-password"), {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ email }),
    // });
    //
    // const data = await response.json();
    //
    // if (!response.ok) {
    //   return NextResponse.json(
    //     { error: data.message || "Failed to process request" },
    //     { status: response.status }
    //   );
    // }

    // For security reasons, we always return a success response
    // even if the email doesn't exist in our system
    // This prevents user enumeration attacks
    return NextResponse.json(
      { 
        success: true, 
        message: "If an account exists with that email, a password reset link will be sent." 
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