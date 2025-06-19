export interface Shop {
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
  opening_time: string;
  closing_time: string;
  average_wait_time: number;
  has_advertisement: boolean;
  advertisement_image_url?: string;
  advertisement_start_date?: string;
  advertisement_end_date?: string;
  is_advertisement_active: boolean;
  estimated_wait_time: number;
  is_open: boolean;
  formatted_hours: string;
  owner_id: number;
  timezone: string;
}

// US Timezones mapping for frontend
export const US_TIMEZONES = {
  "America/New_York": "Eastern Time (GMT-5/-4)",
  "America/Chicago": "Central Time (GMT-6/-5)", 
  "America/Denver": "Mountain Time (GMT-7/-6)",
  "America/Phoenix": "Mountain Standard Time (GMT-7)",
  "America/Los_Angeles": "Pacific Time (GMT-8/-7)",
  "America/Anchorage": "Alaska Time (GMT-9/-8)",
  "Pacific/Honolulu": "Hawaii Time (GMT-10)"
};
