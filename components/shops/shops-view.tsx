"use client";

import { useState, useEffect } from "react";
import { getShops } from "@/lib/services/shopService";
import { Shop } from "@/types/shop";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DeleteShopDialog } from "./delete-shop-dialog";
import { ApiError } from "@/components/ui/api-error";
import { testApiConnection } from "@/lib/utils/api-config";

export default function ShopsView() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [usingFallbackApi, setUsingFallbackApi] = useState(false);

  // Check API connectivity
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const result = await testApiConnection();
        setNetworkStatus(result.message);
        console.log('API connection test:', result);
      } catch (error) {
        console.error('API connectivity test failed:', error);
        setNetworkStatus('API connectivity test failed');
      }
    };
    
    checkApiConnection();
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setErrorCode(null);
        console.log("Fetching shops...");
        const data = await getShops(usingFallbackApi);
        console.log("Shops fetched successfully:", data);
        setShops(data);
      } catch (error) {
        console.error("Error fetching shops:", error);
        
        if (error instanceof Error) {
          // Check if it's a network error and we haven't tried the fallback yet
          if (error.name === 'NetworkError' && !usingFallbackApi) {
            console.log("Network error detected, trying fallback API...");
            setUsingFallbackApi(true);
            // Don't set error yet, we'll try the fallback API in the next render
            return;
          }
          
          setError(error);
          // Check if it's an API error with status code
          if ('status' in error && typeof error.status === 'number') {
            setErrorCode(error.status);
          }
        } else {
          setError(new Error('An unknown error occurred'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, [usingFallbackApi]);

  const handleDeleteClick = (shop: Shop) => {
    setSelectedShop(shop);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteComplete = () => {
    if (selectedShop) {
      setShops((currentShops) =>
        currentShops.filter((shop) => shop.id !== selectedShop.id)
      );
    }
  };

  const handleRetry = () => {
    // Reset fallback flag to try the primary API first
    setUsingFallbackApi(false);
  };

  if (isLoading) {
    return <div className="container py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container py-8">
        <ApiError
          title="Failed to Load Shops"
          message={error.message}
          statusCode={errorCode || undefined}
          error={error}
          onRetry={handleRetry}
        />
        
        {networkStatus && (
          <div className="mt-4 p-4 border rounded-md bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="font-medium">Network Diagnostics</h3>
            </div>
            <p className="text-sm mb-2">{networkStatus}</p>
            <p className="text-xs opacity-80 mb-2">
              API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set in environment'}
            </p>
            {usingFallbackApi && (
              <p className="text-xs opacity-80">Using fallback API endpoint.</p>
            )}
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setUsingFallbackApi(!usingFallbackApi)}
              >
                {usingFallbackApi 
                  ? "Try Primary API Again" 
                  : "Try Alternative API Endpoint"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Shops</h1>
        <Button onClick={() => router.push("/shop/shops/create")}>
          Create New Shop
        </Button>
      </div>
      
      {usingFallbackApi && (
        <div className="mb-6 p-3 text-sm bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p>Using alternative API endpoint. Network connectivity issues detected with primary API.</p>
          </div>
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shops.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground mb-4">You don't have any shops yet.</p>
              <Button onClick={() => router.push("/shop/shops/create")}>
                Create Your First Shop
              </Button>
            </div>
          ) : (
            shops.map((shop) => (
              <Card key={shop.id}>
                <CardHeader className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-gray-500 hover:text-red-600"
                    onClick={() => handleDeleteClick(shop)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <CardTitle>{shop.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {shop.address}, {shop.city}, {shop.state} {shop.zip_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{shop.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{shop.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Average Wait Time: {String(shop.average_wait_time || 0)} minutes
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>

      {selectedShop && (
        <DeleteShopDialog
          shopId={selectedShop.id.toString()}
          shopName={selectedShop.name}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedShop(null);
          }}
          onDelete={handleDeleteComplete}
        />
      )}
    </div>
  );
}
