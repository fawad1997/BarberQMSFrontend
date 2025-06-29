"use client";

import { useState } from "react";
import { getSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getApiEndpoint } from "@/lib/utils/api-config";

interface DeleteShopDialogProps {
  shopId: string;
  shopName: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteShopDialog({
  shopId,
  shopName,
  isOpen,
  onClose,
  onDelete,
}: DeleteShopDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const session = await getSession();

      if (!session?.user?.accessToken) {
        toast.error("No access token found. Please login again.");
        return;
      }

      const response = await fetch(
        getApiEndpoint(`business-owners/businesses/${shopId}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        }
      );

      // Check for non-JSON response
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData?.message || "Failed to delete shop");
        } else {
          const textResponse = await response.text();
          console.error("Non-JSON response:", textResponse.substring(0, 500));
          throw new Error("Failed to delete shop. Invalid server response.");
        }
      }

      toast.success("Shop deleted successfully");
      onDelete();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete shop");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Shop</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{shopName}&quot;? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 