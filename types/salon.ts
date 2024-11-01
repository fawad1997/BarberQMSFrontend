export interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  openingTime: string;
  closingTime: string;
  waitTime: number;
  isOpen: boolean;
}

export interface SalonSearchParams {
  query?: string;
  location?: string;
  page?: number;
  limit?: number;
} 