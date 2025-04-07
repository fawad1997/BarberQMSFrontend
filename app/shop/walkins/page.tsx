"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Store, Building2, AlertTriangle } from "lucide-react";
import { getShops } from "@/lib/services/shopService";
import { Shop } from "@/types/shop";

const WalkInsPage = () => {
  // State for date and time
  const [dateTime, setDateTime] = useState({
    date: "",
    time: ""
  });
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dummy data for queue with both walk-ins and appointments
  const queueItems = [
    { id: 1, name: "Asa C.", type: "walk-in" },
    { id: 2, name: "Ignacio R.", type: "walk-in" },
    { id: 3, name: "Emily S.", type: "appointment" },
    { id: 4, name: "Michael J.", type: "walk-in" },
    { id: 5, name: "Sarah P.", type: "appointment" },
    { id: 6, name: "David W.", type: "walk-in" },
    { id: 7, name: "Jennifer K.", type: "appointment" },
    { id: 8, name: "Carlos M.", type: "walk-in" },
    // You can add more dummy entries as needed
  ];

  // Fetch shops data using shopService
  useEffect(() => {
    const fetchShopsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the shopService getShops function
        const shopsData = await getShops();
        setShops(shopsData);
        
        // Auto-select the first shop if available
        if (shopsData.length > 0 && !selectedShopId) {
          setSelectedShopId(shopsData[0].id.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching shops:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShopsData();
  }, []);

  // Update date and time
  useEffect(() => {
    function updateDateTime() {
      const now = new Date();
      const options = { 
        weekday: 'long' as const, 
        year: 'numeric' as const, 
        month: 'long' as const, 
        day: 'numeric' as const 
      };
      setDateTime({
        date: now.toLocaleDateString('en-US', options),
        time: now.toLocaleTimeString('en-US')
      });
    }
    
    // Update immediately and then every second
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Function to fetch queue data for the selected shop (will be implemented later)
  const fetchQueueDataForShop = async (shopId: string) => {
    // This will be implemented to fetch real data from the API
    console.log(`Fetching queue data for shop ID: ${shopId}`);
    // For now, we're using dummy data
  };

  // When selectedShopId changes, fetch the queue data for that shop
  useEffect(() => {
    if (selectedShopId) {
      fetchQueueDataForShop(selectedShopId);
    }
  }, [selectedShopId]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-black text-white p-6">
      {/* Shop name header */}
      <div className="w-full text-center mb-6">
        <h1 className="text-4xl font-bold mb-2">Supreme Cuts Barber Shop</h1>
        <p className="text-xl text-blue-400 font-semibold">Customer Queue</p>
      </div>
      
      {/* Shop selector */}
      <Card className="w-full max-w-4xl p-4 bg-gray-900 border-gray-800 mb-6">
        {error ? (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Error loading shops</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <label htmlFor="shop-select" className="text-sm font-medium flex items-center gap-1.5 text-gray-300">
              <Store className="h-4 w-4 text-gray-400" />
              Select Shop
            </label>
            <Select
              value={selectedShopId}
              onValueChange={(value) => setSelectedShopId(value)}
              disabled={isLoading || shops.length === 0}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder={isLoading ? "Loading shops..." : shops.length === 0 ? "No shops available" : "Select a shop"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id.toString()} className="text-white hover:bg-gray-700">
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>
      
      {/* Enhanced queue display */}
      <div className="w-full max-w-4xl mb-auto">
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Current Queue
            </h2>
          </div>
          
          <div>
            {queueItems.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {queueItems.map((customer) => (
                  <div 
                    key={customer.id} 
                    className={`p-4 flex items-center justify-between transition-colors duration-300 ${
                      customer.type === "appointment" 
                        ? "bg-blue-900/30 hover:bg-blue-900/50" 
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-4 text-blue-500 w-8 text-center">
                        {customer.id}.
                      </div>
                      <div className="text-xl font-medium text-white">
                        {customer.name}
                      </div>
                    </div>
                    
                    <div 
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        customer.type === "appointment" 
                          ? "bg-blue-600 text-blue-100" 
                          : "bg-green-600 text-green-100"
                      }`}
                    >
                      {customer.type === "appointment" ? "Appointment" : "Walk-in"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-2xl text-gray-400">No customers waiting</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="w-full max-w-4xl flex justify-center gap-6 mt-4 mb-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
          <span className="text-sm text-gray-300">Walk-in</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
          <span className="text-sm text-gray-300">Appointment</span>
        </div>
      </div>
      
      {/* Footer with date and time */}
      <div className="mt-4 text-xl w-full max-w-4xl flex justify-between items-center border-t border-gray-800 pt-4">
        <div className="text-blue-300 font-medium">{dateTime.date}</div>
        <div className="text-2xl font-bold text-white">{dateTime.time}</div>
      </div>
    </div>
  );
};

export default WalkInsPage; 