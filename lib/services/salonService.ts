import { Salon, SalonSearchParams } from "@/types/salon";

// Use the correct API URL with fallback, ensuring it matches what's defined in middleware.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getSalons({ query }: { query: string; location: string }) {
  try {
    const searchParams = new URLSearchParams();
    if (query) {
      searchParams.append('search', query);
    }
    
    const response = await fetch(`${API_URL}/appointments/businesses?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch salons');
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error in getSalons:', error);
    throw error;
  }
}

// Helper function to check if a string is a numeric ID
function isNumericId(str: string): boolean {
  return /^\d+$/.test(str);
}

export async function getSalonDetails(idOrSlug: string) {
  console.log(`Fetching salon details for: ${idOrSlug}`);
  try {
    let shopId: string = idOrSlug;

    // If it's not a numeric ID, we need to find the salon ID first
    if (!isNumericId(idOrSlug)) {
      console.log(`Finding salon ID by username/slug: ${idOrSlug}`);
      
      // Fetch all salons and find the one with matching username
      const allSalonsResponse = await fetch(`${API_URL}/appointments/businesses`);
      if (!allSalonsResponse.ok) {
        console.error(`Failed to fetch salons list: Status ${allSalonsResponse.status}`);
        throw new Error(`Failed to fetch salons list: ${allSalonsResponse.status}`);
      }
      
      const salonsData = await allSalonsResponse.json();
      if (!salonsData || !salonsData.items || !Array.isArray(salonsData.items)) {
        console.error('Invalid response format from salons endpoint');
        throw new Error('Invalid response format from salons endpoint');
      }
      
      console.log(`Searching through ${salonsData.items.length} salons for username: ${idOrSlug}`);
      
      const matchingSalon = salonsData.items.find(
        (salon: any) => (salon.username && salon.username.toLowerCase() === idOrSlug.toLowerCase()) ||
                       (salon.slug && salon.slug.toLowerCase() === idOrSlug.toLowerCase())
      );
      
      if (matchingSalon) {
        console.log(`Found matching salon by username/slug: ${matchingSalon.name}, ID: ${matchingSalon.id}`);
        shopId = matchingSalon.id.toString();
      } else {
        console.error(`No salon found with username: ${idOrSlug}`);
        throw new Error(`No salon found with username: ${idOrSlug}`);
      }
    }
    
    // Now that we have the business ID, always fetch the complete business details
    const endpoint = `${API_URL}/appointments/business/${shopId}`;
    console.log(`Fetching complete business details from: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      console.error(`Error fetching salon with ID ${shopId}: Status ${response.status}`);
      throw new Error(`Failed to fetch salon details: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getSalonDetails:', error);
    throw error;
  }
}