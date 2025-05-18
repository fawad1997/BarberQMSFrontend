import { Salon, SalonSearchParams } from "@/types/salon";

// Use the correct API URL with fallback, ensuring it matches what's defined in middleware.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getSalons({ query }: { query: string; location: string }) {
  try {
    const searchParams = new URLSearchParams();
    if (query) {
      searchParams.append('search', query);
    }
    
    const response = await fetch(`${API_URL}/appointments/shops?${searchParams.toString()}`);
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
    // Different endpoints for numeric IDs vs slugs
    let endpoint;
    let data;
    
    if (isNumericId(idOrSlug)) {
      // If it's a numeric ID, use the direct shop endpoint
      endpoint = `${API_URL}/appointments/shop/${idOrSlug}`;
      console.log(`Using numeric ID endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error(`Error fetching salon with ID ${idOrSlug}: Status ${response.status}`);
        throw new Error(`Failed to fetch salon details: ${response.status}`);
      }
      
      data = await response.json();
    } else {
      // If it's a slug, use the slug-specific endpoint
      endpoint = `${API_URL}/appointments/shop-by-slug/${idOrSlug}`;
      console.log(`Using slug endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error(`Slug endpoint failed for ${idOrSlug}: Status ${response.status}`);
        console.log('Trying fallback to find salon by all salons lookup...');
        
        // Fetch all salons and find the one with matching slug
        const allSalonsResponse = await fetch(`${API_URL}/appointments/shops`);
        if (!allSalonsResponse.ok) {
          console.error(`Fallback request failed: Status ${allSalonsResponse.status}`);
          throw new Error(`Failed to fetch salons list: ${allSalonsResponse.status}`);
        }
        
        const salonsData = await allSalonsResponse.json();
        if (!salonsData || !salonsData.items || !Array.isArray(salonsData.items)) {
          console.error('Invalid response format from salons endpoint');
          throw new Error('Invalid response format from salons endpoint');
        }
        
        console.log(`Searching through ${salonsData.items.length} salons for slug: ${idOrSlug}`);
        
        const matchingSalon = salonsData.items.find(
          (salon: any) => salon.slug && salon.slug.toLowerCase() === idOrSlug.toLowerCase()
        );
        
        if (matchingSalon) {
          console.log(`Found matching salon by slug: ${matchingSalon.name}, ID: ${matchingSalon.id}`);
          data = matchingSalon;
        } else {
          console.error(`No salon found with slug: ${idOrSlug}`);
          throw new Error(`No salon found with slug: ${idOrSlug}`);
        }
      } else {
        data = await response.json();
      }
    }
    
    console.log("Salon details retrieved successfully:", data ? data.name : "No data");
    return data;
  } catch (error) {
    console.error('Error in getSalonDetails:', error);
    throw error;
  }
}