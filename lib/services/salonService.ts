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

export async function getSalons({ query }: { query: string; location: string }) {
  const searchParams = new URLSearchParams();
  if (query) {
    searchParams.append('search', query);
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/shops?${searchParams.toString()}`);
  const data = await response.json();
  return data.items;
}