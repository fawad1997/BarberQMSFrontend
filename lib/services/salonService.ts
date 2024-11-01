import { Salon, SalonSearchParams } from "@/types/salon";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const MOCK_SALONS: Salon[] = [
  {
    id: "1",
    name: "Test Shop 1",
    address: "Shop 131",
    city: "Dallas",
    state: "Texas",
    openingTime: "1:09 AM",
    closingTime: "11:09 PM",
    waitTime: 0,
    isOpen: true,
  },
  {
    id: "2",
    name: "Slug Shop",
    address: "Street 688",
    city: "Dallas",
    state: "Texas",
    openingTime: "5:33 AM",
    closingTime: "5:33 PM",
    waitTime: 15,
    isOpen: false,
  },
];

export const getSalons = async (params: SalonSearchParams): Promise<Salon[]> => {
  // For development, return mock data
  return MOCK_SALONS;
  
  // Comment out or remove the mock return when you have a real API
  try {
    const queryString = new URLSearchParams({
      query: params.query || '',
      location: params.location || '',
      page: String(params.page || 1),
      limit: String(params.limit || 10),
    }).toString();

    const response = await fetch(`${API_URL}/salons?${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch salons');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching salons:', error);
    return [];
  }
}; 