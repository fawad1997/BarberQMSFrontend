"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format, parseISO, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileBarChart,
  Loader2,
  Scissors,
  User,
  Ban,
  ClipboardCheck,
  X
} from "lucide-react";

import AppointmentCalendar from "@/components/barber/appointments/appointment-calendar";
import {
  DetailedBarberAppointment,
  AppointmentStatus,
  AppointmentStatusUpdate
} from "@/types/barber/appointments";

const statusIcons: Record<AppointmentStatus, React.ReactNode> = {
  SCHEDULED: <Clock className="h-5 w-5 text-blue-500" />,
  CHECKED_IN: <ClipboardCheck className="h-5 w-5 text-green-500" />,
  IN_SERVICE: <Scissors className="h-5 w-5 text-purple-500" />,
  COMPLETED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  CANCELLED: <Ban className="h-5 w-5 text-gray-500" />,
  NO_SHOW: <X className="h-5 w-5 text-red-500" />
};

const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CHECKED_IN: "Checked In",
  IN_SERVICE: "In Service",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show"
};

const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  IN_SERVICE: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  NO_SHOW: "bg-red-100 text-red-800"
};

export default function BarberAppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<DetailedBarberAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<DetailedBarberAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewType, setViewType] = useState<"list" | "calendar">("list");
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<number | null>(null);

  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams();
        if (selectedDate) {
          queryParams.append('date', format(selectedDate, 'yyyy-MM-dd'));
        }
        if (statusFilter !== "all") {
          queryParams.append('status', statusFilter);
        }
        
        const response = await fetch(`/api/barber/appointments?${queryParams}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await response.json();
        setAppointments(data);
        setFilteredAppointments(data);
      } catch (err) {
        console.error("Error fetching barber appointments:", err);
        setError("Could not load appointments data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchAppointments();
    }
  }, [session, selectedDate, statusFilter]);

  // Filter appointments
  useEffect(() => {
    let filtered = [...appointments];
    
    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(appointment => 
        isSameDay(parseISO(appointment.appointment_time), selectedDate)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(appointment => 
        appointment.status === statusFilter
      );
    }
    
    setFilteredAppointments(filtered);
  }, [appointments, selectedDate, statusFilter]);

  const updateAppointmentStatus = async (appointmentId: number, newStatus: AppointmentStatus) => {
    setUpdatingAppointmentId(appointmentId);
    
    try {
      const response = await fetch(`/api/barber/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus } as AppointmentStatusUpdate),
      });

      if (!response.ok) {
        throw new Error(`Failed to update appointment status: ${response.status}`);
      }

      const updatedAppointment = await response.json();
      
      // Update the appointments list with the updated appointment
      setAppointments(prev => 
        prev.map(app => app.id === appointmentId ? updatedAppointment : app)
      );

    } catch (err) {
      console.error("Error updating appointment status:", err);
      setError("Failed to update the appointment status. Please try again.");
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  // Function to format the appointment time
  const formatAppointmentTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Function to format the appointment date
  const formatAppointmentDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Appointments</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((_, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-36 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Appointments</h1>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Appointments
            </CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Appointments</h1>
      
      {/* Filters and View Toggles */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="IN_SERVICE">In Service</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Calendar
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="w-full md:w-auto">
          <Tabs 
            value={viewType}
            onValueChange={(v) => setViewType(v as "list" | "calendar")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Appointments Content */}
      <Tabs value={viewType} onValueChange={(v) => setViewType(v as "list" | "calendar")} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>
                {selectedDate && 
                  `Appointments for ${format(selectedDate || new Date(), 'MMMM d, yyyy')}`
                }
                {!selectedDate && 'All Appointments'}
              </span>
              <Badge variant="outline" className="ml-2">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="list" className="mt-0">
              {filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mb-2" />
                  <h3 className="text-lg font-medium">No appointments</h3>
                  <p className="text-sm">No appointments found for the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-md p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium flex items-center">
                            <User className="h-5 w-5 mr-2 text-gray-500" />
                            {appointment.full_name || "Guest"}
                          </h3>
                          
                          <div className="flex flex-col mt-2 space-y-2">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm">
                                {formatAppointmentTime(appointment.appointment_time)} - {formatAppointmentTime(appointment.end_time)}
                              </span>
                            </div>
                            
                            {appointment.service && (
                              <div className="flex items-center">
                                <Scissors className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm">{appointment.service.name} ({appointment.duration_minutes} min)</span>
                              </div>
                            )}
                            
                            {appointment.phone_number && (
                              <div className="flex items-center">
                                <FileBarChart className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm">{appointment.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end mt-4 sm:mt-0">
                          <Badge className={statusColors[appointment.status]}>
                            <div className="flex items-center">
                              {statusIcons[appointment.status]}
                              <span className="ml-1">{statusLabels[appointment.status]}</span>
                            </div>
                          </Badge>
                          
                          <div className="flex mt-3 gap-2">
                            {appointment.status === 'SCHEDULED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                disabled={updatingAppointmentId === appointment.id}
                                onClick={() => updateAppointmentStatus(appointment.id, 'CHECKED_IN')}
                              >
                                {updatingAppointmentId === appointment.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <ClipboardCheck className="mr-1 h-3 w-3" />
                                )}
                                Check In
                              </Button>
                            )}
                            
                            {appointment.status === 'CHECKED_IN' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                disabled={updatingAppointmentId === appointment.id}
                                onClick={() => updateAppointmentStatus(appointment.id, 'IN_SERVICE')}
                              >
                                {updatingAppointmentId === appointment.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Scissors className="mr-1 h-3 w-3" />
                                )}
                                Start Service
                              </Button>
                            )}
                            
                            {appointment.status === 'IN_SERVICE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                disabled={updatingAppointmentId === appointment.id}
                                onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
                              >
                                {updatingAppointmentId === appointment.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                )}
                                Complete
                              </Button>
                            )}
                            
                            {(appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={updatingAppointmentId === appointment.id}
                                onClick={() => updateAppointmentStatus(appointment.id, 'NO_SHOW')}
                              >
                                {updatingAppointmentId === appointment.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="mr-1 h-3 w-3" />
                                )}
                                No Show
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              {filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mb-2" />
                  <h3 className="text-lg font-medium">No appointments</h3>
                  <p className="text-sm">No appointments found for the selected filters.</p>
                </div>
              ) : (
                <div className="py-4">
                  <AppointmentCalendar 
                    appointments={filteredAppointments}
                    onSelectEvent={(appointment) => {                      // The component handles display of the selected appointment
                    }}
                    onNavigate={(date) => {
                      setSelectedDate(date);
                    }}
                    onUpdateStatus={updateAppointmentStatus}
                  />
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
