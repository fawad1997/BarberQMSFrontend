import { Salon, SalonSearchParams } from "@/types/salon";

export const getSalons = async (params: SalonSearchParams): Promise<Salon[]> => {
  try {
    // Replace with your actual API endpoint
    const queryString = new URLSearchParams({
      query: params.query || '',
      location: params.location || '',
      page: String(params.page || 1),
      limit: String(params.limit || 10),
    }).toString();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/salons?${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch salons');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching salons:', error);
    throw error;
  }
}; 