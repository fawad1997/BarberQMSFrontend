import { Shop } from "@/types/shop";
import { getSession } from "next-auth/react";
import { handleUnauthorizedResponse } from "@/lib/utils/auth-utils";
import { DashboardData } from "@/types/dashboard";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getApiEndpoint, getAlternativeApiUrl } from "@/lib/utils/api-config";

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

export const getShops = async (useFallbackApi: boolean = false): Promise<Shop[]> => {
  const session = await getSession();
  
  if (!session?.user?.accessToken) {
    await handleUnauthorizedResponse();
    throw new AuthenticationError("No access token found. Please login again.");
  }

  try {
    console.log("Fetching shops from API...");
    
    let apiUrl = '';
    if (useFallbackApi) {
      // Use the alternative API URL
      apiUrl = `${getAlternativeApiUrl()}/shop-owners/shops`;
      console.log("Using fallback API URL:", apiUrl);
    } else {
      apiUrl = getApiEndpoint("shop-owners/shops");
      console.log("Using primary API URL:", apiUrl);
    }
    
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

export const getDashboardData = async (accessToken?: string, useFallbackApi: boolean = false): Promise<DashboardData> => {
  if (!accessToken) {
    throw new AuthenticationError("No access token provided");
  }

  try {
    console.log("Fetching dashboard data...");
    
    let apiUrl = '';
    if (useFallbackApi) {
      // Use the alternative API URL
      apiUrl = `${getAlternativeApiUrl()}/shop-owners/dashboard`;
      console.log("Using fallback API URL for dashboard:", apiUrl);
    } else {
      apiUrl = getApiEndpoint("shop-owners/dashboard");
      console.log("Using primary API URL for dashboard:", apiUrl);
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Session expired");
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Non-JSON dashboard response:", textResponse.substring(0, 500));
      throw new ApiError(`The server returned an invalid response format: ${contentType || 'unknown'}`, response.status);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.message || `Failed to fetch dashboard data. Status code: ${response.status}`, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    throw new NetworkError(
      "Failed to connect to the server. Please check your internet connection and try again.",
      error
    );
  }
};
