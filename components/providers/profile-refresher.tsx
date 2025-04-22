"use client";

import { useProfileRefresh } from "@/hooks/useProfileRefresh";

export default function ProfileRefresher() {
  // Use the hook to check for profile updates
  useProfileRefresh();
  
  // This component doesn't render anything
  return null;
} 