"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditProfileDialog } from "@/components/pages/auth/edit-profile-dialog";
import { useSession } from "next-auth/react";

export default function TestProfilePage() {
  const [showDialog, setShowDialog] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-6">Test Profile Edit</h1>
      
      <div className="p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl mb-4">Current User Info</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {session?.user?.name || "Not logged in"}</p>
          <p><strong>Email:</strong> {session?.user?.email || "Not available"}</p>
          <p><strong>Role:</strong> {session?.user?.role || "Not available"}</p>
        </div>
        
        <div className="mt-6">
          <Button 
            onClick={() => setShowDialog(true)}
            disabled={!session?.user}
          >
            Open Edit Profile Dialog
          </Button>
          
          {!session?.user && (
            <p className="text-sm text-red-500 mt-2">
              You must be logged in to test this feature
            </p>
          )}
        </div>
      </div>
      
      <EditProfileDialog 
        isOpen={showDialog} 
        onClose={() => setShowDialog(false)} 
      />
    </div>
  );
} 