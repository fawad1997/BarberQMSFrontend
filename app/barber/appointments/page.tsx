"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnhancedDatePicker } from "@/components/enhanced-date-picker";
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
  Loader2,
  Scissors,
  User,
  Ban,
  ClipboardCheck,
  RefreshCw,
  X
} from "lucide-react";

import AppointmentCalendar from "@/components/barber/appointments/appointment-calendar";
import AppointmentDetail from "@/components/barber/appointments/appointment-detail";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
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
  const [selectedAppointment, setSelectedAppointment] = useState<DetailedBarberAppointment | null>(null);
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);
      
      try {        const queryParams = new URLSearchParams();
        if (selectedDate) {
          queryParams.append('date', format(selectedDate, 'yyyy-MM-dd'));
        }
        if (statusFilter !== "all") {
          // Make sure we send the status in the exact format the backend expects
          queryParams.append('status', statusFilter);
        }
          const response = await fetch(`/api/barber/appointments?${queryParams}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }        const data = await response.json();
        
        // Ensure data is an array, even if empty
        const appointmentsArray = Array.isArray(data) ? data : [];
        setAppointments(appointmentsArray);
        setFilteredAppointments(appointmentsArray);
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
  }, [session, selectedDate, statusFilter]);  // Filter appointments
  useEffect(() => {
    // Handle empty appointments array
    if (!appointments || appointments.length === 0) {
      setFilteredAppointments([]);
      return;
    }
    
    let filtered = [...appointments];
    
    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(appointment => 
        isSameDay(parseISO(appointment.appointment_time), selectedDate)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      // Ensure exact match with the status enum values
      filtered = filtered.filter(appointment => {
        // The appointment status should match the selected filter exactly
        return appointment.status === statusFilter;
      });
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
        <div className="flex flex-col sm:flex-row gap-4 items-end">          {/* Date Picker */}
          <div className="w-full sm:w-auto">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Date
                {selectedDate && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </span>
                )}
              </label>
              <EnhancedDatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </div>
            {/* Status Dropdown */}
          <div className="w-full sm:w-auto">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Status
                {statusFilter !== "all" && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {statusLabels[statusFilter as AppointmentStatus]}
                  </span>
                )}
              </label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger 
                  className={cn(
                    "w-full sm:w-[180px]",
                    statusFilter !== "all" && "border-primary/20 bg-primary/5"
                  )}
                >
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SCHEDULED">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Scheduled</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CHECKED_IN">
                    <div className="flex items-center">
                      <ClipboardCheck className="h-4 w-4 mr-2 text-green-500" />
                      <span>Checked In</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="IN_SERVICE">
                    <div className="flex items-center">
                      <Scissors className="h-4 w-4 mr-2 text-purple-500" />
                      <span>In Service</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      <span>Completed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    <div className="flex items-center">
                      <Ban className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Cancelled</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="NO_SHOW">
                    <div className="flex items-center">
                      <X className="h-4 w-4 mr-2 text-red-500" />
                      <span>No Show</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Reset Filters Button */}
          <div className="w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedDate(undefined);
                setStatusFilter("all");
              }}
            >
              Reset filters
            </Button>
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
              <TabsTrigger value="calendar">Calender View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Appointments Content */}
      <Tabs value={viewType} onValueChange={(v) => setViewType(v as "list" | "calendar")} className="w-full">      <Card>
          <CardHeader>            <CardTitle className="flex justify-between items-center">
              <span>
                {selectedDate && viewType === "list" && 
                  `Appointments for ${format(selectedDate || new Date(), 'MMMM d, yyyy')}`
                }
                {!selectedDate && 'All Appointments'}
                {selectedDate && viewType === "calendar" && 'Appointments'}
              </span>
              {viewType === "list" && (
                <Badge variant="outline" className="ml-2">
                  {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
                </Badge>
              )}
              {viewType === "calendar" && selectedDate && (
                <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pb-3">            <TabsContent value="list" className="mt-0">              {filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-md border border-dashed border-border">
                  <CalendarIcon className="h-12 w-12 mb-4 text-muted-foreground/70" />
                  <h3 className="text-lg font-medium">No appointments found</h3>
                  <p className="text-sm mb-4">There are no appointments matching your current filters.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedDate(undefined);
                      setStatusFilter("all");
                    }}
                    className="mt-2"
                  >
                    Reset filters
                  </Button>
                </div>) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="bg-muted/60 px-4 py-3 text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <span className="w-48">Client</span>
                      <span className="hidden md:block w-36">Time</span>
                      <span className="hidden md:block flex-1">Service</span>
                    </div>
                    <span className="w-24 text-center">Status</span>
                  </div>
                  
                  <div className="divide-y divide-border">
                    {filteredAppointments.map((appointment) => (                      <div
                        key={appointment.id}
                        className="p-4 hover:bg-muted/30 transition-colors border-l-2 hover:border-l-primary cursor-pointer"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowAppointmentDetail(true);
                        }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Main appointment information */}
                          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                            {/* Client info */}
                            <div className="w-full md:w-48 flex flex-col">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-primary" />
                                <h3 className="font-medium truncate">
                                  {appointment.full_name || "Guest"}
                                </h3>
                              </div>
                              {appointment.phone_number && (
                                <span className="text-xs text-muted-foreground ml-6">
                                  {appointment.phone_number}
                                </span>
                              )}
                            </div>
                            
                            {/* Time info */}
                            <div className="w-full md:w-36 flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm">
                                {formatAppointmentTime(appointment.appointment_time)}
                                {" - "}
                                {formatAppointmentTime(appointment.end_time)}
                              </span>
                            </div>
                            
                            {/* Service info */}
                            {appointment.service && (
                              <div className="flex-1 flex items-center">
                                <Scissors className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                  {appointment.service.name}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({appointment.duration_minutes} min)
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Status and Actions */}
                          <div className="flex flex-col gap-3">
                            <Badge className={`${statusColors[appointment.status]} self-end md:self-center`}>
                              <div className="flex items-center">
                                {statusIcons[appointment.status]}
                                <span className="ml-1">{statusLabels[appointment.status]}</span>
                              </div>
                            </Badge>
                            
                            <div className="flex gap-2 flex-wrap justify-end">
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
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">              {filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 rounded-md border border-dashed border-border">
                  <div className="bg-primary/5 p-4 rounded-full mb-4">
                    <CalendarIcon className="h-12 w-12 text-primary/70" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No appointments found</h3>
                  <p className="text-sm mb-6 text-center max-w-md">
                    There are no appointments matching your current filters. Try adjusting your filters or selecting a different date range.
                  </p>
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedDate(undefined);
                        setStatusFilter("all");
                      }}
                      className="flex items-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset filters
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setSelectedDate(new Date())}
                      className="flex items-center"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      View Today
                    </Button>
                  </div>
                </div>              ) : (                <div className="py-2">
                  <AppointmentCalendar 
                    appointments={filteredAppointments}
                    onSelectEvent={(appointment) => {
                      setSelectedAppointment(appointment);
                      setShowAppointmentDetail(true);
                    }}
                    onNavigate={(date) => {
                      if (!selectedDate || !isSameDay(date, selectedDate)) {
                        setSelectedDate(date);
                      }
                    }}
                  />
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>      </Tabs>      {/* Appointment Detail Sheet */}
      <Sheet open={showAppointmentDetail} onOpenChange={setShowAppointmentDetail}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-xl">Appointment Details</SheetTitle>
            <SheetClose className="absolute top-4 right-4 rounded-full hover:bg-muted p-1" />
          </SheetHeader>
          {selectedAppointment && (
            <div className="mt-6">
              <AppointmentDetail appointment={selectedAppointment} />
              
              <div className="mt-8 space-y-3 border-t pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Manage Appointment</h3>
                {selectedAppointment.status === 'SCHEDULED' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    disabled={updatingAppointmentId === selectedAppointment.id}
                    onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'CHECKED_IN');
                      setShowAppointmentDetail(false);
                    }}
                  >
                    <ClipboardCheck className="h-4 w-4" /> Check In Customer
                  </Button>
                )}
                
                {selectedAppointment.status === 'CHECKED_IN' && (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={updatingAppointmentId === selectedAppointment.id}
                    onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'IN_SERVICE');
                      setShowAppointmentDetail(false);
                    }}
                  >
                    Start Service
                  </Button>
                )}
                
                {selectedAppointment.status === 'IN_SERVICE' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={updatingAppointmentId === selectedAppointment.id}
                    onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'COMPLETED');
                      setShowAppointmentDetail(false);
                    }}
                  >
                    Complete Service
                  </Button>
                )}
                
                {(selectedAppointment.status === 'SCHEDULED' || selectedAppointment.status === 'CHECKED_IN') && (
                  <Button 
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    disabled={updatingAppointmentId === selectedAppointment.id}
                    onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'NO_SHOW');
                      setShowAppointmentDetail(false);
                    }}
                  >
                    Mark as No Show
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
