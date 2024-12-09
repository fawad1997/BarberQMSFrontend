"use client";

import { useEffect, useState } from "react";
import { getSalonDetails } from "@/lib/services/salonService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Mail, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

interface Schedule {
  id: number;
  day_name: string;
  formatted_time: string;
}

interface Barber {
  id: number;
  full_name: string;
  services: Service[];
  schedules: Schedule[];
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
  is_open: boolean;
  barbers: Barber[];
  services: Service[];
}

export default function AppointmentPage({ params }: { params: { id: string } }) {
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<number | null>(null);
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

          {/* Services Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
            <div className="grid gap-3">
              {salon.services.map((service) => (
                <Card
                  key={service.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedService === service.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {service.duration} min
                      </p>
                    </div>
                    <p className="font-medium">${service.price}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Barbers Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select a Barber</h2>
            <div className="grid gap-3">
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
                        <div className="text-sm text-muted-foreground">
                          {barber.schedules.map((schedule) => (
                            <p key={schedule.id}>
                              {schedule.day_name}: {schedule.formatted_time}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Book Appointment Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedService || !selectedBarber}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
