"use client";

import { useState, useEffect } from "react";
import { getShops } from "@/lib/services/shopService";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Shop } from "@/types/shop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "next-auth/react";
import { handleUnauthorizedResponse } from "@/lib/utils/auth-utils";

interface QueueItem {
  id: number;
  full_name: string;
  phone_number: string;
  status: string;
  check_in_time: string;
  service_start_time: string | null;
  service_end_time: string | null;
}

function QueueSection({ items }: { items: QueueItem[] }) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{item.full_name}</p>
              <p className="text-sm text-muted-foreground">{item.phone_number}</p>
            </div>
            <div className="text-sm text-right">
              <p>Check-in: {formatTime(item.check_in_time)}</p>
            </div>
          </div>
        </Card>
      ))}
      {items.length === 0 && (
        <p className="text-muted-foreground text-center py-4">No customers in queue</p>
      )}
    </div>
  );
}

export default function QueuePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<QueueItem[]>([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const data = await getShops();
        setShops(data);
        if (data.length > 0) {
          setSelectedShopId(data[0].id.toString());
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch shops";
        setError(errorMessage);
        console.error("Error fetching shops:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, []);

  useEffect(() => {
    const fetchQueueData = async () => {
      if (!selectedShopId) return;
      
      try {
        const session = await getSession();
        
        if (!session?.user?.accessToken) {
          await handleUnauthorizedResponse();
          throw new Error("No access token found. Please login again.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedShopId}/queue/`,
          {
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 401) {
          await handleUnauthorizedResponse();
          throw new Error("Session expired");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch queue data");
        }

        const data = await response.json();
        setQueueData(data);
      } catch (error) {
        if (error instanceof Error && error.message === "Session expired") {
          throw error;
        }
        console.error('Error fetching queue data:', error);
        setError('Failed to fetch queue data. Please try again.');
      }
    };

    fetchQueueData();
  }, [selectedShopId]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">Loading shops...</div>
      </div>
    );
  }

  if (error) {
    return <div className="container py-8 text-red-500">{error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-8"
    >
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Queue Management</h1>
        
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="shop-select" className="text-sm font-medium">
                Select Shop
              </label>
              <Select
                value={selectedShopId}
                onValueChange={(value) => setSelectedShopId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedShopId && (
              <div className="mt-6">
                <Tabs defaultValue="queue" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="queue">Queue</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  <TabsContent value="queue">
                    <QueueSection 
                      items={queueData.filter(item => 
                        !item.service_start_time && !item.service_end_time
                      )} 
                    />
                  </TabsContent>
                  <TabsContent value="appointments">
                    <QueueSection 
                      items={queueData.filter(item => 
                        item.service_start_time && !item.service_end_time
                      )} 
                    />
                  </TabsContent>
                  <TabsContent value="completed">
                    <QueueSection 
                      items={queueData.filter(item => 
                        item.service_end_time
                      )} 
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
} 