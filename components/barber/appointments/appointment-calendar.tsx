import { useState, useEffect, useCallback } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose 
} from "./sheet";
import { DetailedBarberAppointment, AppointmentStatus } from "@/types/barber/appointments";
import AppointmentDetail from "./appointment-detail";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";

// Set up the localizer
const localizer = momentLocalizer(moment);

interface AppointmentEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: DetailedBarberAppointment;
}

interface AppointmentCalendarProps {
  appointments: DetailedBarberAppointment[];
  onSelectEvent?: (appointment: DetailedBarberAppointment) => void;
  onNavigate?: (date: Date) => void;
  onUpdateStatus?: (appointmentId: number, status: AppointmentStatus) => Promise<void>;
}

export default function AppointmentCalendar({
  appointments,
  onSelectEvent,
  onNavigate,
  onUpdateStatus
}: AppointmentCalendarProps) {
  const [events, setEvents] = useState<AppointmentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<DetailedBarberAppointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState<boolean>(false);

  // Convert appointments to calendar events
  useEffect(() => {
    try {
      const formattedEvents = appointments.map((appointment) => ({
        id: appointment.id,
        title: `${appointment.full_name || "Guest"} - ${appointment.service?.name || "Appointment"}`, 
        start: new Date(appointment.appointment_time),
        end: new Date(appointment.end_time),
        resource: appointment,
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error("Error formatting calendar events:", err);
      setError("Could not format calendar events");
    }
  }, [appointments]);

  // Handle event selection
  const handleEventSelect = useCallback((event: AppointmentEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event.resource);
    }
    
    setSelectedAppointment(event.resource);
    setIsDetailOpen(true);
  }, [onSelectEvent]);

  // Handle calendar navigation
  const handleNavigate = useCallback((date: Date) => {
    if (onNavigate) {
      onNavigate(date);
    }
  }, [onNavigate]);

  // Handle appointment status update
  const handleUpdateStatus = useCallback(async (appointmentId: number, status: AppointmentStatus) => {
    if (!onUpdateStatus) return;
    
    setUpdatingAppointment(true);
    try {
      await onUpdateStatus(appointmentId, status);
    } catch (error) {
      console.error("Error updating appointment status:", error);
    } finally {
      setUpdatingAppointment(false);
    }
  }, [onUpdateStatus]);

  // Format the event title for tooltip
  const eventPropGetter = useCallback((event: AppointmentEvent) => {
    const appointment = event.resource as DetailedBarberAppointment;
    let backgroundColor = "#3182CE"; // default blue color
    
    switch (appointment.status) {
      case "SCHEDULED":
        backgroundColor = "#3182CE"; // blue
        break;
      case "CHECKED_IN":
        backgroundColor = "#38A169"; // green
        break;
      case "IN_SERVICE":
        backgroundColor = "#805AD5"; // purple
        break;
      case "COMPLETED":
        backgroundColor = "#38A169"; // green
        break;
      case "CANCELLED":
        backgroundColor = "#718096"; // gray
        break;
      case "NO_SHOW":
        backgroundColor = "#E53E3E"; // red
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
      },
      className: appointment.status === "COMPLETED" || appointment.status === "CANCELLED" ? "appointment-completed" : "",
    };
  }, []);

  // Custom toolbar for calendar
  const CustomToolbar = ({ label, onNavigate: toolbarNavigate }: any) => {
    return (
      <div className="rbc-toolbar">
        <div className="rbc-btn-group">
          <button
            type="button"
            onClick={() => toolbarNavigate('TODAY')}
            className="rbc-btn"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => toolbarNavigate('PREV')}
            className="rbc-btn"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => toolbarNavigate('NEXT')}
            className="rbc-btn"
          >
            Next
          </button>
        </div>
        <span className="rbc-toolbar-label">{label}</span>
        <div className="rbc-btn-group">
          <button
            type="button"
            onClick={() => handleViewChange('day')}
            className={`rbc-btn ${view === 'day' ? 'rbc-active' : ''}`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('week')}
            className={`rbc-btn ${view === 'week' ? 'rbc-active' : ''}`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('month')}
            className={`rbc-btn ${view === 'month' ? 'rbc-active' : ''}`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('agenda')}
            className={`rbc-btn ${view === 'agenda' ? 'rbc-active' : ''}`}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };

  // Track current view
  const [view, setView] = useState<string>('day');
  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  // Format event for event display
  const formats = {
    eventTimeRangeFormat: () => '',  // We'll handle this in the custom component
  };

  // Custom event component
  const EventComponent = ({ event }: { event: AppointmentEvent }) => {
    const appointment = event.resource as DetailedBarberAppointment;
    return (
      <div className="rbc-event-content-custom">
        <div className="font-medium">{appointment.full_name || "Guest"}</div>
        <div className="text-xs">{appointment.service?.name || "Service"}</div>
        <div className="text-xs">
          {moment(appointment.appointment_time).format('h:mm A')} - {moment(appointment.end_time).format('h:mm A')}
        </div>
      </div>
    );
  };

  // Render error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="h-[600px] calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          views={{
            month: true,
            week: true,
            day: true,
            agenda: true,
          }}
          view={view as any}
          onView={(newView) => setView(newView)}
          step={15}
          timeslots={4}
          defaultDate={new Date()}
          onSelectEvent={handleEventSelect}
          onNavigate={handleNavigate}
          popup
          eventPropGetter={eventPropGetter}
          formats={formats}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
          }}
          min={moment().hours(8).minutes(0).toDate()}
          max={moment().hours(20).minutes(0).toDate()}
        />
      </div>
      
      {/* Appointment Details Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent>
          <SheetHeader className="mb-4">
            <SheetTitle>Appointment Details</SheetTitle>
            <SheetDescription>
              View and manage this appointment
            </SheetDescription>
          </SheetHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              <AppointmentDetail appointment={selectedAppointment} />
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Manage Appointment</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAppointment.status === 'SCHEDULED' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      disabled={updatingAppointment}
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'CHECKED_IN')}
                    >
                      Check In
                    </Button>
                  )}

                  {selectedAppointment.status === 'CHECKED_IN' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      disabled={updatingAppointment}
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'IN_SERVICE')}
                    >
                      Start Service
                    </Button>
                  )}

                  {selectedAppointment.status === 'IN_SERVICE' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      disabled={updatingAppointment}
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                    >
                      Complete
                    </Button>
                  )}

                  {(selectedAppointment.status === 'SCHEDULED' || selectedAppointment.status === 'CHECKED_IN') && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={updatingAppointment}
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED')}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={updatingAppointment}
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'NO_SHOW')}
                      >
                        No Show
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <SheetClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </>
  );
}
