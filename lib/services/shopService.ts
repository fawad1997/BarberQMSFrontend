import { Shop } from "@/types/shop";
import { getSession } from "next-auth/react";
import { handleUnauthorizedResponse } from "@/lib/utils/auth-utils";
import { DashboardData } from "@/types/dashboard";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getApiEndpoint } from "@/lib/utils/api-config";

export const getShops = async (): Promise<Shop[]> => {
  const session = await getSession();
  
  if (!session?.user?.accessToken) {
    await handleUnauthorizedResponse();
    throw new Error("No access token found. Please login again.");
  }

  try {
    const response = await fetch(getApiEndpoint("shop-owners/shops"), {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (response.status === 401) {
      await handleUnauthorizedResponse();
      throw new Error("Session expired");
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, get the text to see what was returned
      const textResponse = await response.text();
      console.error("Non-JSON response:", textResponse.substring(0, 500));
      throw new Error("The server returned an invalid response format.");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch shops");
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message === "Session expired") {
      throw error;
    }
    console.error("Error fetching shops:", error);
    throw error;
  }
};

const handleError = (error: any) => {
  if (error instanceof Error && error.message === "Session expired") {
    redirect("/api/auth/signin");
  }
  console.error("API Error:", error);
  throw error;
};

export const getDashboardData = async (accessToken?: string): Promise<DashboardData> => {
  if (!accessToken) {
    redirect("/api/auth/signin");
  }

  try {
    const response = await fetch(getApiEndpoint("shop-owners/dashboard"), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      redirect("/api/auth/signin");
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Non-JSON dashboard response:", textResponse.substring(0, 500));
      throw new Error("The server returned an invalid response format.");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch dashboard data");
    }

    return response.json();
  } catch (error) {
    handleError(error);
    throw error;
  }
};
