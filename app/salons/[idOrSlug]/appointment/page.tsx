"use client";

import { useEffect, useState } from "react";
import { getSalonDetails } from "@/lib/services/salonService";
import { US_TIMEZONES } from "@/types/shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Mail, User, Calendar, AlertCircle, Globe } from 'lucide-react';
import { getUserTimezone, getTimezoneDisplayName, convertFormattedHoursToUserTimezone, isTimeWithinBusinessHours, convertTimeFromUserToShopTimezone, convertTimeToUserTimezone } from "@/lib/utils/timezone";
import { motion } from "framer-motion";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

interface Schedule {
  id: number;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  day_name?: string; // Optional property for display
  formatted_time?: string; // Optional property for display
}

interface Barber {
  id: number;
  full_name: string;
  services: { id: number }[];
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
  timezone: string;
  barbers: Barber[];
  employees?: Barber[];
  services: Service[];
  slug: string;
  username: string;
}

interface AppointmentRequest {
  business_id: number; // Changed from shop_id
  employee_id: number | null; // Changed from barber_id
  service_id: number | null;
  appointment_time: string;
  number_of_people: number;
  user_id: number | null;
  full_name: string;
  phone_number: string;
  user_timezone?: string; // User's timezone for proper conversion
}

export default function AppointmentPage({ params }: { params: { idOrSlug: string } }) {
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [errors, setErrors] = useState({
    fullName: "",
    phoneNumber: "",
  });
  const [isAdvanceBooking, setIsAdvanceBooking] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [timeError, setTimeError] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        const data = await getSalonDetails(params.idOrSlug);
        setSalon(data);
      } catch (error) {
        console.error('Error fetching salon details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonDetails();
  }, [params.idOrSlug]);

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
  };  const getFormattedDateTime = () => {
    if (!appointmentDate || !appointmentTime || !salon?.timezone) return "";
    
    // The simplest approach: send the user's time as is, and let the backend 
    // handle the timezone conversion properly. The backend knows both timezones
    // and can do the conversion correctly.
    return new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const isWithinBusinessHours = (time: string) => {
    if (!salon?.formatted_hours || !time || !salon?.timezone) return false;
    
    // Get user's timezone
    const userTimezone = getUserTimezone();
    
    // Use timezone-aware validation
    return isTimeWithinBusinessHours(time, salon.formatted_hours, salon.timezone, userTimezone);
  };  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value;
    setAppointmentTime(selectedTime);
    
    if (!isWithinBusinessHours(selectedTime)) {
      const userTimezone = getUserTimezone();
      const shopTime = convertTimeFromUserToShopTimezone(selectedTime, userTimezone, salon?.timezone || '');
      
      // Parse the original business hours to get clean start/end times
      const timeRangeRegex = /(\d{1,2}:\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i;
      const match = salon?.formatted_hours?.match(timeRangeRegex);
      
      let userFriendlyHours = salon?.formatted_hours || '';
      
      if (match) {
        const [, startTime, startPeriod, endTime, endPeriod] = match;
        
        // Convert shop hours to user timezone
        const convert12to24 = (time: string, period?: string): string => {
          if (!period) return time;
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period.toLowerCase() === 'pm' && hours !== 12) {
            hour24 += 12;
          } else if (period.toLowerCase() === 'am' && hours === 12) {
            hour24 = 0;
          }
          return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };
        
        const startTime24 = convert12to24(startTime, startPeriod);
        const endTime24 = convert12to24(endTime, endPeriod);
        
        // Convert to user timezone
        const userStartTime = convertTimeToUserTimezone(startTime24, salon?.timezone || '', userTimezone);
        const userEndTime = convertTimeToUserTimezone(endTime24, salon?.timezone || '', userTimezone);
        
        // Convert back to 12-hour format for display
        const convertTo12Hour = (time: string): string => {
          const [hours, minutes] = time.split(':').map(Number);
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        };
        
        userFriendlyHours = `${convertTo12Hour(userStartTime)} - ${convertTo12Hour(userEndTime)}`;
      }
      
      setTimeError(
        `Selected time (${shopTime} in shop timezone) is outside operating hours. ` +
        `Please select a time between ${userFriendlyHours} (your local time).`
      );
    } else {
      setTimeError("");
    }
  };

  const handleBookAppointment = async () => {
    if (!salon) {
      toast.error("Salon information not available");
      return;
    }
    
    try {
      setIsBooking(true);
        const appointmentData: AppointmentRequest = {
        business_id: Number(salon.id), // Changed from shop_id
        employee_id: isAdvanceBooking ? selectedBarber : null, // Changed from barber_id
        service_id: isAdvanceBooking ? selectedService : null,
        appointment_time: getFormattedDateTime(),
        number_of_people: Number(numberOfPeople),
        user_id: null,
        full_name: fullName,
        phone_number: phoneNumber,
        user_timezone: getUserTimezone(), // Include user's timezone
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      const data = await response.json();

      if (!response.ok) {
        // Extract the specific error message from different possible response formats
        let errorMessage = 'Failed to book appointment';
        
        // Check if there's a direct message in the response
        if (typeof data.message === 'string') {
          errorMessage = data.message;
        }
        // Check if there's a direct error in the response
        else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
        // Check if we have a detail field with an array of validation errors
        else if (data.detail && Array.isArray(data.detail)) {
          // Extract the actual error message from the validation errors
          const messages = data.detail.map((error: any) => {
            // If msg property exists, use that
            if (error.msg) return error.msg;
            // Sometimes the message might be directly in the error
            if (typeof error === 'string') return error;
            return null;
          }).filter(Boolean);
          
          if (messages.length > 0) {
            errorMessage = messages.join('. ');
          }
        }
        // If there's a string detail field
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
        
        throw new Error(errorMessage);
      } else {
        // Success - show confirmation and redirect
        toast.success("Appointment booked successfully!");
        
        // Store the appointment reference in localStorage
        localStorage.setItem('lastAppointmentId', data.id?.toString() || '');
        localStorage.setItem('appointmentShopId', salon.id.toString());
        
        // Redirect to confirmation or status page using the slug for the URL
        window.location.href = `/salons/${salon.username}/appointment-confirmation`;
      }
    } catch (error) {
      toast.error("Booking Failed", {
        description: error instanceof Error ? error.message : "Failed to book appointment",
      });
    } finally {
      setIsBooking(false);
    }
  };
  // Add this helper function to filter barbers based on selected service
  const getBarbersByService = (serviceId: number | null) => {
    if (!salon) return [];
    const barbers = salon.employees || salon.barbers || [];
    if (!serviceId) return barbers;
    
    return barbers.filter(barber => 
      barber.services.some(service => service.id === serviceId)
    );
  };
  const handleServiceSelection = (serviceId: number) => {
    setSelectedService(serviceId);
    setSelectedBarber(null);
  };

  // Helper function to format schedule display
  const formatScheduleDisplay = (schedule: Schedule) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = schedule.day_name || dayNames[schedule.day_of_week] || 'Unknown';
    const timeDisplay = schedule.formatted_time || `${schedule.start_time} - ${schedule.end_time}`;
    return `${dayName}: ${timeDisplay}`;
  };

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
      <Card className="p-8 max-w-3xl mx-auto shadow-lg rounded-lg">
        <div className="space-y-6">
          {/* Salon Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2 text-primary">{salon.name}</h1>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-6">
              <Globe className="h-3 w-3" />
              <span>{getTimezoneDisplayName(salon.timezone)}</span>
            </div>
            
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
                    <p className="text-muted-foreground">
                      {convertFormattedHoursToUserTimezone(salon.formatted_hours, salon.timezone)}
                      <span className="text-xs opacity-75 block">(Your time)</span>
                    </p>
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

          {/* Status Badge */}
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
                    </h3>                    <p className="text-sm text-muted-foreground">
                      Business Hours: {salon.formatted_hours}
                      <span className="text-xs opacity-75 ml-1">(Shop time)</span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Appointment Details Section */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-4">Appointment Details</h2>
            
            {/* Advanced Booking Toggle */}
            <div className="flex items-center justify-between mb-6">
              <Label htmlFor="advanceBooking" className="text-lg font-medium">Advanced Booking</Label>
              <Switch
                id="advanceBooking"
                checked={isAdvanceBooking}
                onCheckedChange={setIsAdvanceBooking}
              />
            </div>
            
            {/* Date and Time Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointmentDate">Date</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  min={getTomorrowDate()}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>              <div>
                <Label htmlFor="appointmentTime">Time</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={appointmentTime}
                  onChange={handleTimeChange}
                  required
                />
                {timeError && <p className="text-red-500 text-sm mt-1">{timeError}</p>}                {appointmentTime && !timeError && salon?.timezone && (
                  <p className="text-green-600 text-sm mt-1">
                    ✓ {convertTimeFromUserToShopTimezone(appointmentTime, getUserTimezone(), salon.timezone)} in shop timezone - Within operating hours
                  </p>
                )}
                {appointmentTime && timeError && salon?.timezone && (
                  <p className="text-orange-600 text-sm mt-1">
                    {convertTimeFromUserToShopTimezone(appointmentTime, getUserTimezone(), salon.timezone)} in shop timezone
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Times are automatically converted to the shop's timezone ({getTimezoneDisplayName(salon?.timezone || '')})
                </p>
              </div>
            </div>
            
            {isAdvanceBooking && (
              <>
                {/* Services Section */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-semibold">Select a Service</h3>
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

                {/* Barbers Section */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-semibold">Select a Barber</h3>
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
                                  <p className="font-medium">{barber.full_name}</p>                                  <div className="text-sm text-muted-foreground mt-1">
                                    {barber.schedules.map((schedule) => (
                                      <p key={schedule.id}>
                                        {formatScheduleDisplay(schedule)}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No Barbers Available</AlertTitle>
                          <AlertDescription>
                            {((salon.employees || salon.barbers)?.length || 0) === 0 ? (
                          "This salon doesn't have any barbers registered yet. Please try another salon."
                        ) : (
                          "No barbers are scheduled to work at the selected time. Please try a different time, date, or service."
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

          {/* Personal Information Section */}
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

          {/* Navigation and Book Button */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-4 w-full">
                <Link 
                  href={`/salons/${salon.username}/check-in`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Go to Check-In
                  </Button>
                </Link>
              </div>
              
              <Button
                className="w-full"
                size="lg"
                onClick={handleBookAppointment}                disabled={
                  isBooking ||
                  !fullName || 
                  !phoneNumber || 
                  !appointmentDate ||
                  !appointmentTime ||
                  !!timeError ||
                  !!errors.fullName || 
                  !!errors.phoneNumber ||
                  (isAdvanceBooking && !selectedBarber)
                }
              >
                {isBooking ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {(errors.fullName || errors.phoneNumber || timeError) && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Please correct the following errors:
                <ul className="list-disc list-inside mt-2">
                  {errors.fullName && <li>{errors.fullName}</li>}
                  {errors.phoneNumber && <li>{errors.phoneNumber}</li>}
                  {timeError && <li>{timeError}</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </motion.div>
  );
}