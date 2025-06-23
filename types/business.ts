export interface Business {
  id: number;
  name: string;
  username?: string;
  slug?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  email: string;
  description?: string;
  logo_url?: string;
  average_wait_time: number;
  estimated_wait_time: number;
  is_open: boolean;
  is_open_24_hours: boolean;
  formatted_hours: string;
  owner_id: number;
}

export interface BusinessAdvertisement {
  id: number;
  business_id: number;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface BusinessOperatingHours {
  id: number;
  business_id: number;
  day_of_week: number;
  opening_time?: string;
  closing_time?: string;
  is_closed: boolean;
  lunch_break_start?: string;
  lunch_break_end?: string;
}

export type Shop = Business;

// US Timezones mapping - matches backend schemas.py
export const US_TIMEZONES = {
  "America/New_York": "Eastern Time (GMT-5/-4)",
  "America/Chicago": "Central Time (GMT-6/-5)", 
  "America/Denver": "Mountain Time (GMT-7/-6)",
  "America/Phoenix": "Mountain Standard Time (GMT-7)",
  "America/Los_Angeles": "Pacific Time (GMT-8/-7)",
  "America/Anchorage": "Alaska Time (GMT-9/-8)",
  "Pacific/Honolulu": "Hawaii Time (GMT-10)"
};