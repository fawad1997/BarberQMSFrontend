// types/schedule.ts

export interface EmployeeSchedule {
    id: number
    employee_id: number // Changed from barber_id
    day_of_week: number // 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time: string // "HH:MM"
    end_time: string // "HH:MM"
    is_working: boolean // New field
    lunch_break_start?: string // New field - nullable
    lunch_break_end?: string // New field - nullable
    business_id: number // Changed from shop_id
}

// Keep BarberSchedule as alias for backward compatibility during transition
export type BarberSchedule = EmployeeSchedule;

export enum OverrideType {
  HOLIDAY = 'HOLIDAY',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
  EMERGENCY = 'EMERGENCY',
  PERSONAL = 'PERSONAL',
  SICK_LEAVE = 'SICK_LEAVE'
}

export interface ScheduleOverride {
  id: number;
  business_id: number; // Changed from shop_id
  employee_id: number; // Changed from barber_id
  override_date: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
  reason: string; // New field
  override_type: OverrideType; // New field
  created_at: string;
}
  