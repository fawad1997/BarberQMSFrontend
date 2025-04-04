"use client";

import { useState, useEffect, useRef } from "react";
import { getShops } from "@/lib/services/shopService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Shop } from "@/types/shop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "next-auth/react";
import { handleUnauthorizedResponse } from "@/lib/utils/auth-utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  PlusCircle, 
  UserIcon, 
  Users, 
  Clock, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  CalendarClock, 
  RefreshCcw, 
  Calendar, 
  MoreHorizontal, 
  Loader2, 
  ArrowDown, 
  ArrowUp, 
  GripVertical, 
  Store, 
  Building2, 
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface Service {
  name: string;
  duration: number;
  price: number;
  id: number;
  shop_id: number;
}

interface Barber {
  id: number;
  user_id: number;
  shop_id: number;
  status: string;
  full_name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  services: Service[];
}

function SortableCard({ 
  item, 
  updatedPosition, 
  refreshQueue, 
  isCompleted = false,
  barbers = [],
  shopId = ""
}: { 
  item: QueueItem, 
  updatedPosition?: number,
  refreshQueue: () => Promise<void>,
  isCompleted?: boolean,
  barbers?: Barber[],
  shopId?: string
}) {
  // Determine if this card should be draggable (not completed, not cancelled, and not in completed section)
  const isDraggable = !isCompleted && item.status !== "COMPLETED" && item.status !== "CANCELLED";
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    disabled: !isDraggable
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  } : {};

  // Use the updatedPosition if provided, otherwise use the original position
  const displayPosition = updatedPosition !== undefined ? updatedPosition : item.position_in_queue;
  
  // Add state to track available services for the selected barber
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  
  // Update available services when barber changes
  useEffect(() => {
    if (item.barber && item.barber.id) {
      const selectedBarber = barbers.find(b => b.id === item.barber?.id);
      if (selectedBarber && selectedBarber.services) {
        setAvailableServices(selectedBarber.services);
      } else {
        setAvailableServices([]);
      }
    } else {
      setAvailableServices([]);
    }
  }, [barbers, item.barber]);

  // Handle barber assignment
  const handleBarberChange = async (barberId: string) => {
    if (isCompleted) return;
    
    try {
      const session = await getSession();
      
      if (!session?.user?.accessToken) {
        await handleUnauthorizedResponse();
        throw new Error("No access token found");
      }
      
      // If "none" is selected, use null for barber_id
      const barberIdValue = barberId === "none" ? null : parseInt(barberId);
      console.log(`Assigning barber ${barberIdValue} to queue item ${item.id}`);
      
      // Show a loading toast
      const toastId = toast.loading(`Assigning barber...`);
      
      // Use the specific barber endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/queue/${item.id}/barber`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            barber_id: barberIdValue
          })
        }
      );
      
      if (response.status === 401) {
        await handleUnauthorizedResponse();
        throw new Error("Session expired");
      }
      
      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = "Failed to assign barber";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            errorMessage = await response.text() || errorMessage;
          } catch (e2) {
            // If that fails too, just use generic message
          }
        }
        console.error(`API Error (${response.status}): ${errorMessage}`);
        
        // Dismiss the loading toast and show an error toast
        toast.dismiss(toastId);
        toast.error(`Failed: ${errorMessage}`, {
          duration: 4000,
        });
        
        throw new Error(errorMessage);
      }
      
      // Get the updated queue item from the response
      const updatedQueueItem = await response.json();
      console.log(`Successfully assigned barber`, updatedQueueItem);
      
      // Dismiss the loading toast
      toast.dismiss(toastId);
      
      // Refresh the queue data immediately to show the updated barber assignment
      await refreshQueue();
      
    } catch (error) {
      console.error("Error assigning barber:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Show error toast if not already shown
      toast.error(`Failed: ${errorMessage}`, {
        duration: 4000,
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Don't allow status changes in completed queue
    if (isCompleted) return;
    
    try {
      const session = await getSession();
      
      if (!session?.user?.accessToken) {
        await handleUnauthorizedResponse();
        throw new Error("No access token found");
      }
      
      console.log(`Sending status update request to shop_id: ${item.shop_id}, queue_id: ${item.id}, status: ${newStatus}`);
      
      // Show a loading toast
      const toastId = toast.loading(`Updating status to ${newStatus.toLowerCase()}...`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${item.shop_id}/queue/${item.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );
      
      if (response.status === 401) {
        await handleUnauthorizedResponse();
        throw new Error("Session expired");
      }
      
      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = "Failed to update status";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            errorMessage = await response.text() || errorMessage;
          } catch (e2) {
            // If that fails too, just use generic message
          }
        }
        console.error(`API Error (${response.status}): ${errorMessage}`);
        
        // Dismiss the loading toast and show an error toast
        toast.dismiss(toastId);
        toast.error(`Failed: ${errorMessage}`, {
          duration: 4000,
        });
        
        throw new Error(errorMessage);
      }
      
      // Success - the polling will update the UI
      console.log(`Successfully updated status to ${newStatus}`);
      
      // Dismiss the loading toast and show a success toast
      toast.dismiss(toastId);
      toast.success(`Status updated to ${newStatus.toLowerCase()}`, {
        duration: 3000,
      });
      
      // Refresh the queue data immediately
      await refreshQueue();
      
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Show error toast if not already shown
      toast.error(`Failed: ${errorMessage}`, {
        duration: 4000,
      });
    }
  };
  
  // Define status colors for visual cues
  const getStatusColor = (status: string) => {
    switch(status) {
      case "ARRIVED": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "CHECKED_IN": return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "IN_SERVICE": return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "COMPLETED": return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
      case "CANCELLED": return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };
  
  // Define status icon for visual cues
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "ARRIVED": return <UserIcon className="w-3.5 h-3.5" />;
      case "CHECKED_IN": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "IN_SERVICE": return <Scissors className="w-3.5 h-3.5" />;
      case "COMPLETED": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "CANCELLED": return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  // Update the handleServiceChange function to use a specific service endpoint
  const handleServiceChange = async (serviceId: string) => {
    if (isCompleted) return;
    
    try {
      const session = await getSession();
      
      if (!session?.user?.accessToken) {
        await handleUnauthorizedResponse();
        throw new Error("No access token found");
      }
      
      // If "none" is selected, use null for service_id
      const serviceIdValue = serviceId === "none" ? null : parseInt(serviceId);
      console.log(`Assigning service ${serviceIdValue} to queue item ${item.id}`);
      
      // Show a loading toast
      const toastId = toast.loading(`Assigning service...`);
      
      // Use the specific service endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/queue/${item.id}/service`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: serviceIdValue
          })
        }
      );
      
      if (response.status === 401) {
        await handleUnauthorizedResponse();
        throw new Error("Session expired");
      }
      
      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = "Failed to assign service";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            errorMessage = await response.text() || errorMessage;
          } catch (e2) {
            // If that fails too, just use generic message
          }
        }
        console.error(`API Error (${response.status}): ${errorMessage}`);
        
        // Dismiss the loading toast and show an error toast
        toast.dismiss(toastId);
        toast.error(`Failed: ${errorMessage}`, {
          duration: 4000,
        });
        
        throw new Error(errorMessage);
      }
      
      // Get the updated queue item from the response
      const updatedQueueItem = await response.json();
      console.log(`Successfully assigned service`, updatedQueueItem);
      
      // Dismiss the loading toast
      toast.dismiss(toastId);
      
      // Refresh the queue data immediately to show the updated service assignment
      await refreshQueue();
      
    } catch (error) {
      console.error("Error assigning service:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Show error toast if not already shown
      toast.error(`Failed: ${errorMessage}`, {
        duration: 4000,
      });
    }
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      {...(isDraggable ? attributes : {})} 
      {...(isDraggable ? listeners : {})}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      layout
      className="mb-3"
    >
      <Card className={cn(
        "p-4 border transition-all dark:border-gray-800",
        isDraggable && "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md",
        isDragging && "shadow-lg border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20",
        !isCompleted && item.status === "IN_SERVICE" && "border-l-4 border-l-purple-500 dark:border-l-purple-600"
      )}>
        <div className="space-y-3">
          <div className="flex justify-between items-start border-b pb-2 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg flex items-center">
                  {item.full_name}
                </h3>
                {/* Only show position for active queue items */}
                {isDraggable && (
                  <Badge variant="outline" className="flex items-center bg-blue-50 dark:bg-blue-900/20 gap-1 border-blue-200 dark:border-blue-800">
                    {isDraggable && <GripVertical className="h-3 w-3 text-blue-500 dark:text-blue-400" />}
                    <span>{displayPosition}</span>
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <UserIcon className="h-3 w-3 text-muted-foreground" /> 
                {item.phone_number}
              </p>
            </div>
            <div className="text-right">
              {isCompleted ? (
                // If in completed section, show status as non-editable badge
                <Badge className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-md border ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)} {item.status.replace("_", " ")}
                </Badge>
              ) : (
                // Otherwise show the editable dropdown
                <Select
                  value={item.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className={`h-8 w-36 border ${getStatusColor(item.status)}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARRIVED">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /> Arrived
                      </div>
                    </SelectItem>
                    <SelectItem value="CHECKED_IN">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Checked In
                      </div>
                    </SelectItem>
                    <SelectItem value="IN_SERVICE">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-purple-600 dark:text-purple-400" /> In Service
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /> Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" /> Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Check-in Time
              </p>
              <p className="font-medium">{new Date(item.check_in_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" /> Party Size
              </p>
              <p className="font-medium">{item.number_of_people} {item.number_of_people === 1 ? 'person' : 'people'}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-muted-foreground" /> Barber
              </p>
              {isCompleted || barbers.length === 0 ? (
                <p className="font-medium">
                  {item.barber ? (
                    <span className="flex items-center gap-1">
                      {item.barber.full_name}
                      <span className={`w-2 h-2 rounded-full ${
                        item.barber.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </span>
                  ) : 'Not assigned'}
                </p>
              ) : (
                <Select
                  value={item.barber?.id?.toString() || "none"}
                  onValueChange={handleBarberChange}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="Assign barber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id.toString()}>
                        <div className="flex items-center gap-1">
                          {barber.full_name}
                          <span className={`w-2 h-2 rounded-full ${
                            barber.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-muted-foreground" /> Service
              </p>
              {isCompleted || !item.barber?.id ? (
                <p className="font-medium">
                  {item.service ? (
                    <span>{item.service.name} ({item.service.duration} min - ${item.service.price})</span>
                  ) : 'Not selected'}
                </p>
              ) : availableServices.length === 0 ? (
                <p className="font-medium text-muted-foreground">No services available</p>
              ) : (
                <Select
                  value={item.service?.id?.toString() || "none"}
                  onValueChange={handleServiceChange}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No service</SelectItem>
                    {availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        <div className="whitespace-nowrap">
                          {service.name} ({service.duration} min - ${service.price})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function QueueSection({ 
  items, 
  shopId, 
  parentRefresh, 
  isCompleted = false,
  barbers = []
}: { 
  items: QueueItem[], 
  shopId: string, 
  parentRefresh: () => Promise<void>,
  isCompleted?: boolean,
  barbers?: Barber[]
}) {
  const [sortedItems, setSortedItems] = useState(items);
  const [tempPositions, setTempPositions] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  // Function to fetch queue data (just call parent refresh)
  const refreshQueue = async () => {
    try {
      setIsLoading(true);
      await parentRefresh();
    } catch (error) {
      console.error("Error refreshing queue data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag start to update temporary positions
  const handleDragStart = (event: any) => {
    setIsLoading(true);
  };
  
  // Handle drag movement to update temporary positions in real-time
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);
      
      // Create a temporary array with the new order
      const newOrder = arrayMove([...sortedItems], oldIndex, newIndex);
      
      // Calculate temporary positions for all items
      const newPositions: Record<number, number> = {};
      newOrder.forEach((item, index) => {
        newPositions[item.id] = index + 1;
      });
      
      setTempPositions(newPositions);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsLoading(false);
    setTempPositions({}); // Clear temporary positions

    if (over && active.id !== over.id) {
      try {
        const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
        const newIndex = sortedItems.findIndex((item) => item.id === over.id);

        // Create a new array with the updated order
        const newItems = arrayMove([...sortedItems], oldIndex, newIndex).map((item, index) => ({
          ...item,
          position_in_queue: index + 1 // Update the position property for each item
        }));

        // Update the UI immediately with correct positions
        setSortedItems(newItems);

        // Get session for authentication
        const session = await getSession();
        if (!session?.user?.accessToken) {
          await handleUnauthorizedResponse();
          throw new Error("No access token found");
        }

        // Create the reordered entries array with just the moved item
        const reorderedItems = [{
          queue_id: active.id as number,
          new_position: newIndex + 1 // API expects 1-based index
        }];

        console.log("Reordering queue with data:", {
          reordered_entries: reorderedItems,
          status: "CHECKED_IN"
        });

        // Make API call to update positions
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/queue/`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reordered_entries: reorderedItems,
              status: "CHECKED_IN" // Status must be uppercase
            })
          }
        );

        if (response.status === 401) {
          await handleUnauthorizedResponse();
          throw new Error("Session expired");
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          
          // Try to parse the error to make it more readable
          try {
            const jsonError = JSON.parse(errorText);
            console.error("Parsed API Error:", jsonError);
          } catch (e) {
            // If not JSON, just log the raw error
          }
          
          throw new Error(`Failed to update queue positions: ${errorText}`);
        }

      } catch (error) {
        console.error('Error updating queue positions:', error);
        // Revert the optimistic update on error
        setSortedItems(items);
        // Show error message to user
        toast.error('Failed to update queue positions. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-4 relative min-h-[150px]">
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/70 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 rounded-md"
        >
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Updating...</span>
          </div>
        </motion.div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {sortedItems.map((item) => (
              <SortableCard 
                key={item.id} 
                item={item} 
                updatedPosition={tempPositions[item.id]}
                refreshQueue={refreshQueue}
                isCompleted={isCompleted}
                barbers={barbers}
                shopId={shopId}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
      
      {items.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-center py-8 border rounded-md bg-gray-50/50 dark:bg-gray-900/50 border-dashed dark:border-gray-800"
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground/60" />
            <p>No customers in queue</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Card className="p-4 hover:shadow-md transition-all border dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700">
        <div className="space-y-3">
          <div className="flex justify-between items-start border-b pb-2 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{appointment.full_name}</h3>
                <Badge variant="outline" className={cn(
                  "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
                  appointment.status === "COMPLETED" && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
                  appointment.status === "CANCELLED" && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                )}>
                  {appointment.status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : 
                   appointment.status === "CANCELLED" ? <XCircle className="w-3 h-3 mr-1" /> : 
                   <Calendar className="w-3 h-3 mr-1" />}
                  {appointment.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <UserIcon className="h-3 w-3 text-muted-foreground" /> {appointment.phone_number}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <CalendarClock className="w-3 h-3" />
                {new Date(appointment.appointment_time).toLocaleString('en-US', {
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Created At
              </p>
              <p className="font-medium">{new Date(appointment.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" /> Party Size
              </p>
              <p className="font-medium">{appointment.number_of_people} {appointment.number_of_people === 1 ? 'person' : 'people'}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-muted-foreground" /> Barber
              </p>
              <p className="font-medium">
                {appointment.barber ? (
                  <span className="flex items-center gap-1">
                    {appointment.barber.full_name}
                    <span className={`w-2 h-2 rounded-full ${
                      appointment.barber.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </span>
                ) : 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-muted-foreground" /> Service
              </p>
              <p className="font-medium">
                {appointment.service ? (
                  <span>{appointment.service.name} ({appointment.service.duration} min - ${appointment.service.price})</span>
                ) : 'Not selected'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function AppointmentSection({ appointments, shopId, parentRefresh }: { 
  appointments: Appointment[], 
  shopId: string,
  parentRefresh?: () => Promise<void>
}) {
  const [sortedAppointments, setSortedAppointments] = useState<Appointment[]>(appointments);
  
  // Keep appointments in sync with props
  useEffect(() => {
    console.log(`Appointments prop updated with ${appointments.length} items`);
    setSortedAppointments(appointments);
  }, [appointments]);
  
  // Use parent refresh if provided, otherwise poll directly
  useEffect(() => {
    if (!shopId) return;
    
    // Set up regular polling as a backup
    const pollingInterval = setInterval(async () => {
      if (parentRefresh) {
        await parentRefresh();
      }
    }, 15000); // Poll every 15 seconds
    
    return () => clearInterval(pollingInterval);
  }, [shopId, parentRefresh]);

  return (
    <div className="space-y-4 min-h-[150px]">      
      <AnimatePresence mode="popLayout">
        {sortedAppointments.length > 0 ? (
          sortedAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-center py-8 border rounded-md bg-gray-50/50 dark:bg-gray-900/50 border-dashed dark:border-gray-800"
            key="empty-appointments"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <Calendar className="h-8 w-8 text-muted-foreground/60" />
              <p>No appointments scheduled</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoShopsState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-10 flex flex-col items-center justify-center text-center"
    >
      <div className="mb-8 bg-gray-50 dark:bg-gray-900 p-8 rounded-full">
        <Store
          className="w-24 h-24 text-blue-500/60 dark:text-blue-400/60"
          strokeWidth={1.5}
        />
      </div>
      <h2 className="text-2xl font-bold mb-3">No Shops Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        You haven't created any shops yet. Create a shop first to manage queue.
      </p>
      <Link href="/shop/shops/create">
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Your First Shop
        </Button>
      </Link>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-10 space-y-6"
    >
      <Skeleton className="mb-6 h-8 w-48" />
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400" />
              <span className="text-muted-foreground font-medium">Loading queue data...</span>
            </div>
          </div>
          <div className="mt-6">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function QueuePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [queueHistoryData, setQueueHistoryData] = useState<QueueItem[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<string>("main");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState<number>(0);
  const [shopBarbers, setShopBarbers] = useState<Barber[]>([]);

  // Function to refresh all queue data
  const refreshAllQueueData = async () => {
    if (!selectedShopId) return;
    
    try {
      console.log("Refreshing all queue data");
      await fetchQueueData();
      await fetchAppointmentsData();
      // Increment refresh trigger to force components to update
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error refreshing queue data:", error);
    }
  };

  // Function to fetch queue history data
  const fetchQueueHistoryData = async () => {
    if (!selectedShopId) return;
    
    try {
      setIsHistoryLoading(true); // Only set history loading to true
      const session = await getSession();
      
      if (!session?.user?.accessToken) {
        await handleUnauthorizedResponse();
        throw new Error("No access token found. Please login again.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedShopId}/queue/history`,
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
        throw new Error(errorData.message || "Failed to fetch queue history data");
      }

      const data = await response.json();
      console.log("Queue history data received:", data);
      
      // Add shop_id to each queue history item
      const dataWithShopId = data.map((item: QueueItem) => ({
        ...item,
        shop_id: parseInt(selectedShopId)
      }));
      
      setQueueHistoryData(dataWithShopId);
      
      // Increment history refresh trigger to force only history to update
      setHistoryRefreshTrigger(prev => prev + 1);
      
      // Remove success toast
    } catch (error) {
      if (error instanceof Error && error.message === "Session expired") {
        throw error;
      }
      console.error('Error fetching queue history data:', error);
      toast.error("Failed to refresh history data", {
        duration: 3000,
      });
    } finally {
      setIsHistoryLoading(false); // Only set history loading to false
    }
  };

  // Define fetchQueueData function so it can be referenced in useEffect
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
      console.log("Queue data received:", data);
      
      // Add shop_id to each queue item
      const dataWithShopId = data.map((item: QueueItem) => ({
        ...item,
        shop_id: parseInt(selectedShopId)
      }));
      
      setQueueData(dataWithShopId);
    } catch (error) {
      if (error instanceof Error && error.message === "Session expired") {
        throw error;
      }
      console.error('Error fetching queue data:', error);
      setError('Failed to fetch queue data. Please try again.');
    }
  };

  const fetchAppointmentsData = async () => {
    if (!selectedShopId) return;
    
    try {
      const session = await getSession();
      
      if (!session?.user?.accessToken) {
        await handleUnauthorizedResponse();
        throw new Error("No access token found. Please login again.");
      }

      // Fetch scheduled appointments
      const scheduledResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/shop/${selectedShopId}/appointments?status=scheduled`,
        {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (scheduledResponse.status === 401) {
        await handleUnauthorizedResponse();
        throw new Error("Session expired");
      }

      if (!scheduledResponse.ok) {
        const errorData = await scheduledResponse.json();
        throw new Error(errorData.message || "Failed to fetch scheduled appointments");
      }

      const scheduledData = await scheduledResponse.json();
      setScheduledAppointments(scheduledData);

      // Fetch completed appointments
      const completedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/shop/${selectedShopId}/appointments?status=completed`,
        {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (completedResponse.status === 401) {
        await handleUnauthorizedResponse();
        throw new Error("Session expired");
      }

      if (!completedResponse.ok) {
        const errorData = await completedResponse.json();
        throw new Error(errorData.message || "Failed to fetch completed appointments");
      }

      const completedData = await completedResponse.json();
      setCompletedAppointments(completedData);

    } catch (error) {
      if (error instanceof Error && error.message === "Session expired") {
        throw error;
      }
      console.error('Error fetching appointments data:', error);
      setError('Failed to fetch appointments data. Please try again.');
    }
  };

  // Function to fetch barbers for the selected shop
  const fetchShopBarbers = async () => {
    if (!selectedShopId) return;
    
    try {
      const session = await getSession();
      
      if (!session?.user?.accessToken) {
        await handleUnauthorizedResponse();
        throw new Error("No access token found. Please login again.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedShopId}/barbers/`,
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
        throw new Error(errorData.message || "Failed to fetch shop barbers");
      }

      const data = await response.json();
      console.log("Shop barbers received:", data);
      setShopBarbers(data);
    } catch (error) {
      if (error instanceof Error && error.message === "Session expired") {
        throw error;
      }
      console.error('Error fetching shop barbers:', error);
      toast.error("Failed to load barbers", {
        duration: 3000,
      });
    }
  };

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

  // Effect for polling data
  useEffect(() => {
    if (!selectedShopId) return;
    
    // Initial data fetch
    fetchQueueData();
    fetchAppointmentsData();
    
    // Set up polling interval
    const pollInterval = setInterval(async () => {
      try {
        await fetchQueueData();
        await fetchAppointmentsData();
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 15000); // Poll every 15 seconds
    
    return () => clearInterval(pollInterval);
  }, [selectedShopId]);

  // Effect for fetching history data when tab changes to completed
  useEffect(() => {
    if (activeTab === "completed" && selectedShopId) {
      fetchQueueHistoryData();
    }
  }, [activeTab, selectedShopId]);

  // Fetch barbers when shop changes
  useEffect(() => {
    if (selectedShopId) {
      fetchShopBarbers();
    }
  }, [selectedShopId]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5" />
            <h3 className="font-medium">Error</h3>
          </div>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show NoShopsState when there are no shops
  if (shops.length === 0) {
    return <NoShopsState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-8"
    >
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
          Walk-In and Appointment Management
        </h1>
        
        <Card className="p-6 shadow-sm border-[#f5f5f5] dark:border-gray-800">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="shop-select" className="text-sm font-medium flex items-center gap-1.5">
                <Store className="h-4 w-4 text-muted-foreground" />
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
                <Tabs 
                  defaultValue="main" 
                  className="w-full" 
                  onValueChange={setActiveTab}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="main" className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Queue & Appointments
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="main" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium flex items-center gap-1.5">
                            <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            Queue
                          </h3>
                          <Link href="/shop/walk-in">
                            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                              <PlusCircle className="h-4 w-4" />
                              Add Walk-in
                            </Button>
                          </Link>
                        </div>
                        <QueueSection 
                          items={queueData.filter(item => 
                            !item.service_end_time && 
                            item.status !== "COMPLETED" && 
                            item.status !== "CANCELLED"
                          )}
                          shopId={selectedShopId}
                          parentRefresh={refreshAllQueueData}
                          key={`queue-main-${refreshTrigger}`}
                          isCompleted={false}
                          barbers={shopBarbers}
                        />
                      </div>
                      <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium flex items-center gap-1.5">
                            <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            Appointments
                          </h3>
                          <Link href="/shop/appointment/create">
                            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                              <PlusCircle className="h-4 w-4" />
                              Create
                            </Button>
                          </Link>
                        </div>
                        <AppointmentSection 
                          appointments={scheduledAppointments}
                          shopId={selectedShopId}
                          parentRefresh={refreshAllQueueData}
                          key={`appointments-main-${refreshTrigger}`}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="completed" className="mt-0">
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border dark:border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                            Completed Queue
                          </h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchQueueHistoryData}
                            disabled={isHistoryLoading}
                            className="flex items-center gap-1.5"
                          >
                            {isHistoryLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Refreshing...
                              </>
                            ) : (
                              <>
                                <RefreshCcw className="h-4 w-4" />
                                Refresh History
                              </>
                            )}
                          </Button>
                        </div>
                        <QueueSection 
                          items={queueHistoryData}
                          shopId={selectedShopId}
                          parentRefresh={fetchQueueHistoryData}
                          key={`queue-history-${historyRefreshTrigger}`}
                          isCompleted={true}
                          barbers={shopBarbers}
                        />
                      </div>
                      <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border dark:border-gray-800">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-1.5">
                          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                          Completed Appointments
                        </h3>
                        <AppointmentSection 
                          appointments={completedAppointments}
                          shopId={selectedShopId}
                          parentRefresh={refreshAllQueueData}
                          key={`appointments-completed-${refreshTrigger}`}
                        />
                      </div>
                    </div>
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