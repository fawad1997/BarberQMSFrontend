import { Shop } from "@/types/shop";
import { getSession } from "next-auth/react";

export const getShops = async (): Promise<Shop[]> => {
  const session = await getSession();
  console.log(session);
  
  if (!session?.user?.accessToken) {
    throw new Error("No access token found. Please login again.");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch shops");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching shops:", error);
    throw error;
  }
};
