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
        </Card>

        {/* Upcoming Appointments Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-primary mr-2" />
              <div className="text-3xl font-bold">0</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Appointments for the rest of today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ) : metrics && metrics.daily_data && metrics.daily_data.length > 0 ? (
            <div className="h-[200px] flex items-end justify-between gap-2">
              {metrics.daily_data.map((day, i) => {
                const maxValue = Math.max(...metrics.daily_data.map(d => d.customers_served)) || 1;
                const heightPercentage = (day.customers_served / maxValue) * 100;
                
                return (
                  <div key={i} className="flex flex-col items-center w-full">
                    <div style={{ height: `${heightPercentage}%`, minHeight: '4px' }} 
                      className="w-full bg-primary/80 rounded-t-md"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(day.date)}
                    </p>
                    <p className="text-xs font-medium">
                      {day.customers_served}
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
