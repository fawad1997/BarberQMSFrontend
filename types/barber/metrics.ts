export interface DailyMetric {
  date: string;
  customers_served: number;
  avg_service_duration?: number;
  appointments_count?: number;
}

export interface BarberMetrics {
  time_period: string;
  start_date: string;
  end_date: string;
  customers_served: number;
  upcoming_appointments: number;
  avg_service_duration_minutes: number;
  daily_data: DailyMetric[];
}
