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

// Add interface for username availability response
interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
  message: string;
}

export const getShops = async (unused: boolean = false): Promise<Shop[]> => {
  const session = await getSession();
  
  if (!session?.user?.accessToken) {
    await handleUnauthorizedResponse();
    throw new AuthenticationError("No access token found. Please login again.");
  }

  try {
    const apiUrl = getApiEndpoint("/business-owners/businesses");
    
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

    
    if (response.status === 401) {
      await handleUnauthorizedResponse();
      throw new AuthenticationError("Session expired");
    }

    // Clone the response for error handling
    const responseClone = response.clone();

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    
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
        throw new ApiError(errorData.message || `Failed to fetch businesses. Status code: ${response.status}`, response.status);
      } catch (parseError) {
        const textResponse = await responseClone.text();
        console.error("Raw error response:", textResponse);
        throw new ApiError(`Failed to fetch businesses: ${textResponse || 'Unknown error'}`, response.status);
      }
    }

    const result = await response.json();
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
      const apiUrl = getApiEndpoint("");
      throw new NetworkError(
        `Unable to connect to the server. Please check if the backend server is running at ${apiUrl}`, 
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
    redirect('/login?error=NoToken');
    return {} as DashboardData;
  }

  if (typeof accessToken !== 'string' || accessToken.trim() === '') {
    redirect('/login?error=InvalidToken');
    return {} as DashboardData;
  }

  try {
    // Use the available businesses endpoint since /dashboard doesn't exist
    const apiUrl = getApiEndpoint("business-owners/businesses/");
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
    });

    // Clone the response for error handling
    const responseClone = response.clone();

    // Immediately handle auth errors
    if (response.status === 401 || response.status === 403) {
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
      
      throw new ApiError(`Failed to fetch business data: ${errorMessage}`, response.status);
    }

    // For successful responses, ensure we get valid JSON
    try {
      const businesses = await response.json();
      
      // Transform businesses data into dashboard format
      // Since we don't have real metrics yet, provide placeholder data
      const dashboardData: DashboardData = {
        shops: businesses.map((business: any) => ({
          shop_id: business.id,
          shop_name: business.name,
          total_customers_today: 0, // Placeholder - will be updated when metrics endpoint is available
          customers_in_queue: 0, // Placeholder
          customers_served: 0, // Placeholder
          cancellations: 0, // Placeholder
          average_wait_time: business.average_wait_time || 0,
          barber_management: [] // Placeholder - will be populated when employee metrics are available
        })),
        daily_insights: {
          total_customer_visits_today: 0, // Placeholder
          average_wait_time: businesses.length > 0 ? 
            businesses.reduce((sum: number, b: any) => sum + (b.average_wait_time || 0), 0) / businesses.length : 0
        },
        historical_trends: [] // Placeholder - will be populated when analytics endpoint is available
      };
      
      return dashboardData;
    } catch (parseError) {
      console.error("Error parsing business data JSON:", parseError);
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

export const checkUsernameAvailability = async (username: string): Promise<UsernameAvailabilityResponse> => {
  const session = await getSession();
  
  if (!session?.user?.accessToken) {
    await handleUnauthorizedResponse();
    throw new AuthenticationError("No access token found. Please login again.");
  }

  try {
    const apiUrl = getApiEndpoint(`/business-owners/check-username/${encodeURIComponent(username)}`);
    
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
    
    if (response.status === 401) {
      await handleUnauthorizedResponse();
      throw new AuthenticationError("Session expired");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Username check failed:", response.status, errorText);
      throw new ApiError(`Failed to check username availability: ${response.statusText}`, response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Username availability check error:", error);
    
    if (error instanceof AuthenticationError || error instanceof ApiError) {
      throw error;
    }
    
    throw new NetworkError("Failed to check username availability");
  }
};
