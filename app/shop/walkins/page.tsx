import { Card } from "@/components/ui/card";

const WalkInsPage = () => {
  // Dummy data for walk-ins queue
  const walkIns = [
    { id: 1, name: "Asa C." },
    { id: 2, name: "Ignacio R." },
    // You can add more dummy entries as needed
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Left side - Walk-ins Queue */}
        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
          <div className="bg-gray-800 p-4">
            <h2 className="text-xl text-white font-semibold">Walk-Ins</h2>
          </div>
          <div>
            {walkIns.map((customer) => (
              <div 
                key={customer.id} 
                className="p-4 border-b border-gray-600 flex items-center"
                style={{ background: "rgba(200, 200, 200, 0.2)" }}
              >
                <div className="text-gray-100 font-medium">
                  {customer.id}. {customer.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Advertisement */}
        <div className="bg-blue-500 rounded-lg overflow-hidden text-white relative shadow-lg">
          <div className="p-6 h-full flex flex-col">
            <div className="space-y-1 mb-auto">
              <h2 className="text-5xl font-bold leading-none">Get 40% OFF</h2>
              <h3 className="text-4xl font-bold">JBL Audio</h3>
            </div>
            
            <div className="flex justify-center items-center mb-4">
              <div className="relative w-60 h-60">
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center relative">
                  {/* Circular glow effect */}
                  <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 opacity-80"
                    style={{ 
                      filter: "blur(2px)",
                    }}
                  />
                  
                  {/* Inner circle for the JBL speaker appearance */}
                  <div className="absolute w-36 h-36 rounded-full bg-gray-900 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-4 border-gray-800 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 flex items-center justify-center">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded flex items-center justify-center z-20">
                        <span className="text-xs font-bold">JBL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs opacity-70 mt-2">
              *while supplies last. Excludes clearance items. Not combinable with certain offers/deals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkInsPage; 