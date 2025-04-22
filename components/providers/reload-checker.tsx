"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ReloadChecker() {
  const { data: session } = useSession();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Skip if already checked this session or not in browser
    if (hasChecked || typeof window === 'undefined') return;
    
    // Only check once the session is loaded
    if (!session) return;
    
    setHasChecked(true);
    
    // Check if any reload flags exist
    const needsReload = localStorage.getItem('_needsReload');
    const nameUpdated = localStorage.getItem('nameUpdated');
    
    // Log debug info if name was recently updated
    if (nameUpdated === 'true') {
      const updateTime = localStorage.getItem('nameUpdateTime');
      const newName = localStorage.getItem('newName');
      console.log('Name was updated previously:', {
        currentSessionName: session?.user?.name,
        savedNewName: newName,
        updateTime
      });
      
      // Clean up name update flags
      localStorage.removeItem('nameUpdated');
      localStorage.removeItem('nameUpdateTime');
      localStorage.removeItem('newName');
    }
    
    // Only proceed if we need to reload
    if (needsReload === 'true') {
      console.log("ReloadChecker detected reload flag, preparing to reload");
      
      // Clear all reload-related flags to prevent reload loops
      localStorage.removeItem('_needsReload');
      localStorage.removeItem('_reloadTimestamp');
      localStorage.removeItem('_reloadUrl');
      
      // Force a complete page reload from the server after a short delay
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 200);
    }
  }, [session, hasChecked]);
  
  // This component doesn't render anything
  return null;
} 