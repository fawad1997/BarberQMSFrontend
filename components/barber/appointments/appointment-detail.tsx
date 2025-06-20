import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  User,
  Scissors,
  Phone,
  Calendar,
} from "lucide-react";
import { DetailedBarberAppointment, AppointmentStatus } from "@/types/barber/appointments";

const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  IN_SERVICE: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  NO_SHOW: "bg-red-100 text-red-800"
};

const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CHECKED_IN: "Checked In",
  IN_SERVICE: "In Service",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show"
};

interface AppointmentDetailProps {
  appointment: DetailedBarberAppointment;
}

export default function AppointmentDetail({ appointment }: AppointmentDetailProps) {
  // Format the appointment time
  const formatAppointmentTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Format the appointment date
  const formatAppointmentDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center">
          <User className="h-5 w-5 mr-2 text-gray-500" />
          {appointment.full_name || "Guest"}
        </h3>
        <Badge className={statusColors[appointment.status]}>
          {statusLabels[appointment.status]}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-3 text-gray-500" />
          <span>{formatAppointmentDate(appointment.appointment_time)}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-3 text-gray-500" />
          <span>
            {formatAppointmentTime(appointment.appointment_time)} - {formatAppointmentTime(appointment.end_time)}
          </span>
        </div>
        
        {appointment.service && (
          <div className="flex items-center">
            <Scissors className="h-4 w-4 mr-3 text-gray-500" />
            <span>
              {appointment.service.name} ({appointment.duration_minutes} minutes)
              {appointment.service.price > 0 && ` - $${appointment.service.price.toFixed(2)}`}
            </span>
          </div>
        )}
        
        {appointment.phone_number && (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-3 text-gray-500" />
            <span>{appointment.phone_number}</span>
          </div>
        )}
      </div>
      
      {appointment.actual_start_time && (
        <div className="pt-3 border-t">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-3 text-green-500" />
            <span className="text-sm">
              Started: {formatAppointmentTime(appointment.actual_start_time)}
            </span>
          </div>
          
          {appointment.actual_end_time && (
            <div className="flex items-center mt-1">
              <Clock className="h-4 w-4 mr-3 text-green-500" />
              <span className="text-sm">
                Ended: {formatAppointmentTime(appointment.actual_end_time)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
