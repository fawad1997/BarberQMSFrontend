"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, Clock, MapPin, User, Phone, Mail, ArrowLeft, Download, Share2, CalendarPlus, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getSalonDetails } from "@/lib/services/salonService";
import { getUserTimezone, getTimezoneDisplayName } from "@/lib/utils/timezone";
import { toast } from "sonner";
import Link from "next/link";

interface AppointmentDetails {
  id: string;
  date: string;
  time: string;
  service: string;
  barber: string;
  duration: number;
  price: number;
  status: string;
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
  timezone: string;
  username: string;
}

export default function AppointmentConfirmationPage({ params }: { params: { idOrSlug: string } }) {
  const router = useRouter();
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTimezone, setUserTimezone] = useState<string>("");

  const handleDownloadReceipt = () => {
    if (!appointment || !salon) return;

    // Generate HTML receipt for printing/saving as PDF
    const generateReceiptHTML = () => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Confirmation - ${salon.name}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #333; }
            .confirmation { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .salon-info { background: #f1f3f4; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">WalkInOnline</div>
            <h2>Appointment Confirmation</h2>
          </div>
          
          <div class="confirmation">
            <h3 style="color: #28a745; margin: 0 0 10px 0;">✓ Appointment Confirmed</h3>
            <p>Your appointment has been successfully booked. Please keep this confirmation for your records.</p>
          </div>

          <div class="details">
            <h3>Appointment Details</h3>
            <div class="detail-row">
              <span>Confirmation ID:</span>
              <span><strong>#${appointment.id}</strong></span>
            </div>
            <div class="detail-row">
              <span>Customer:</span>
              <span><strong>${appointment?.id && localStorage.getItem('appointmentData') ? JSON.parse(localStorage.getItem('appointmentData') || '{}').customer_name || 'Walk-in Customer' : 'Walk-in Customer'}</strong></span>
            </div>
            <div class="detail-row">
              <span>Phone:</span>
              <span><strong>${appointment?.id && localStorage.getItem('appointmentData') ? JSON.parse(localStorage.getItem('appointmentData') || '{}').customer_phone || 'N/A' : 'N/A'}</strong></span>
            </div>
            <div class="detail-row">
              <span>Date:</span>
              <span><strong>${appointment.date}</strong></span>
            </div>
            <div class="detail-row">
              <span>Time:</span>
              <span><strong>${appointment.time}</strong></span>
            </div>
            <div class="detail-row">
              <span>Service:</span>
              <span><strong>${appointment.service}</strong></span>
            </div>
            <div class="detail-row">
              <span>Barber:</span>
              <span><strong>${appointment.barber}</strong></span>
            </div>
            <div class="detail-row">
              <span>Duration:</span>
              <span><strong>${appointment.duration} minutes</strong></span>
            </div>
            <div class="total">
              Total: $${appointment.price}
            </div>
          </div>

          <div class="salon-info">
            <h3>${salon.name}</h3>
            <p><strong>Address:</strong> ${salon.address}, ${salon.city}, ${salon.state} ${salon.zip_code}</p>
            <p><strong>Phone:</strong> ${salon.phone_number}</p>
            ${salon.email ? `<p><strong>Email:</strong> ${salon.email}</p>` : ''}
          </div>

          <div style="margin: 30px 0; padding: 15px; background: #fff3cd; border-radius: 6px;">
            <h4 style="margin: 0 0 10px 0;">Important Reminders:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Please arrive 5-10 minutes before your appointment time</li>
              <li>Bring a valid ID for verification</li>
              <li>Cancellations must be made at least 2 hours in advance</li>
              <li>Contact the salon directly for any changes or questions</li>
            </ul>
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>WalkInOnline - Your trusted appointment booking platform</p>
          </div>
        </body>
        </html>
      `;
    };

    try {
      const htmlContent = generateReceiptHTML();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `appointment-receipt-${salon.name.replace(/\s+/g, '-').toLowerCase()}-${appointment.date.replace(/\//g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Receipt downloaded!", {
        description: "Open the file in your browser to print or save as PDF."
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error("Download failed", {
        description: "Please try again or contact support."
      });
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Get user timezone
        const timezone = getUserTimezone();
        setUserTimezone(timezone);

        // Get salon details
        const salonData = await getSalonDetails(params.idOrSlug);
        setSalon(salonData);

        // Get appointment details from localStorage
        const appointmentId = localStorage.getItem('lastAppointmentId');
        const shopId = localStorage.getItem('appointmentShopId');
        const appointmentData = localStorage.getItem('appointmentData');
        
        if (!appointmentId || !shopId) {
          toast.error("No appointment found", {
            description: "Please book an appointment first."
          });
          router.push(`/salons/${params.idOrSlug}`);
          return;
        }

        // Try to get real appointment data from localStorage or API
        let appointmentDetails: AppointmentDetails;
        
        if (appointmentData) {
           // Parse stored appointment data
           const parsedData = JSON.parse(appointmentData);
           
           // Format date properly
           let formattedDate = new Date().toLocaleDateString();
           if (parsedData.appointment_date) {
             if (parsedData.appointment_date instanceof Date) {
               formattedDate = parsedData.appointment_date.toLocaleDateString();
             } else if (typeof parsedData.appointment_date === 'string') {
               const dateObj = new Date(parsedData.appointment_date);
               if (!isNaN(dateObj.getTime())) {
                 formattedDate = dateObj.toLocaleDateString();
               }
             }
           }
           
           // Format time properly
           let formattedTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
           if (parsedData.appointment_time) {
             if (typeof parsedData.appointment_time === 'string') {
               // If it's already a formatted time string, use it
               if (parsedData.appointment_time.includes(':')) {
                 formattedTime = parsedData.appointment_time;
               } else {
                 // Try to parse as date
                 const timeObj = new Date(parsedData.appointment_time);
                 if (!isNaN(timeObj.getTime())) {
                   formattedTime = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                 }
               }
             }
           }
           
           appointmentDetails = {
             id: appointmentId,
             date: formattedDate,
             time: formattedTime,
             service: parsedData.service_name || "Walk-in Service",
             barber: parsedData.barber_name || "Any Available Barber",
             duration: parsedData.service_duration || 30,
             price: parsedData.service_price || 0,
             status: "confirmed"
           };
        } else {
          // Fallback: Try to fetch from API or use basic data
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`);
            if (response.ok) {
              const apiData = await response.json();
              appointmentDetails = {
                id: apiData.id?.toString() || appointmentId,
                date: apiData.appointment_time ? new Date(apiData.appointment_time).toLocaleDateString() : new Date().toLocaleDateString(),
                time: apiData.appointment_time ? new Date(apiData.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                service: apiData.service?.name || "Walk-in Service",
                barber: apiData.employee?.full_name || "Any Available Barber",
                duration: apiData.service?.duration || 30,
                price: apiData.service?.price || 0,
                status: apiData.status || "confirmed"
              };
            } else {
              throw new Error('Failed to fetch appointment details');
            }
          } catch (error) {
            console.warn('Could not fetch appointment details from API, using fallback data:', error);
            // Fallback to basic confirmed appointment
            appointmentDetails = {
              id: appointmentId,
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              service: "Walk-in Service",
              barber: "Any Available Barber",
              duration: 30,
              price: 0,
              status: "confirmed"
            };
          }
        }
         
         setAppointment(appointmentDetails);
      } catch (error) {
        console.error('Error loading confirmation page:', error);
        toast.error("Error loading confirmation", {
          description: "Please try again or contact support."
        });
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [params.idOrSlug, router]);

  const handleShare = async () => {
    if (navigator.share && appointment && salon) {
      try {
        await navigator.share({
          title: 'Appointment Confirmation',
          text: `Appointment confirmed at ${salon.name} on ${appointment.date} at ${appointment.time}`,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownloadCalendar = () => {
    if (!appointment || !salon) return;

    // Generate calendar event (.ics file)
    const generateCalendarEvent = () => {
      const startDate = new Date(`${appointment.date} ${appointment.time}`);
      const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
      
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//WalkInOnline//Appointment//EN',
        'BEGIN:VEVENT',
        `UID:appointment-${appointment.id}@walkinonline.com`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${appointment.service} at ${salon.name}`,
        `DESCRIPTION:Appointment with ${appointment.barber}\nService: ${appointment.service}\nDuration: ${appointment.duration} minutes\nPrice: $${appointment.price}\nCustomer: ${(() => {
          const appointmentData = localStorage.getItem('appointmentData');
          if (appointmentData) {
            const parsedData = JSON.parse(appointmentData);
            return parsedData.customer_name || 'Walk-in Customer';
          }
          return 'Walk-in Customer';
        })()}\nPhone: ${(() => {
          const appointmentData = localStorage.getItem('appointmentData');
          if (appointmentData) {
            const parsedData = JSON.parse(appointmentData);
            return parsedData.customer_phone || 'N/A';
          }
          return 'N/A';
        })()}`,
        `LOCATION:${salon.address}, ${salon.city}, ${salon.state} ${salon.zip_code}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Appointment reminder',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      return icsContent;
    };

    try {
      const icsContent = generateCalendarEvent();
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `appointment-${salon.name.replace(/\s+/g, '-').toLowerCase()}-${appointment.date.replace(/\//g, '-')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Calendar event downloaded!", {
        description: "Add this to your calendar to get reminders."
      });
    } catch (error) {
      console.error('Error generating calendar event:', error);
      toast.error("Download failed", {
        description: "Please try again or contact support."
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!salon || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No appointment found</p>
            <Button asChild>
              <Link href={`/salons/${params.idOrSlug}`}>Book New Appointment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/salons/${params.idOrSlug}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Salon
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCalendar}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
                <FileText className="h-4 w-4 mr-2" />
                Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          {/* Success Header */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Appointment Confirmed!
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Your appointment has been successfully booked. We look forward to seeing you!
              </p>
            </div>
          </motion.div>

          {/* Appointment Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Appointment Details</h2>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{appointment.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{appointment.time}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTimezoneDisplayName(userTimezone)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Service & Barber */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Barber</p>
                      <p className="font-medium">{appointment.barber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-medium">{appointment.service}</p>
                      <p className="text-sm text-muted-foreground">{appointment.duration} minutes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${appointment.price}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Salon Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <h2 className="text-xl font-semibold">Salon Information</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{salon.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {salon.address}<br />
                        {salon.city}, {salon.state} {salon.zip_code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{salon.phone_number}</p>
                      </div>
                    </div>
                    
                    {salon.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{salon.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Button asChild className="flex-1 h-12">
              <Link href={`/salons/${params.idOrSlug}`} className="flex items-center justify-center">
                Book Another Appointment
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1 h-12">
              <Link href={`/salons/${params.idOrSlug}/my-status`} className="flex items-center justify-center">
                View My Status
              </Link>
            </Button>
          </motion.div>

          {/* Important Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="bg-muted/30 rounded-lg p-6 space-y-3"
          >
            <h3 className="font-medium text-foreground">Important Notes:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Please arrive 5-10 minutes before your appointment time</li>
              <li>• Bring a valid ID for verification</li>
              <li>• Cancellations must be made at least 2 hours in advance</li>
              <li>• Contact the salon directly for any changes or questions</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}