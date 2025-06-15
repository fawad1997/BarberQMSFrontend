import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies, headers } from "next/headers";

/**
 * Get the current session from the server
 * @returns The current session or null if not authenticated
 */
export async function getSession() {
  // Using getServerSession with authOptions to get the current session
  return await getServerSession(authOptions);
}

/**
 * Get the current session from the server with error handling
 * @returns Object containing session data and error status
 */
export async function getSessionWithErrorHandling() {
  try {
    const session = await getSession();
    
    if (!session) {
      return {
        session: null,
        isAuthenticated: false,
        error: "Not authenticated"
      };
    }
    
    return {
      session,
      isAuthenticated: true,
      error: null
    };
  } catch (error) {
    console.error("Error fetching session:", error);
    return {
      session: null,
      isAuthenticated: false,
      error: "Error fetching session data"
    };
  }
}
