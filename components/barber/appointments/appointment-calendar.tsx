import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { DetailedBarberAppointment, AppointmentStatus } from "@/types/barber/appointments";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";
import "@/styles/calendar-variables.css";

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
}: AppointmentCalendarProps) {  const [events, setEvents] = useState<AppointmentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(
    // Use the date of the first appointment as default, or today if no appointments
    appointments.length > 0 
      ? new Date(appointments[0].appointment_time) 
      : new Date()
  );
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
      
      // Update the calendar date if we have appointments
      if (appointments.length > 0) {
        // Sort appointments by date
        const sortedAppointments = [...appointments].sort((a, b) => 
          new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
        );
        
        // Use the date of the first upcoming appointment
        const today = new Date();
        const upcomingAppointment = sortedAppointments.find(app => 
          new Date(app.appointment_time) >= today
        );
        
        if (upcomingAppointment) {
          setCalendarDate(new Date(upcomingAppointment.appointment_time));
        } else if (sortedAppointments.length > 0) {
          // If no upcoming appointments, use the most recent one
          setCalendarDate(new Date(sortedAppointments[sortedAppointments.length - 1].appointment_time));
        }
      }
    } catch (err) {
      console.error("Error formatting calendar events:", err);
      setError("Could not format calendar events");
    }
  }, [appointments]);
  // Removed the useEffect that was causing an infinite loop
  // Handle event selection - now just calls the parent's handler
  const handleEventSelect = useCallback((event: AppointmentEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event.resource);
    }
  }, [onSelectEvent]);
  
  // Handle calendar navigation
  const handleNavigate = useCallback((date: Date, view?: string, action?: any) => {
    if (onNavigate) {
      onNavigate(date);
    }
  }, [onNavigate]);// Track current view
  const [view, setView] = useState<string>('day');
  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  // Format the event title for tooltip with improved styling
  const eventPropGetter = useCallback((event: AppointmentEvent) => {
    const appointment = event.resource as DetailedBarberAppointment;
    let backgroundColor = "#3182CE"; // default blue color
    let borderLeft = "none";
    let opacity = 1;
    let fontWeight = 500;
    
    switch (appointment.status) {
      case "SCHEDULED":
        backgroundColor = "var(--blue-500)";
        borderLeft = "4px solid var(--blue-700)";
        break;
      case "CHECKED_IN":
        backgroundColor = "var(--green-500)";
        borderLeft = "4px solid var(--green-700)";
        fontWeight = 600;
        break;
      case "IN_SERVICE":
        backgroundColor = "var(--purple-500)";
        borderLeft = "4px solid var(--purple-700)";
        fontWeight = 600;
        break;
      case "COMPLETED":
        backgroundColor = "var(--green-600)";
        borderLeft = "4px solid var(--green-800)";
        opacity = 0.85;
        break;
      case "CANCELLED":
        backgroundColor = "var(--gray-500)";
        borderLeft = "4px solid var(--gray-700)";
        opacity = 0.7;
        break;
      case "NO_SHOW":
        backgroundColor = "var(--red-500)";
        borderLeft = "4px solid var(--red-700)";
        opacity = 0.85;
        break;
    }

    // Different styling for month view vs. day/week view
    const isMonthView = view === 'month';
    
    return {
      style: {
        backgroundColor,
        borderLeft,
        borderRadius: isMonthView ? "4px" : "6px",
        opacity,
        fontWeight,
        padding: isMonthView ? "2px 4px" : "6px 10px",
        height: isMonthView ? "auto" : undefined,
        minHeight: isMonthView ? "22px" : undefined,
        fontSize: isMonthView ? "12px" : "14px",
      },
      className: `appointment-status-${appointment.status.toLowerCase()}`,
    };  }, [view]);
    // Empty toolbar to hide it completely
  const CustomToolbar = () => {
    return null;
  };

  // Format event for event display
  const formats = {
    eventTimeRangeFormat: () => '',  // We'll handle this in the custom component
  };
  // Status icons for events
  const getStatusIcon = (status: AppointmentStatus) => {
    switch(status) {
      case 'SCHEDULED': return '🕒';
      case 'CHECKED_IN': return '✓';
      case 'IN_SERVICE': return '✂️';
      case 'COMPLETED': return '✅';
      case 'CANCELLED': return '❌';
      case 'NO_SHOW': return '⛔';
      default: return '';
    }
  };  // Enhanced event component focused on day view
  const EventComponent = ({ event, title }: { event: AppointmentEvent, title?: string }) => {
    const appointment = event.resource as DetailedBarberAppointment;
    const statusIcon = getStatusIcon(appointment.status);
    
    return (
      <div className="rbc-event-content-custom day-view-event">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm truncate max-w-[80%]">
              {appointment.full_name || "Guest"}
            </div>
            <div className="text-base status-icon">{statusIcon}</div>
          </div>
          
          {appointment.service && (
            <div className="text-xs font-medium truncate service-name mb-1">
              {appointment.service.name}
            </div>
          )}
            <div className="text-xs font-medium mt-auto pt-1 border-t border-white/20 time-range flex items-center">
            <span className="inline-block mr-1">⏱</span>
            {moment(appointment.appointment_time).format('h:mm A')} - {moment(appointment.end_time).format('h:mm A')}
          </div>
            {appointment.service?.description && (
            <div className="text-xs mt-1 truncate opacity-80">
              {appointment.service?.description.substring(0, 30)}
              {appointment.service?.description.length > 30 ? '...' : ''}
            </div>
          )}
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

  return (    <>      <div className="h-[680px] calendar-wrapper custom-calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          view={'day'}
          views={{'day': true}}
          step={15}
          timeslots={4}
          date={calendarDate}
          onSelectEvent={handleEventSelect}
          onNavigate={(date) => {
            setCalendarDate(date);
            // Sync with parent immediately since we're only using date picker for navigation
            if (onNavigate) {
              onNavigate(date);
            }
          }}
          popup
          selectable={false}
          eventPropGetter={eventPropGetter}
          formats={{
            ...formats,
            dayFormat: 'ddd D',
            timeGutterFormat: 'h:mm A', 
            dayHeaderFormat: 'dddd, MMMM D, YYYY',
            eventTimeRangeFormat: (range: { start: Date, end: Date }) => {
              return `${moment(range.start).format('h:mm A')} - ${moment(range.end).format('h:mm A')}`;
            }
          }}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
          }}
          min={moment().hours(8).minutes(0).toDate()}
          max={moment().hours(20).minutes(0).toDate()}
          dayLayoutAlgorithm="no-overlap"
          className="rounded-lg shadow-md border enhanced-calendar"
        />      </div>
    </>
  );
}
