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
  if (!accessToken) {
    redirect('/login?error=NoToken');
    return {} as DashboardData;
  }
  if (typeof accessToken !== 'string' || accessToken.trim() === '') {
    redirect('/login?error=InvalidToken');
    return {} as DashboardData;
  }
  try {
    const apiUrl = getApiEndpoint("business-owners/dashboard");
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
    });
    if (response.status === 401 || response.status === 403) {
      redirect('/login?error=SessionExpired');
      return {} as DashboardData;
    }
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.clone().json();
        errorMessage = errorData.message || errorData.detail || 'Unknown error';
      } catch (parseError) {
        const textResponse = await response.clone().text();
        errorMessage = textResponse || 'Unknown error';
      }
      throw new ApiError(`Failed to fetch dashboard data: ${errorMessage}`, response.status);
    }
    const data = await response.json();
    return {
      shops: data.businesses.map((business: any) => ({
        shop_id: business.business_id,
        shop_name: business.business_name,
        total_customers_today: business.total_customers_today,
        customers_in_queue: business.customers_in_queue,
        customers_served: business.customers_served,
        cancellations: business.cancellations,
        average_wait_time: business.average_wait_time,
        barber_management: (business.employee_management || []).map((emp: any) => ({
          barber_id: emp.employee_id,
          full_name: emp.full_name,
          customers_served: emp.customers_served,
        })),
      })),
      daily_insights: data.daily_insights,
      historical_trends: data.historical_trends,
    };
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
