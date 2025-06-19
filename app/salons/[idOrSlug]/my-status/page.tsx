"use client"
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSalonDetails } from "@/lib/services/salonService";
import { ensureSalonUrlUsesUsername } from "@/lib/utils/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QueueStatus {
  position: number;
  estimated_wait_time: number;
  status: string;
  checked_in_at: string;
  full_name: string;
  barber_name?: string;
  service_name?: string;
}

interface SalonDetails {
  id: number;
  name: string;
  slug: string;
  username: string;
}

export default function MyStatusPage({ params }: { params: { idOrSlug: string } }) {
  const router = useRouter();
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const checkInPhone = localStorage.getItem('checkInPhone');
    const checkInShopId = localStorage.getItem('checkInShopId');
      const fetchSalonAndStatus = async () => {
      try {
        // First, get salon details to ensure we have the correct ID
        const salonData = await getSalonDetails(params.idOrSlug);
        setSalon(salonData);
          // Ensure URL uses the current username
        if (salonData?.username) {
          ensureSalonUrlUsesUsername(salonData.username, router);
        }
        
        // Redirect if no check-in data or wrong salon
        if (!checkInPhone || checkInShopId !== salonData.id.toString()) {
          router.push(`/salons/${salonData.username}`);
          return;
        }
        
        // Now fetch queue status using the salon's numeric ID
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/queue/check-status?phone=${checkInPhone}&business_id=${salonData.id}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch status');
        }

        // Map API response fields to match our interface
        setStatus({
          position: data.position_in_queue,
          estimated_wait_time: data.estimated_wait_time,
          status: data.status,
          checked_in_at: data.check_in_time,
          full_name: data.full_name,
          barber_name: data.barber_name, 
          service_name: data.service_name
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      } finally {
        setLoading(false);
      }
    };

    fetchSalonAndStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchSalonAndStatus, 30000);
    return () => clearInterval(interval);
  }, [params.idOrSlug, router]);

  const handleLeaveQueue = async () => {
    const checkInPhone = localStorage.getItem('checkInPhone');
    const checkInShopId = localStorage.getItem('checkInShopId');

    if (checkInPhone && checkInShopId && salon) {
      setIsLeaving(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/queue/leave?phone=${checkInPhone}&business_id=${checkInShopId}`,
          { method: "DELETE" }
        );
        const data = await response.json();

        if (response.ok) {
          toast.success(data.message || "Successfully left the queue");
          localStorage.removeItem('checkInPhone');
          localStorage.removeItem('checkInShopId');
          router.push(`/salons/${salon.username}/check-in`);
        } else {
          throw new Error(data.message || 'Failed to leave the queue');
        }
      } catch (err) {
        toast.error('Error: ' + (err instanceof Error ? err.message : 'Failed to leave the queue'));
      } finally {
        setIsLeaving(false);
        setIsLeaveDialogOpen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div className="animate-pulse">Loading status...</div>
      </div>
    );
  }

  if (error || !status || !salon) {
    return (
      <div className="container py-8 text-center">
        <div className="text-red-500">{error || 'Status not found'}</div>
        <Button 
          className="mt-4" 
          onClick={() => router.push(`/salons/${params.idOrSlug}/check-in`)}
        >
          Return to Check-in
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-8"
    >
      <Card className="p-8 max-w-2xl mx-auto shadow-lg rounded-lg">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Queue Status</h1>
            <p className="text-muted-foreground">
              Welcome, {status.full_name}
            </p>
          </div>

          <div className="grid gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Current Position</h3>
                    <p className="text-3xl font-bold text-primary">
                      #{status.position}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estimated Wait</p>
                  <p className="text-2xl font-semibold">
                    {status.estimated_wait_time} mins
                  </p>
                </div>
              </div>
            </Card>

            {(status.barber_name || status.service_name) && (
              <Card className="p-6">
                <div className="space-y-4">
                  {status.barber_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Selected Barber</p>
                        <p className="font-medium">{status.barber_name}</p>
                      </div>
                    </div>
                  )}
                  {status.service_name && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Selected Service</p>
                        <p className="font-medium">{status.service_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsLeaveDialogOpen(true)}
              disabled={isLeaving}
            >
              {isLeaving ? "Leaving Queue..." : "Leave Queue"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Leave Queue Confirmation Dialog */}
      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Queue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave the queue? You will lose your current position.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveQueue}
              disabled={isLeaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLeaving ? "Leaving..." : "Leave Queue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
} 