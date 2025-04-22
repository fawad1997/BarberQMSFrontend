import { NextRequest, NextResponse } from "next/server";
import { getApiEndpoint } from "@/lib/utils/api-config";
import { getToken } from "next-auth/jwt";

export async function PUT(req: NextRequest) {
  try {
    // Get the authentication token from the request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // If no token is present, return unauthorized
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Extract the access token
    const accessToken = token.accessToken as string;

    // Get the request body
    const requestBody = await req.json();

    // Determine if it's a password update
    const isPasswordUpdate = !!requestBody.current_password && !!requestBody.new_password;
    const isNameUpdate = !!requestBody.name;

    console.log(`Processing ${isPasswordUpdate ? 'password update' : isNameUpdate ? 'name update' : 'profile update'} request`);
    
    if (isNameUpdate) {
      console.log(`Updating name to: ${requestBody.name}`);
    }

    // Forward the request to the backend API
    const response = await fetch(getApiEndpoint("users/profile"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Get the response data
    const data = await response.json().catch(() => null);

    // Log success response for debugging
    if (response.ok) {
      console.log("API response success:", data);
    }

    // If the backend response is not OK, handle specific error cases
    if (!response.ok) {
      console.error('API error:', response.status, data);
      
      // If it's a password update and we get a 401, it's likely an incorrect current password
      if (isPasswordUpdate && response.status === 401) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
      
      // If we got a validation error from the backend
      if (response.status === 422) {
        return NextResponse.json(
          data || { error: "Validation error" },
          { status: 422 }
        );
      }
      
      // For all other errors
      return NextResponse.json(
        data || { error: "Failed to update user profile" },
        { status: response.status }
      );
    }

    // Map the response to match our frontend session structure
    // The backend uses 'name' for the full_name field
    const responseData = {
      ...data,
      // Keep both name and full_name fields to be safe
      name: data.name,
      full_name: data.name,
    };

    // Return successful response
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 