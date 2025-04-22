"use client";

import { Session } from "next-auth";
import { toast } from "sonner";

/**
 * Updates the user session and reloads the page after a delay
 * @param updateFunc - Function to update the session
 * @param session - Current session
 * @param newData - New data to update in the session
 * @param successMessage - Message to display on success
 * @param reloadDelay - Delay in ms before reloading the page (default: 1500ms)
 * @returns Promise that resolves after the session is updated
 */
export async function updateSessionAndReload(
  updateFunc: (data: any) => Promise<any>,
  session: Session | null,
  newData: Partial<Session["user"]>,
  successMessage = "Profile updated successfully! Refreshing page...",
  reloadDelay = 1500
): Promise<void> {
  if (!session) {
    console.error("Cannot update session: No active session");
    return;
  }

  try {
    // Update the session
    await updateFunc({
      ...session,
      user: {
        ...session.user,
        ...newData,
      },
    });

    // Log session update for debugging
    console.log("Session updated successfully with new data:", newData);

    // Show success message
    toast.success(successMessage);
    
    // Save current URL to reload to
    const currentUrl = window.location.href;
    
    // Add both a flag and the timestamp to localStorage
    localStorage.setItem('_needsReload', 'true');
    localStorage.setItem('_reloadTimestamp', Date.now().toString());
    localStorage.setItem('_reloadUrl', currentUrl);
    
    // Use multiple reload mechanisms for better reliability
    setTimeout(() => {
      console.log("Executing page reload now");
      
      try {
        // Try direct navigation first (most reliable)
        window.location.href = currentUrl;
        
        // Fallback to reload if the above doesn't trigger immediately
        setTimeout(() => {
          window.location.reload(true); // force reload from server
        }, 100);
      } catch (e) {
        console.error("Error during reload:", e);
        window.location.reload(true);
      }
    }, reloadDelay);
  } catch (error) {
    console.error("Failed to update session:", error);
    toast.error("Failed to update session data. Please try again.");
  }
} 