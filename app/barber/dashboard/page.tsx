"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  CalendarIcon, 
  Clock,
  Users,
  Scissors,
  Calendar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { BarberMetrics } from "@/types/barber/metrics";

export default function BarberDashboardPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<BarberMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("week");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/barber/metrics?time_period=${timeFilter}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch metrics");
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error("Error fetching barber metrics:", err);
        setError("Could not load metrics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [timeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Barber Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your performance and manage your schedule
          </p>
        </div>
        
        <Tabs 
          value={timeFilter} 
          onValueChange={setTimeFilter}
          className="mt-4 sm:mt-0"
        >
          <TabsList>
            <TabsTrigger value="day" className="text-xs sm:text-sm">Today</TabsTrigger>
            <TabsTrigger value="week" className="text-xs sm:text-sm">This Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="bg-destructive/10 p-4 rounded-lg text-destructive mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Customers Served Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers Served
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-6 w-6 text-primary mr-2" />
              {loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <div className="text-3xl font-bold">
                  {metrics?.customers_served || 0}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {timeFilter === "day" 
                ? "Total customers served today" 
                : timeFilter === "week" 
                  ? "Total customers served this week"
                  : "Total customers served this month"}
            </p>
          </CardContent>
        </Card>

        {/* Average Service Duration Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Service Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-primary mr-2" />
              {loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <div className="text-3xl font-bold">
                  {metrics?.avg_service_duration_minutes || 0} min
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Average time spent per customer
            </p>
          </CardContent>
        </Card>        {/* Upcoming Appointments Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-primary mr-2" />
              {loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <div className="text-3xl font-bold">
                  {metrics?.upcoming_appointments || 0}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {timeFilter === "day" 
                ? "Appointments for the rest of today" 
                : timeFilter === "week" 
                  ? "Appointments for this week"
                  : "Appointments for this month"}
            </p>
          </CardContent>
        </Card>
      </div>      {/* Performance Chart */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <span>Customers Served</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              <span>Service Duration (min)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </div>
          ) : metrics && metrics.daily_data && metrics.daily_data.length > 0 ? (
            <div className="h-[250px] flex items-end justify-between gap-2">
              {metrics.daily_data.map((day, i) => {
                // Calculate metrics for display
                const maxCustomers = Math.max(...metrics.daily_data.map(d => d.customers_served)) || 1;
                const customerHeightPercentage = (day.customers_served / maxCustomers) * 100;
                
                // Get average service duration for this day (if available)
                const serviceDuration = day.avg_service_duration || 0;
                const maxDuration = Math.max(...metrics.daily_data.map(d => d.avg_service_duration || 0)) || 30;
                const durationHeightPercentage = (serviceDuration / maxDuration) * 100;
                
                return (
                  <div key={i} className="flex flex-col items-center w-full group relative">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div>Served: {day.customers_served}</div>
                      <div>Duration: {serviceDuration} min</div>
                    </div>
                    
                    <div className="w-full flex gap-1 justify-center">
                      {/* Customers bar */}
                      <div 
                        style={{ height: `${customerHeightPercentage}%`, minHeight: '4px' }} 
                        className="w-1/3 bg-primary rounded-t-md transition-all duration-300 ease-in-out"
                      />
                      
                      {/* Duration bar */}
                      <div 
                        style={{ height: `${durationHeightPercentage}%`, minHeight: '4px' }} 
                        className="w-1/3 bg-blue-400 rounded-t-md transition-all duration-300 ease-in-out"
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(day.date)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <BarChart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No performance data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <CalendarIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No scheduled appointments today</p>
            <Button variant="outline" className="mt-4">
              View Full Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
