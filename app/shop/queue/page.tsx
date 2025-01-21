"use client";

import { useState, useEffect } from "react";
import { getShops } from "@/lib/services/shopService";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Shop } from "@/types/shop";

export default function QueuePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

            {/* Queue content will be added here based on selected shop */}
            {selectedShopId && (
              <div className="mt-6">
                {/* We'll add queue-specific content here in the next iteration */}
                <p className="text-muted-foreground">
                  Selected shop ID: {selectedShopId}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
} 