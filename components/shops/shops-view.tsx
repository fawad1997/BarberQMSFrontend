"use client";

import { useState, useEffect } from "react";
import { getShops } from "@/lib/services/shopService";
import { Shop } from "@/types/shop";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Trash2, AlertTriangle, Edit, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DeleteShopDialog } from "./delete-shop-dialog";
import { EditShop } from "./Edit-shop-dialog"; 
import { ShopQRCodeModal } from "./ShopQRCodeModal";
import { ApiError } from "@/components/ui/api-error";
import { testApiConnection } from "@/lib/utils/api-config";

export default function ShopsView() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string | null>(null);  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);

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

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setErrorCode(null);
        console.log("Fetching shops...");
        const data = await getShops(false);
        console.log("Shops fetched successfully:", data);
        setShops(data);
      } catch (error) {
        console.error("Error fetching shops:", error);
        
        if (error instanceof Error) {
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
  }, []);

  // Handle delete click
  const handleDeleteClick = (shop: Shop) => {
    setSelectedShop(shop);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete completion
  const handleDeleteComplete = () => {
    if (selectedShop) {
      setShops((currentShops) =>
        currentShops.filter((shop) => shop.id !== selectedShop.id)
      );
    }
  };

  const handleRetry = () => {
    // Simply force a refresh
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    
    const fetchShopsAgain = async () => {
      try {
        const data = await getShops(false);
        setShops(data);
      } catch (error) {
        console.error("Error retrying fetch shops:", error);
        
        if (error instanceof Error) {
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
    
    fetchShopsAgain();
  };

  // Handle edit click (Opens Edit Form)
  const handleEditClick = (shop: Shop) => {
    setSelectedShop(shop);
    setIsEditDialogOpen(true);
  };
  // Handle edit completion (Updates shop in UI)
  const handleEditComplete = (updatedShop: Shop) => {
    setShops((currentShops) =>
      currentShops.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop))
    );
    setIsEditDialogOpen(false);
    setSelectedShop(null);
  };

  // Handle QR code click
  const handleQRCodeClick = (shop: Shop) => {
    setSelectedShop(shop);
    setIsQRCodeModalOpen(true);
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
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
              >
                Retry Connection
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
        <Button 
          onClick={() => router.push("/shop/shops/create")}
          className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Create New Shop
        </Button>
      </div>

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
              <Card key={shop.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-primary">{shop.name}</h3>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                        onClick={() => handleQRCodeClick(shop)}
                        title="View QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEditClick(shop)}
                        title="Edit Shop"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClick(shop)}
                        title="Delete Shop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${shop.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {shop.is_open ? 'Open Now' : 'Closed'}
                    </span>
                    <span className="text-xs text-muted-foreground">{shop.formatted_hours}</span>
                  </div>
                </div>
                
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        {shop.address}, {shop.city}, {shop.state} {shop.zip_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{shop.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{shop.email}</span>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Wait Time:</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-sm bg-primary/10 px-2 py-1 rounded">
                          Current: {shop.estimated_wait_time} min
                        </span>
                        <span className="text-sm bg-secondary/10 px-2 py-1 rounded">
                          Avg: {shop.average_wait_time} min
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>

      {/* Delete Dialog */}
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
      )}      {/* Edit Dialog */}
      {selectedShop && isEditDialogOpen && (
  <EditShop
    isOpen={isEditDialogOpen}
    onClose={() => {
      setIsEditDialogOpen(false);
      setSelectedShop(null);
    }}
    shopId={selectedShop.id.toString()}
    initialData={selectedShop}
    onEditComplete={handleEditComplete}
  />
)}      {/* QR Code Modal */}
      {selectedShop && (
        <ShopQRCodeModal
          isOpen={isQRCodeModalOpen}
          onClose={() => {
            setIsQRCodeModalOpen(false);
            setSelectedShop(null);
          }}
          shopUsername={selectedShop.username || selectedShop.slug || `shop-${selectedShop.id}`}
          shopName={selectedShop.name}
        />
      )}

    </div>
  );
}