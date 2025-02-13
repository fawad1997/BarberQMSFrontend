import { Shop } from "@/types/shop";
import { getSession } from "next-auth/react";
import { handleUnauthorizedResponse } from "@/lib/utils/auth-utils";
import { DashboardData } from "@/types/dashboard";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getShops = async (): Promise<Shop[]> => {
  const session = await getSession();
  
  if (!session?.user?.accessToken) {
    await handleUnauthorizedResponse();
    throw new Error("No access token found. Please login again.");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (response.status === 401) {
      await handleUnauthorizedResponse();
      throw new Error("Session expired");
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      redirect("/api/auth/signin");
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
