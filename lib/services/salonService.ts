import { Salon, SalonSearchParams } from "@/types/salon";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

// Helper function to check if a string is a valid numeric ID
function isNumericId(str: string): boolean {
  return /^\d+$/.test(str);
}

// Function to find a salon by ID
export async function getSalonByIdWithSlug(id: string): Promise<Salon | null> {
  try {
    // Fetch all salons
    const salons = await getSalons({ query: '', location: '' });
    
    // Find the salon with the matching ID
    const salon = salons.find((s: Salon) => s.id.toString() === id);
    return salon || null;
  } catch (error) {
    console.error('Error in getSalonByIdWithSlug:', error);
    return null;
  }
}

// Function to find a salon by slug
export async function getSalonBySlug(slug: string): Promise<Salon | null> {
  try {
    // Fetch all salons
    const salons = await getSalons({ query: '', location: '' });
    
    // Find the salon with the matching slug
    const salon = salons.find((s: Salon) => s.slug === slug);
    return salon || null;
  } catch (error) {
    console.error('Error in getSalonBySlug:', error);
    return null;
  }
}

export async function getSalonDetails(idOrSlug: string) {
  try {
    let id: string;
    
    // For slug-based URLs, look up the ID
    if (!isNumericId(idOrSlug)) {
      const salon = await getSalonBySlug(idOrSlug);
      if (!salon) {
        throw new Error(`No salon found with slug: ${idOrSlug}`);
      }
      id = salon.id.toString();
    } else {
      // It's a numeric ID, which should be redirected via middleware
      // but we'll handle it here as a fallback
      id = idOrSlug;
    }
    
    // Fetch the detailed salon data using the ID
    const response = await fetch(`${API_URL}/appointments/shop/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch salon details');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getSalonDetails:', error);
    throw error;
  }
}