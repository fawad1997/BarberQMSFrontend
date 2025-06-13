export interface BarberInfo {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface ServiceInfo {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CHECKED_IN' 
  | 'IN_SERVICE' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export interface BarberAppointment {
  id: number;
  shop_id: number;
  barber_id: number;
  service_id: number | null;
  user_id: number | null;
  appointment_time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  full_name: string | null;
  phone_number: string | null;
}

export interface DetailedBarberAppointment extends BarberAppointment {
  barber: BarberInfo | null;
  service: ServiceInfo | null;
  duration_minutes: number;
}

export interface AppointmentStatusUpdate {
  status: AppointmentStatus;
}
