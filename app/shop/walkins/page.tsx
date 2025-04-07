"use client";

import { useEffect, useState } from "react";

const WalkInsPage = () => {
  // State for date and time
  const [dateTime, setDateTime] = useState({
    date: "",
    time: ""
  });

  // Dummy data for walk-ins queue
  const walkIns = [
    { id: 1, name: "Asa C." },
    { id: 2, name: "Ignacio R." },
    // You can add more dummy entries as needed
  ];

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      {/* Shop name header */}
      <div className="mb-8 text-center w-full">
        <h1 className="text-4xl font-bold mb-2">Supreme Cuts Barber Shop</h1>
        <p className="text-xl text-gray-400">Walk-In Queue</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-7xl">
        {/* Left side - Walk-ins Queue */}
        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-800">
          <div className="bg-gray-800 p-6">
            <h2 className="text-3xl font-bold text-white">Current Queue</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {walkIns.map((customer) => (
              <div 
                key={customer.id} 
                className="p-6 flex items-center"
              >
                <div className="text-4xl font-bold mr-6 text-blue-500 w-12">
                  {customer.id}.
                </div>
                <div className="text-3xl font-medium text-white">
                  {customer.name}
                </div>
              </div>
            ))}
            {walkIns.length === 0 && (
              <div className="p-10 text-center text-gray-400 text-2xl">
                No customers waiting
              </div>
            )}
          </div>
        </div>

        {/* Right side - Advertisement */}
        <div className="bg-blue-600 rounded-lg overflow-hidden shadow-xl">
          <div className="p-8 h-full flex flex-col">
            <div className="space-y-2 mb-auto">
              <h2 className="text-5xl font-bold leading-tight">Get 40% OFF</h2>
              <h3 className="text-4xl font-bold">JBL Audio</h3>
            </div>
            
            <div className="flex justify-center items-center my-8">
              <div className="relative w-64 h-64">
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center relative">
                  {/* Circular glow effect */}
                  <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 opacity-80"
                    style={{ 
                      filter: "blur(4px)",
                    }}
                  />
                  
                  {/* Inner circle for the JBL speaker appearance */}
                  <div className="absolute w-36 h-36 rounded-full bg-gray-900 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-4 border-gray-800 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                      <div className="w-10 h-10 bg-orange-600 text-white rounded flex items-center justify-center z-20">
                        <span className="text-lg font-bold">JBL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm opacity-70 text-center">
              *while supplies last. Excludes clearance items. Not combinable with certain offers/deals.
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with date and time */}
      <div className="mt-8 text-xl text-gray-400 flex justify-between w-full max-w-7xl">
        <div>{dateTime.date}</div>
        <div>{dateTime.time}</div>
      </div>
    </div>
  );
};

export default WalkInsPage; 