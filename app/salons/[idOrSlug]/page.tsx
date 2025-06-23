"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, MapPin, Phone, Mail, Calendar, UserCheck, Star, Users, Globe } from "lucide-react";
import { getUserTimezone, getTimezoneDisplayName, convertFormattedHoursToUserTimezone } from "@/lib/utils/timezone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSalonDetails } from "@/lib/services/salonService";
import { ensureSalonUrlUsesUsername } from "@/lib/utils/navigation";
import { US_TIMEZONES } from "@/types/shop";

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
  timezone: string;
  barbers?: Array<{
    id: number;
    full_name: string;
    status: string;
  }>;
  services?: Array<{
    id: number;
    name: string;
    duration: number;
    price: number;
  }>;
  slug: string;
  username: string;
}

export default function SalonPage({ params }: { params: { idOrSlug: string } }) {
  const router = useRouter();
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        setLoading(true);
        const salonData = await getSalonDetails(params.idOrSlug);
        setSalon(salonData);
          // Ensure URL uses the current username
        if (salonData?.username) {
          ensureSalonUrlUsesUsername(salonData.username, router);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load salon details');
      } finally {
        setLoading(false);
      }
    };

    fetchSalonDetails();
  }, [params.idOrSlug, router]);

  const handleCheckIn = () => {
    if (salon) {
      router.push(`/salons/${salon.username}/check-in`);
    }
  };

  const handleAppointment = () => {
    if (salon) {
      router.push(`/salons/${salon.username}/appointment`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading salon details...</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <Clock className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Salon Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || "The salon you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.push('/salons')} variant="outline">
            Browse All Salons
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <Card className="p-8 mb-8 shadow-xl border-0 bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4"
              >
                <Star className="h-10 w-10 text-primary" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              >
                {salon.name}
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground"
              >
                <Globe className="h-3 w-3" />
                <span>{getTimezoneDisplayName(salon.timezone)}</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 text-muted-foreground"
              >
                <MapPin className="h-5 w-5" />
                <span>{salon.address}, {salon.city}, {salon.state} {salon.zip_code}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-4"
              >
                <Badge 
                  variant={salon.is_open ? "default" : "secondary"}
                  className={`px-3 py-1 ${salon.is_open ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {salon.is_open ? 'Open Now' : 'Closed'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {convertFormattedHoursToUserTimezone(salon.formatted_hours, salon.timezone)}
                </span>
              </motion.div>
            </div>
          </Card>

          {/* Main Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {/* Check-In Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden">
              <div className="p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/5 group-hover:from-blue-500/20 group-hover:to-blue-600/10 transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-full transition-all duration-300">
                    <UserCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold">Quick Check-In</h3>
                  <p className="text-muted-foreground">
                    Join the queue instantly and wait comfortably. Get real-time updates on your position.
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span>Est. wait time: {salon.estimated_wait_time} minutes</span>
                    </div>                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{salon.barbers?.length || 0} barbers available</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckIn}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                    disabled={!salon.is_open}
                  >
                    <UserCheck className="mr-2 h-5 w-5" />
                    {salon.is_open ? 'Check In Now' : 'Currently Closed'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Appointment Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden">
              <div className="p-8 bg-gradient-to-br from-green-500/10 to-green-600/5 group-hover:from-green-500/20 group-hover:to-green-600/10 transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 group-hover:bg-green-500/20 rounded-full transition-all duration-300">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold">Book Appointment</h3>
                  <p className="text-muted-foreground">
                    Schedule your visit in advance. Choose your preferred barber and service.
                  </p>
                    <div className="space-y-2 text-sm">                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Star className="h-4 w-4" />
                      <span>{salon.services?.length || 0} services available</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Choose your preferred barber</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAppointment}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Schedule Appointment
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Salon Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card className="p-6">
              <h4 className="text-xl font-semibold mb-4">Salon Information</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{salon.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>{salon.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{salon.formatted_hours}</span>
                  </div>

                </div>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-2">Our Barbers ({salon.barbers?.length || 0})</h5>
                    <div className="flex flex-wrap gap-2">
                      {salon.barbers?.slice(0, 3).map((barber) => (
                        <Badge key={barber.id} variant="outline">
                          {barber.full_name}
                        </Badge>
                      )) || []}
                      {(salon.barbers?.length || 0) > 3 && (
                        <Badge variant="secondary">
                          +{(salon.barbers?.length || 0) - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                    <div>
                    <h5 className="font-medium mb-2">Services ({salon.services?.length || 0})</h5>
                    <div className="flex flex-wrap gap-2">
                      {salon.services?.slice(0, 3).map((service) => (
                        <Badge key={service.id} variant="outline">
                          {service.name}
                        </Badge>
                      )) || []}
                      {(salon.services?.length || 0) > 3 && (
                        <Badge variant="secondary">
                          +{(salon.services?.length || 0) - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>          {/* Quick Actions Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-center mt-8"
          >
            <Button 
              variant="outline"
              onClick={() => router.push(`/salons/${salon.username}/queue`)}
              className="px-8 py-3"
            >
              View Current Queue
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
