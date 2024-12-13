"use client";

import { useEffect, useState } from "react";
import { getSalonDetails } from "@/lib/services/salonService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Barber {
  id: number;
  full_name: string;
  status: string;
  services: Array<{
    name: string;
    duration: number;
    price: number;
  }>;
}

interface SalonDetails {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  email: string;
  formatted_hours: string;
  estimated_wait_time: number;
  is_open: boolean;
  barbers: Barber[];
}

export default function CheckInPage({ params }: { params: { id: string } }) {
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);

  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        const data = await getSalonDetails(params.id);
        setSalon(data);
      } catch (error) {
        console.error('Error fetching salon details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div className="animate-pulse">Loading salon details...</div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="container py-8 text-center">
        <div className="text-red-500">Salon not found</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-8"
    >
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Salon Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{salon.name}</h1>
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {salon.address}, {salon.city}, {salon.state} {salon.zip_code}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {salon.formatted_hours}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {salon.phone_number}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {salon.email}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${salon.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {salon.is_open ? 'Open' : 'Closed'}
            </span>
            {salon.is_open && (
              <span className="text-sm text-muted-foreground">
                (Estimated wait: {salon.estimated_wait_time} minutes)
              </span>
            )}
          </div>

          {/* Barbers Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Barbers</h2>
            <div className="grid gap-4">
              {salon.barbers.map((barber) => (
                <Card
                  key={barber.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedBarber === barber.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedBarber(barber.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{barber.full_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          Status: {barber.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {barber.services.length} services available
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Navigation Link */}
          <div className="text-center text-sm">
            <Link 
              href={`/salons/${params.id}/appointment`}
              className="text-primary hover:underline"
            >
              Want to book an appointment instead? Click here
            </Link>
          </div>

          {/* Check-in Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedBarber || !salon.is_open}
          >
            Check In Now
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
