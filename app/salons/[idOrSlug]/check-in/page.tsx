"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSalonDetails } from "@/lib/services/salonService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ensureSalonUrlUsesUsername } from "@/lib/utils/navigation";

interface Employee {
  id: number;
  full_name: string;
  status: string;
  services: Array<{
    id: number;
    name: string;
    duration: number;
    price: number;
  }>;
}

// Keep Barber alias for backward compatibility
interface Barber extends Employee {}

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
  employees: Employee[]; // Changed from barbers
  barbers: Employee[]; // Keep for backward compatibility
  services: Service[];
  slug: string;
  username: string;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

export default function CheckInPage({ params }: { params: { idOrSlug: string } }) {
  const router = useRouter();
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [errors, setErrors] = useState({
    fullName: "",
    phoneNumber: "",
  });
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isAdvancedCheckIn, setIsAdvancedCheckIn] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        console.log('Fetching salon details for:', params.idOrSlug);
        const data = await getSalonDetails(params.idOrSlug);
        
        if (!data) {
          console.error('No salon data returned');
          setError('Salon information could not be loaded');
          return;
        }
        
        console.log('Salon details fetched successfully:', data.name);
        setSalon(data);
        setError(null);
          // Ensure URL uses the current username
        if (data?.username) {
          ensureSalonUrlUsesUsername(data.username, router);
        }
      } catch (error) {
        console.error('Error fetching salon details:', error);
        setError(error instanceof Error ? error.message : 'Failed to load salon information');
      } finally {
        setLoading(false);
      }
    };

    fetchSalonDetails();
  }, [params.idOrSlug, router]);

  const validateFullName = (name: string) => {
    if (name.length < 3) {
      setErrors(prev => ({ ...prev, fullName: "Name should contain at least 3 characters" }));
    } else {
      setErrors(prev => ({ ...prev, fullName: "" }));
    }
  };

  const validatePhoneNumber = (phone: string) => {
    if (phone.length < 7 || phone.length > 12) {
      setErrors(prev => ({ ...prev, phoneNumber: "Phone number should be between 7-12 characters" }));
    } else {
      setErrors(prev => ({ ...prev, phoneNumber: "" }));
    }
  };
  const handleCheckIn = async () => {
    if (!salon) {
      toast.error("Salon information not available");
      return;
    }
    
    try {
      setIsCheckingIn(true);
      
      const checkInData = {
        business_id: Number(salon.id), // Changed from shop_id
        service_id: isAdvancedCheckIn ? selectedService : null,
        employee_id: isAdvancedCheckIn ? selectedBarber : null, // Changed from barber_id
        full_name: fullName,
        phone_number: phoneNumber,
        number_of_people: Number(numberOfPeople),
      };
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queue/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkInData),
      });
      console.log(checkInData);
  
      const data = await response.json();
  
      if (!response.ok) {
        // Extract the specific error detail
        const errorMessage = data.detail || 'Failed to check in';
        
        // Handle the "Already in queue" error specifically
        if (errorMessage === "Already in queue") {
          throw new Error("You're already in the queue for this salon");
        }
        
        throw new Error(errorMessage);
      }
  
      // Store check-in data in localStorage
      localStorage.setItem('checkInPhone', phoneNumber);
      localStorage.setItem('checkInShopId', salon.id.toString());
      
      // Redirect to status page
      window.location.href = `/salons/${salon.username}/my-status`;
      
    } catch (error) {
      toast.error("Check-in Failed", {
        description: error instanceof Error ? error.message : "Failed to check in",
      });
    } finally {
      setIsCheckingIn(false);
    }
  }
  const getEmployeesByService = (serviceId: number | null) => {
    if (!salon) return [];
    if (!serviceId) return salon.employees || salon.barbers; // Support both field names
    
    const employees = salon.employees || salon.barbers;
    return employees.filter(employee => 
      employee.services.some(service => service.id === serviceId)
    );
  };

  // Keep old function name for backward compatibility
  const getBarbersByService = getEmployeesByService;

  const handleServiceSelection = (serviceId: number) => {
    setSelectedService(serviceId);
    setSelectedBarber(null);
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div className="animate-pulse">Loading salon details...</div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="container py-8">
        <Card className="p-8 max-w-3xl mx-auto shadow-lg rounded-lg">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-xl font-semibold">
              {error || 'Salon not found'}
            </div>
            <p className="text-muted-foreground">
              We couldn't find the salon you're looking for. This might be due to:
            </p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto text-muted-foreground">
              <li>An incorrect URL or salon ID</li>
              <li>The salon may have been removed or renamed</li>
              <li>A temporary issue with our server</li>
            </ul>
            <div className="pt-4">
              <Link href="/salons">
                <Button variant="default">Browse All Salons</Button>
              </Link>
            </div>
          </div>
        </Card>
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
      <Card className="p-8 max-w-3xl mx-auto shadow-lg rounded-lg">
        <div className="space-y-6">
          {/* Salon Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-6 text-primary">{salon.name}</h1>
            
            {/* Improved Shop Details Layout */}
            <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">{salon.address}</p>
                    <p className="text-muted-foreground">{salon.city}, {salon.state} {salon.zip_code}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-muted-foreground">{salon.formatted_hours}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Contact</p>
                    <p className="text-muted-foreground">{salon.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{salon.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge - Updated Design */}
          <div className="border-t pt-6">
            <Card className="p-4 bg-background border-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${salon.is_open ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <Clock className={`h-5 w-5 ${salon.is_open ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${salon.is_open ? 'text-green-500' : 'text-red-500'}`}>
                      {salon.is_open ? 'Currently Open' : 'Currently Closed'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Business Hours: {salon.formatted_hours}
                    </p>
                  </div>
                </div>
                {salon.is_open && (
                  <div className="text-green-500 font-medium">
                    Est. Wait: {salon.estimated_wait_time} mins
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Customer Information Section - Moved Up */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-4">Your Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    validateFullName(e.target.value);
                  }}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(numericValue);
                    validatePhoneNumber(numericValue);
                  }}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>
              <div>
                <Label htmlFor="numberOfPeople">Number of People</Label>
                <Select value={numberOfPeople} onValueChange={setNumberOfPeople}>
                  <SelectTrigger id="numberOfPeople">
                    <SelectValue placeholder="Select number of people" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Person' : 'People'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Advanced Check-in Toggle */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-6">
              <Label htmlFor="advancedCheckIn" className="text-lg font-medium">Advanced Check-in</Label>
              <Switch
                id="advancedCheckIn"
                checked={isAdvancedCheckIn}
                onCheckedChange={setIsAdvancedCheckIn}
              />
            </div>

            {isAdvancedCheckIn && (
              <>
                {/* Services Section */}
                <div className="space-y-4 mb-6">
                  <h2 className="text-xl font-semibold">Select a Service</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {salon.services.map((service) => (
                      <Card
                        key={service.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedService === service.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleServiceSelection(service.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Duration: {service.duration} min
                            </p>
                          </div>
                          <p className="font-medium text-primary">${service.price}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Updated Barbers Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Select a Barber</h2>
                  {selectedService ? (
                    <>
                      {getBarbersByService(selectedService).length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {getBarbersByService(selectedService).map((barber) => (
                            <Card
                              key={barber.id}
                              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                                selectedBarber === barber.id ? 'ring-2 ring-primary' : ''
                              }`}
                              onClick={() => setSelectedBarber(barber.id)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                  <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{barber.full_name}</p>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    Status: {barber.status.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No Barbers Available</AlertTitle>
                          <AlertDescription>
                            {(salon.employees || salon.barbers)?.length === 0 ? (
                              "This salon doesn't have any barbers registered yet. Please try another salon."
                            ) : (
                              "No barbers are currently available for this service. Please select a different service or try again later."
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Select a Service</AlertTitle>
                      <AlertDescription>
                        Please select a service first to see available barbers.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Navigation and Check-in Button */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-4 w-full">
                <Link 
                  href={`/salons/${salon ? salon.username : params.idOrSlug}/queue`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    View Current Queue
                  </Button>
                </Link>
              </div>

              {!salon.is_open && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Shop is Closed</AlertTitle>
                  <AlertDescription>
                    You cannot check in at this time as the shop is currently closed. Please try again during business hours: {salon.formatted_hours}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                className="w-full"
                size="lg"                disabled={
                  isCheckingIn ||
                  !fullName || 
                  !phoneNumber || 
                  (!salon.is_open) ||
                  !!errors.fullName || 
                  !!errors.phoneNumber ||
                  (isAdvancedCheckIn && !selectedBarber) ||
                  ((salon.employees || salon.barbers)?.length || 0) === 0
                }
                onClick={handleCheckIn}
              >
                {isCheckingIn ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Checking In...
                  </>
                ) : (
                  "Check In Now"
                )}
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {(errors.fullName || errors.phoneNumber) && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Please correct the following errors:
                <ul className="list-disc list-inside mt-2">
                  {errors.fullName && <li>{errors.fullName}</li>}
                  {errors.phoneNumber && <li>{errors.phoneNumber}</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </motion.div>
  );
}