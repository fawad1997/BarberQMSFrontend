"use client";

import { useState, useEffect } from "react";
import { getShops } from "@/lib/services/shopService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
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
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface QueueItem {
  id: number;
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
}

function SortableCard({ item }: { item: QueueItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-4 hover:shadow-lg transition-shadow cursor-move">
        <div className="space-y-3">
          <div className="flex justify-between items-start border-b pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{item.full_name}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Position: {item.position_in_queue}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{item.phone_number}</p>
            </div>
            <div className="text-right">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {item.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Check-in Time</p>
              <p className="font-medium">{new Date(item.check_in_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Party Size</p>
              <p className="font-medium">{item.number_of_people} {item.number_of_people === 1 ? 'person' : 'people'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Barber</p>
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
            </div>
            <div>
              <p className="text-muted-foreground">Service</p>
              <p className="font-medium">
                {item.service ? (
                  <span>{item.service.name} ({item.service.duration} min - ${item.service.price})</span>
                ) : 'Not selected'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function QueueSection({ items, shopId }: { items: QueueItem[], shopId: string }) {
  const [sortedItems, setSortedItems] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      try {
        const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
        const newIndex = sortedItems.findIndex((item) => item.id === over.id);

        // Update the UI optimistically
        setSortedItems((items) => arrayMove(items, oldIndex, newIndex));

        // Get session for authentication
        const session = await getSession();
        if (!session?.user?.accessToken) {
          await handleUnauthorizedResponse();
          throw new Error("No access token found");
        }

        // Make API call to update positions
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/queue/reorder`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reordered_entries: [{
                queue_id: active.id,
                new_position: newIndex + 1 // Adding 1 since API might expect 1-based indexing
              }]
            })
          }
        );

        if (response.status === 401) {
          await handleUnauthorizedResponse();
          throw new Error("Session expired");
        }

        if (!response.ok) {
          throw new Error("Failed to update queue positions");
        }

      } catch (error) {
        console.error('Error updating queue positions:', error);
        // Revert the optimistic update on error
        setSortedItems(items);
        // Show error message to user
        alert('Failed to update queue positions. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedItems.map((item) => (
            <SortableCard key={item.id} item={item} />
          ))}
        </SortableContext>
      </DndContext>
      
      {items.length === 0 && (
        <p className="text-muted-foreground text-center py-4">No customers in queue</p>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        <div className="flex justify-between items-start border-b pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">Appointment #{appointment.id}</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {appointment.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {new Date(appointment.appointment_time).toLocaleString('en-US', {
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created At</p>
            <p className="font-medium">{new Date(appointment.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Party Size</p>
            <p className="font-medium">{appointment.number_of_people} {appointment.number_of_people === 1 ? 'person' : 'people'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Barber ID</p>
            <p className="font-medium">
              {appointment.barber_id ? appointment.barber_id : 'Not assigned'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Service ID</p>
            <p className="font-medium">
              {appointment.service_id ? appointment.service_id : 'Not selected'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AppointmentSection({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
      
      {appointments.length === 0 && (
        <p className="text-muted-foreground text-center py-4">No appointments scheduled</p>
      )}
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
      <div className="mb-8">
        <img 
          src="/empty-shop.svg" 
          alt="No Shops" 
          className="w-64 h-64 mx-auto opacity-80"
          onError={(e) => {
            e.currentTarget.src = "https://api.iconify.design/solar:shop-2-outline.svg?color=%23888";
          }}
        />
      </div>
      <h2 className="text-2xl font-bold mb-3">No Shops Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        You haven't created any shops yet. Create a shop first to manage queue.
      </p>
      <Link href="/shop/shops/create">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Your First Shop
        </Button>
      </Link>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="mb-6 h-8 w-48" />
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="mt-6">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
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
    </div>
  );
}

export default function QueuePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<string>("main");

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

    fetchQueueData();
    fetchAppointmentsData();
  }, [selectedShopId]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div className="container py-8 text-red-500">{error}</div>;
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
                <Tabs defaultValue="main" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="main">Queue & Appointments</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  <TabsContent value="main">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Queue</h3>
                        <QueueSection 
                          items={queueData.filter(item => 
                            !item.service_start_time && !item.service_end_time
                          )}
                          shopId={selectedShopId}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-4">Appointments</h3>
                        <AppointmentSection 
                          appointments={scheduledAppointments}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="completed">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Completed Queue</h3>
                        <QueueSection 
                          items={queueData.filter(item => 
                            item.service_end_time
                          )}
                          shopId={selectedShopId}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-4">Completed Appointments</h3>
                        <AppointmentSection 
                          appointments={completedAppointments}
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