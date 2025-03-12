import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export async function handleUnauthorizedResponse() {
  try {
    // Try to use client-side signOut if available
    await signOut({ redirect: false });
  } catch (e) {
    // Fallback to server-side redirect if client-side signOut fails
    console.error("Error during signOut:", e);
  }
  
  // Always redirect to login page with error param
  redirect("/login?error=SessionExpired");
} 