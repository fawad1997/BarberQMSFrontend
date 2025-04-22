"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to check if a profile update occurred and handle refreshing if needed
 */
export function useProfileRefresh() {
  const { data: session, update } = useSession();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip if already checked or not in browser
    if (checked || typeof window === 'undefined') return;
    
    // Only run once session is loaded
    if (!session) return;
    
    // Mark as checked to avoid running more than once
    setChecked(true);
    
    // Check if we have evidence of a name update
    const lastUpdate = localStorage.getItem('lastNameUpdate');
    const updatedName = localStorage.getItem('updatedName');
    
    if (lastUpdate && updatedName) {
      const updateTime = new Date(lastUpdate);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - updateTime.getTime()) / 1000;
      
      console.log("Profile refresh check:", {
        currentSessionName: session.user?.name,
        updatedName,
        secondsSinceUpdate,
      });
      
      // Only handle updates that happened recently (in the last 5 minutes)
      if (secondsSinceUpdate < 300) {
        // If the session name doesn't match the updated name, refresh
        if (session.user?.name !== updatedName) {
          console.log("Session name doesn't match updated name, updating session...");
          
          // Try to update the session directly first
          update({
            ...session,
            user: {
              ...session.user,
              name: updatedName
            }
          }).then(() => {
            console.log("Session updated successfully");
            
            // Wait a bit then reload the page if needed
            setTimeout(() => {
              // Check if the name in DOM still doesn't match
              const needsReload = document.querySelector('[data-profile-name]')?.textContent?.trim() !== updatedName;
              
              if (needsReload) {
                console.log("DOM still shows old name, reloading page");
                window.location.reload();
              }
            }, 500);
          }).catch(error => {
            console.error("Failed to update session:", error);
            // Force reload as fallback
            window.location.reload();
          });
        }
      }
      
      // Clean up storage regardless of whether we took action
      localStorage.removeItem('lastNameUpdate');
      localStorage.removeItem('updatedName');
    }
  }, [session, update, checked]);
  
  return null;
} 