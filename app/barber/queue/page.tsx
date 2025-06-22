"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  User, 
  UserIcon, 
  Users, 
  Clock, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  CalendarClock, 
  RefreshCcw, 
  Calendar, 
  MoreHorizontal,   Loader2, 
  AlertCircle, 
  Timer
} from "lucide-react";
import { getApiEndpoint } from "@/lib/utils/api-config";
import { handleUnauthorizedResponse } from "@/lib/utils/auth-utils";
import { convertFormattedHoursToUserTimezone } from "@/lib/utils/timezone";

// Types
interface QueueItem {
  id: number;
  shop_id: number;
  full_name: string;
  phone_number: string;
  status: string;
  position_in_queue: number;
  check_in_time: string;
  service_start_time: string | null;
  service_end_time: string | null;
  number_of_people: number;
  barber?: {
    id: number;
    full_name: string;
    status: string;
  } | null;
  service?: {
    id: number;
    name: string;
    duration: number;
    price: number;
  } | null;
}

interface Appointment {
  id: number;
  shop_id: number;
  barber_id: number | null;
  service_id: number | null;
  appointment_time: string;
  number_of_people: number;
  status: string;
  created_at: string;
  full_name: string;
  phone_number: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  barber?: {
    id: number;
    status: string;
    full_name: string;
    phone_number: string;
    email: string;
  } | null;
  service?: {
    id: number;
    name: string;
    duration: number;
    price: number;
  } | null;
}

interface BarberShopInfo {
  id: number;
  name: string;
  formatted_hours: string;
  is_open: boolean;
  estimated_wait_time: number;
}

export default function BarberQueuePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState("waiting");
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [completedItems, setCompletedItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState<BarberShopInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const webSocketRef = useRef<WebSocket | null>(null);

  // Fetch barber's shop data
  useEffect(() => {
    const fetchBarberShopData = async () => {
      if (sessionStatus !== 'authenticated' || !session) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get barber profile which includes their shop_id
        const profileResponse = await fetch('/api/barber/profile', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            handleUnauthorizedResponse();
            return;
          }
          throw new Error('Failed to fetch barber profile');
        }
          const profile = await profileResponse.json();
        
        if (!profile.shop_id) {
          setError('No shop found for this barber. Please contact your shop owner.');
          setIsLoading(false);
          return;
        }
        
        // Set shop information from the profile response
        setShopInfo({
          id: profile.shop.id,
          name: profile.shop.name,
          formatted_hours: profile.shop.formatted_hours || 'Not available',
          is_open: profile.shop.is_open || false,
          estimated_wait_time: profile.shop.estimated_wait_time || 0
        });
        
        // Fetch initial queue data
        await fetchQueueData(profile.shop_id);
        
        // Setup WebSocket connection for real-time updates
        setupWebSocket(profile.shop_id);
        
      } catch (err) {
        console.error('Error fetching barber shop data:', err);
        setError('Could not load shop data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBarberShopData();
    
    // Clean up WebSocket connection on unmount
    return () => {
      if (webSocketRef.current && webSocketRef.current.readyState !== WebSocket.CLOSED) {
        webSocketRef.current.close();
      }
    };
  }, [session, sessionStatus]);

  // Setup WebSocket for real-time updates
  const setupWebSocket = (shopId: number) => {
    // Get the websocket URL from the environment or API URL
    const apiUrl = getApiEndpoint('');
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `ws/queue/${shopId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      
      // Connection opened
      ws.addEventListener('open', () => {
        console.log('WebSocket connection established');
        setIsWebSocketConnected(true);
      });
      
      // Listen for messages
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'queue_update') {
            processQueueData(data.queue_items, data.appointments, data.completed_items);
          } else if (data.type === 'new_entry') {
            // Handle new queue entry
            setQueueItems(prevItems => {
              const updatedItems = [...prevItems];
              const existingIndex = updatedItems.findIndex(item => item.id === data.queue_item.id);
              
              if (existingIndex >= 0) {
                updatedItems[existingIndex] = data.queue_item;
              } else {
                updatedItems.push(data.queue_item);
              }
              
              return updatedItems;
            });
          } else if (data.type === 'appointment_update') {
            // Handle appointment updates
            setAppointments(data.appointments || []);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      // Connection closed
      ws.addEventListener('close', (event) => {
        console.log('WebSocket connection closed:', event);
        setIsWebSocketConnected(false);
        
        // Attempt to reconnect after a delay
        if (!event.wasClean) {
          setTimeout(() => setupWebSocket(shopId), 5000);
        }
      });
      
      // Connection error
      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setIsWebSocketConnected(false);
      });
      
    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
      setIsWebSocketConnected(false);
    }
  };
  // Fetch queue data from API (used for initial load and fallback)
  const fetchQueueData = async (shopId: number) => {
    try {
      const response = await fetch(`/api/barber/queue`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorizedResponse();
          return;
        }
        throw new Error('Failed to fetch queue data');
      }
      
      const data = await response.json();
      processQueueData(data.queue_items || [], data.appointments || [], data.completed_items || []);
      
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setError('Could not load queue data. Please try again later.');
    }
  };
  
  // Process and categorize queue data
  const processQueueData = (
    queueItems: QueueItem[], 
    appointments: Appointment[], 
    completedItems: QueueItem[]
  ) => {
    // Sort by position in queue
    const sortedQueueItems = [...queueItems].sort(
      (a, b) => a.position_in_queue - b.position_in_queue
    );
    
    setQueueItems(sortedQueueItems);
    setAppointments(appointments);
    setCompletedItems(completedItems);
  };
  
  // Function to refresh queue data manually
  const refreshQueueData = async () => {
    if (!shopInfo?.id) return;
    
    setIsLoading(true);
    await fetchQueueData(shopInfo.id);
    setIsLoading(false);
  };
  
  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    if (isWebSocketConnected || !shopInfo?.id) return;
    
    const intervalId = setInterval(() => {
      fetchQueueData(shopInfo.id);
    }, 10000); // Poll every 10 seconds as fallback
    
    return () => clearInterval(intervalId);
  }, [isWebSocketConnected, shopInfo]);
  // Function to update client status
  const updateClientStatus = async (clientId: number, newStatus: string) => {
    if (!shopInfo?.id) return;
    
    try {
      const response = await fetch(`/api/barber/queue/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update client status');
      }
      
      // Refresh queue data after status update
      refreshQueueData();
      
    } catch (err) {
      console.error('Error updating client status:', err);
      setError('Failed to update client status. Please try again.');
    }
  };
  
  // Calculate estimated service time for clients in queue
  const calculateEstimatedTime = (position: number) => {
    if (!shopInfo) return 'Unknown';
    
    const averageServiceTime = shopInfo.estimated_wait_time || 15; // Default to 15 minutes
    const estimatedWaitMinutes = position * averageServiceTime;
    
    if (estimatedWaitMinutes < 60) {
      return `${estimatedWaitMinutes} mins`;
    } else {
      const hours = Math.floor(estimatedWaitMinutes / 60);
      const mins = estimatedWaitMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid time';
    }
  };

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading queue data...</p>
        </div>
      </div>
    );
  }
  
  if (sessionStatus !== 'authenticated') {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            You must be logged in to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={refreshQueueData} 
          className="mt-4"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Queue Management</h1>
        <Button 
          onClick={refreshQueueData}
          variant="outline"
          className="flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>
      
      {shopInfo && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${shopInfo.is_open ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <Clock className={`h-5 w-5 ${shopInfo.is_open ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <h3 className={`font-medium ${shopInfo.is_open ? 'text-green-500' : 'text-red-500'}`}>
                    {shopInfo.name} - {shopInfo.is_open ? 'Currently Open' : 'Currently Closed'}
                  </h3>                  <p className="text-sm text-muted-foreground">
                    Business Hours: {convertFormattedHoursToUserTimezone(shopInfo.formatted_hours, shopInfo.timezone)} 
                    <span className="text-xs opacity-75 block">(Your time)</span>
                  </p>
                </div>
              </div>
              {shopInfo.is_open && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Timer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Average Wait Time</h3>
                    <p className="text-sm text-muted-foreground">
                      {shopInfo.estimated_wait_time} minutes per client
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isWebSocketConnected && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <RefreshCcw className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Real-time updates temporarily unavailable</AlertTitle>
          <AlertDescription className="text-amber-700">
            Using automatic refresh every 10 seconds instead. Queue data may not be immediately up-to-date.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="waiting" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Waiting ({queueItems.length})</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Appointments ({appointments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed ({completedItems.length})</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Waiting Queue */}
        <TabsContent value="waiting" className="space-y-4">
          {queueItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground/60 mb-3" />
                <h3 className="text-xl font-medium text-center">No clients in waiting queue</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  When clients check in, they will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {queueItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 text-primary flex items-center justify-center h-12 w-12 font-bold">
                              #{item.position_in_queue}
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{item.full_name}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Clock className="mr-1 h-3.5 w-3.5" />
                                  <span>Checked in: {formatTime(item.check_in_time)}</span>
                                </div>
                                {item.service && (
                                  <div className="flex items-center">
                                    <Scissors className="mr-1 h-3.5 w-3.5" />
                                    <span>{item.service.name} ({item.service.duration} min)</span>
                                  </div>
                                )}
                                {item.number_of_people > 1 && (
                                  <div className="flex items-center">
                                    <Users className="mr-1 h-3.5 w-3.5" />
                                    <span>Group of {item.number_of_people}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                            <div className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-medium flex items-center">
                              <Timer className="mr-1 h-3 w-3" />
                              Est. wait: {calculateEstimatedTime(item.position_in_queue)}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm"
                                variant="outline"
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                onClick={() => updateClientStatus(item.id, 'IN_SERVICE')}
                              >
                                <Scissors className="mr-1 h-3 w-3" />
                                Start
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => updateClientStatus(item.id, 'CANCELLED')}
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
        
        {/* Appointments */}
        <TabsContent value="appointments" className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground/60 mb-3" />
                <h3 className="text-xl font-medium text-center">No appointments scheduled for today</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  Upcoming appointments will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center h-12 w-12">
                          <CalendarClock className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{appointment.full_name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3.5 w-3.5" />
                              <span>Time: {formatTime(appointment.appointment_time)}</span>
                            </div>
                            {appointment.service && (
                              <div className="flex items-center">
                                <Scissors className="mr-1 h-3.5 w-3.5" />
                                <span>{appointment.service.name} ({appointment.service.duration} min)</span>
                              </div>
                            )}
                            {appointment.number_of_people > 1 && (
                              <div className="flex items-center">
                                <Users className="mr-1 h-3.5 w-3.5" />
                                <span>Group of {appointment.number_of_people}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <div className={`rounded-full px-3 py-1 text-xs font-medium flex items-center ${
                          appointment.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' :
                          appointment.status === 'CHECKED_IN' ? 'bg-green-50 text-green-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          <span>
                            {appointment.status === 'SCHEDULED' ? 'Scheduled' :
                             appointment.status === 'CHECKED_IN' ? 'Checked In' :
                             appointment.status}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {appointment.status === 'SCHEDULED' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => updateClientStatus(appointment.id, 'CHECKED_IN')}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Check In
                            </Button>
                          )}
                          {appointment.status === 'CHECKED_IN' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              onClick={() => updateClientStatus(appointment.id, 'IN_SERVICE')}
                            >
                              <Scissors className="mr-1 h-3 w-3" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Completed */}
        <TabsContent value="completed" className="space-y-4">
          {completedItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/60 mb-3" />
                <h3 className="text-xl font-medium text-center">No completed services today</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  Completed client services will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-100 text-green-700 flex items-center justify-center h-12 w-12">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{item.full_name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                            {item.service_start_time && (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3.5 w-3.5" />
                                <span>Started: {formatTime(item.service_start_time)}</span>
                              </div>
                            )}
                            {item.service_end_time && (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3.5 w-3.5" />
                                <span>Ended: {formatTime(item.service_end_time)}</span>
                              </div>
                            )}
                            {item.service && (
                              <div className="flex items-center">
                                <Scissors className="mr-1 h-3.5 w-3.5" />
                                <span>{item.service.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                          item.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {item.status === 'COMPLETED' ? 'Completed' : 
                           item.status === 'CANCELLED' ? 'Cancelled' : 
                           item.status}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
