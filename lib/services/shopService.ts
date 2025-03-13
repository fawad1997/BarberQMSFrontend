import { Shop } from "@/types/shop";
import { getSession } from "next-auth/react";
import { handleUnauthorizedResponse } from "@/lib/utils/auth-utils";
import { DashboardData } from "@/types/dashboard";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getApiEndpoint } from "@/lib/utils/api-config";

// Custom error classes for better error handling
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class NetworkError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export const getShops = async (unused: boolean = false): Promise<Shop[]> => {
  const session = await getSession();
  
  if (!session?.user?.accessToken) {
    await handleUnauthorizedResponse();
    throw new AuthenticationError("No access token found. Please login again.");
  }

  try {
    console.log("Fetching shops from API...");
    const apiUrl = getApiEndpoint("/shop-owners/shops");
    console.log("Using API URL:", apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    console.log("Response status:", response.status);
    
    if (response.status === 401) {
      await handleUnauthorizedResponse();
      throw new AuthenticationError("Session expired");
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    console.log("Response content type:", contentType);
    
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, get the text to see what was returned
      const textResponse = await response.text();
      console.error("Non-JSON response:", textResponse.substring(0, 500));
      throw new ApiError(`The server returned an invalid response format: ${contentType || 'unknown'}`, response.status);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.message || `Failed to fetch shops. Status code: ${response.status}`, response.status);
    }

    const result = await response.json();
    console.log("Shop data fetched successfully");
    return result;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    console.error("Error fetching shops:", error);
    throw new NetworkError(
      "Failed to connect to the server. Please check your internet connection and try again.", 
      error
    );
  }
};

const handleError = (error: any) => {
  if (error instanceof AuthenticationError) {
    redirect("/api/auth/signin");
  }
  console.error("API Error:", error);
  throw error;
};

export const getDashboardData = async (accessToken?: string): Promise<DashboardData> => {
  // More robust token validation
  if (!accessToken) {
    console.log("No access token provided, redirecting to login");
    redirect('/login?error=NoToken');
    return {} as DashboardData; // This line won't execute due to redirect, but helps TypeScript
  }

  if (typeof accessToken !== 'string' || accessToken.trim() === '') {
    console.log("Invalid token format, redirecting to login");
    redirect('/login?error=InvalidToken');
    return {} as DashboardData; // This line won't execute due to redirect, but helps TypeScript
  }

  try {
    console.log("Fetching dashboard data...");
    const apiUrl = getApiEndpoint("shop-owners/dashboard");
    console.log("Using API URL for dashboard:", apiUrl);
    
    // Log token details for debugging (only first/last few chars for security)
    const tokenStart = accessToken.substring(0, 10);
    const tokenEnd = accessToken.length > 10 ? accessToken.substring(accessToken.length - 5) : '';
    console.log(`Using token: ${tokenStart}...${tokenEnd}, length: ${accessToken.length}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      cache: 'no-store',
    });

    console.log("Dashboard response status:", response.status);

    // Immediately handle auth errors
    if (response.status === 401 || response.status === 403) {
      console.log(`Authentication failed with status ${response.status} - redirecting to login`);
      redirect('/login?error=SessionExpired');
      return {} as DashboardData; // This line won't execute due to redirect, but helps TypeScript
    }

    // If non-OK status, handle generically
    if (!response.ok) {
      console.error(`Non-OK response: ${response.status}`);
      // Try to get JSON error if available
      try {
        const errorData = await response.json();
        throw new ApiError(errorData.message || `API Error: ${response.status}`, response.status);
      } catch (parseError) {
        // If can't parse JSON, use text or status
        const text = await response.text().catch(() => "Unknown error");
        throw new ApiError(`Failed to fetch dashboard data: ${text.substring(0, 100)}`, response.status);
      }
    }

    // For successful responses, ensure we get valid JSON
    try {
      const data = await response.json();
      return data;
    } catch (parseError) {
      console.error("Error parsing dashboard JSON:", parseError);
      throw new ApiError("Invalid response format from server", response.status);
    }
  } catch (error: any) {
    console.error("Dashboard fetch error:", error);
    
    // Handle specific auth-related errors
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect('/login?error=SessionExpired');
      return {} as DashboardData; // This line won't execute due to redirect, but helps TypeScript
    }
    
    // Check for token-related errors in the error message
    const errorMessage = (error?.message || '').toLowerCase();
    if (
      error instanceof AuthenticationError || 
      errorMessage.includes('auth') ||
      errorMessage.includes('token') ||
      errorMessage.includes('unauthorized')
    ) {
      console.log("Authentication error detected, redirecting to login:", errorMessage);
      redirect('/login?error=AuthError');
      return {} as DashboardData; // This line won't execute due to redirect, but helps TypeScript
    }
    
    // For network errors, throw a consistent error
    throw new NetworkError(
      "Failed to connect to the server. Please check your internet connection and try again.",
      error
    );
  }
};
