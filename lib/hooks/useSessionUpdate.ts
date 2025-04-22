"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

/**
 * Custom hook to handle session updates and force re-renders
 * when session data changes
 */
export function useSessionUpdate() {
  const { data: session, update, status } = useSession();
  const [updateCount, setUpdateCount] = useState(0);
  const [sessionCopy, setSessionCopy] = useState(session);
  
  // Keep sessionCopy in sync with actual session
  useEffect(() => {
    if (session) {
      setSessionCopy(session);
      console.log("Session updated in hook:", session);
    }
  }, [session]);

  // Create an enhanced update function that triggers re-render
  const updateSession = useCallback(async (userData: any) => {
    try {
      console.log("Updating session with:", userData);
      
      // Create the updated user data
      const updatedUser = {
        ...session?.user,
        ...userData
      };
      
      console.log("Full updated user data:", updatedUser);
      
      // Update session
      const result = await update({
        ...session,
        user: updatedUser
      });
      
      console.log("Session update result:", result);
      
      // Manually update our local copy for immediate UI updates
      setSessionCopy({
        ...session,
        user: updatedUser
      });
      
      // Force re-render by updating the count
      setUpdateCount(prev => prev + 1);
      
      // Add debug info to window for inspection
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.__sessionDebug = {
          original: session,
          updated: updatedUser,
          updateCount
        };
      }
      
      return true;
    } catch (error) {
      console.error("Session update failed:", error);
      return false;
    }
  }, [session, update, updateCount]);

  // Force a UI refresh without changing session data
  const resetSessionUI = useCallback(() => {
    console.log("Forcing session UI refresh");
    setUpdateCount(prev => prev + 1);
    return true;
  }, []);

  // Return both the original session and our synchronized copy
  return {
    session: sessionCopy || session,
    originalSession: session,
    updateSession,
    resetSessionUI,
    sessionKey: updateCount,
    status
  };
} 