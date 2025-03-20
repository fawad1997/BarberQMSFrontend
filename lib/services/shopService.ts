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
    
    // Log token details for debugging (only first/last few chars for security)
    const tokenStart = session.user.accessToken.substring(0, 10);
    const tokenEnd = session.user.accessToken.length > 10 ? session.user.accessToken.substring(session.user.accessToken.length - 5) : '';
    console.log(`Using token: ${tokenStart}...${tokenEnd}, length: ${session.user.accessToken.length}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      cache: 'no-store',
      credentials: 'include'
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      await handleUnauthorizedResponse();
      throw new AuthenticationError("Session expired");
    }

    // Clone the response for error handling
    const responseClone = response.clone();

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    console.log("Response content type:", contentType);
    
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, get the text to see what was returned
      const textResponse = await responseClone.text();
      console.error("Non-JSON response:", textResponse);
      throw new ApiError(`The server returned an invalid response format: ${contentType || 'unknown'}`, response.status);
    }

    if (!response.ok) {
      try {
        const errorData = await responseClone.json();
        console.error("Error response data:", errorData);
        throw new ApiError(errorData.message || `Failed to fetch shops. Status code: ${response.status}`, response.status);
      } catch (parseError) {
        const textResponse = await responseClone.text();
        console.error("Raw error response:", textResponse);
        throw new ApiError(`Failed to fetch shops: ${textResponse || 'Unknown error'}`, response.status);
      }
    }

    const result = await response.json();
    console.log("Shop data fetched successfully");
    return result;
  } catch (error) {
    console.error("Error in getShops:", error);
    
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error("Network error - Backend server might be down or unreachable");
      throw new NetworkError(
        "Unable to connect to the server. Please check if the backend server is running at http://localhost:8000", 
        error
      );
    }
    
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
    return {} as DashboardData;
  }

  if (typeof accessToken !== 'string' || accessToken.trim() === '') {
    console.log("Invalid token format, redirecting to login");
    redirect('/login?error=InvalidToken');
    return {} as DashboardData;
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
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
    });

    console.log("Dashboard response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    // Clone the response for error handling
    const responseClone = response.clone();

    // Immediately handle auth errors
    if (response.status === 401 || response.status === 403) {
      console.log(`Authentication failed with status ${response.status} - redirecting to login`);
      redirect('/login?error=SessionExpired');
      return {} as DashboardData;
    }

    // If non-OK status, handle generically
    if (!response.ok) {
      console.error(`Non-OK response: ${response.status}`);
      let errorMessage = 'Unknown error';
      
      try {
        const errorData = await responseClone.json();
        console.error("Error response data:", errorData);
        errorMessage = errorData.message || errorData.detail || 'Unknown error';
      } catch (parseError) {
        const textResponse = await responseClone.text();
        console.error("Raw error response:", textResponse);
        errorMessage = textResponse || 'Unknown error';
      }
      
      throw new ApiError(`Failed to fetch dashboard data: ${errorMessage}`, response.status);
    }

    // For successful responses, ensure we get valid JSON
    try {
      const data = await response.json();
      console.log("Successfully parsed dashboard data");
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
      return {} as DashboardData;
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
      return {} as DashboardData;
    }
    
    // For network errors, throw a consistent error
    throw new NetworkError(
      "Failed to connect to the server. Please check your internet connection and try again.",
      error
    );
  }
};
