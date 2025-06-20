import { EmployeeSchedule } from "./schedule"

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  status: string;
  business_id: number; // Changed from shop_id
  schedules: EmployeeSchedule[]
}

// Keep Barber as alias for backward compatibility during transition
export type Barber = Employee;

export enum EmployeeStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_BREAK = 'on_break',
  OFFLINE = 'offline'
}

// Keep BarberStatus as alias for backward compatibility
export const BarberStatus = EmployeeStatus; 