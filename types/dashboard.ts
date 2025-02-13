export interface BarberManagement {
  barber_id: number;
  full_name: string;
  customers_served: number;
}

export interface ShopMetrics {
  shop_id: number;
  shop_name: string;
  total_customers_today: number;
  customers_in_queue: number;
  customers_served: number;
  cancellations: number;
  average_wait_time: number;
  barber_management: BarberManagement[];
}

export interface HistoricalTrend {
  date: string;
  total_visits: number;
  average_wait_time: number;
}

export interface DashboardData {
  shops: ShopMetrics[];
  daily_insights: {
    total_customer_visits_today: number;
    average_wait_time: number;
  };
  historical_trends: HistoricalTrend[];
} 