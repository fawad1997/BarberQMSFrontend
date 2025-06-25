"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getDashboardData } from "@/lib/services/shopService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Users,
  Clock,
  Activity,
  CheckSquare,
  XSquare,
  User as UserIcon
} from "lucide-react";

function formatWaitTime(seconds: number): string {
  if (seconds === 0) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "SHOP_OWNER") {
      router.replace("/login");
      return;
    }
    if (!session.user.accessToken || session.user.accessToken.trim() === "") {
      router.replace("/login?error=InvalidToken");
      return;
    }
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardData(session.user.accessToken);
        if (isMounted) setDashboardData(data);
      } catch (err: any) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 300000); // Poll every 5 minutes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session, status, router]);

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-600">{error}</div>;
  }
  if (!dashboardData) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Shop Dashboard
      </h1>
      {/* Daily Insights */}
      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Daily Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Customers Today */}
            <Card className="border-none shadow-sm bg-blue-50">
              <CardContent className="flex flex-col items-start p-4">
                <div className="mb-2 flex items-center space-x-2 text-blue-600">
                  <Users size={20} />
                  <h3 className="text-sm font-medium">Total Customers Today</h3>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {dashboardData.daily_insights.total_customer_visits_today}
                </p>
              </CardContent>
            </Card>
            {/* Average Wait Time */}
            <Card className="border-none shadow-sm bg-purple-50">
              <CardContent className="flex flex-col items-start p-4">
                <div className="mb-2 flex items-center space-x-2 text-purple-600">
                  <Clock size={20} />
                  <h3 className="text-sm font-medium">Average Wait Time</h3>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {formatWaitTime(dashboardData.daily_insights.average_wait_time)}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      {/* Businesses Overview */}
      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Businesses Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.shops.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No businesses found.</p>
              <p className="text-sm text-muted-foreground">
                Create your first business to see metrics here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {dashboardData.shops.map((shop: any) => (
                <Card key={shop.shop_id} className="shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="mb-3 text-lg font-bold flex items-center space-x-2">
                      <Activity size={18} className="text-foreground/80" />
                      <span>{shop.shop_name}</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* In Queue */}
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground flex items-center space-x-1">
                          <Users size={16} />
                          <span>In Queue</span>
                        </span>
                        <p className="text-xl font-bold">{shop.customers_in_queue}</p>
                      </div>
                      {/* Served Today */}
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground flex items-center space-x-1">
                          <CheckSquare size={16} />
                          <span>Served</span>
                        </span>
                        <p className="text-xl font-bold">{shop.customers_served}</p>
                      </div>
                      {/* Cancellations */}
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground flex items-center space-x-1">
                          <XSquare size={16} />
                          <span>Cancellations</span>
                        </span>
                        <p className="text-xl font-bold">{shop.cancellations}</p>
                      </div>
                      {/* Average Wait Time */}
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground flex items-center space-x-1">
                          <Clock size={16} />
                          <span>Avg. Wait</span>
                        </span>
                        <p className="text-xl font-bold">
                          {formatWaitTime(shop.average_wait_time)}
                        </p>
                      </div>
                    </div>
                    {/* Employee Management */}
                    <div className="mt-4">
                      <h4 className="mb-2 text-base font-semibold">
                        Employees Performance
                      </h4>
                      <div className="space-y-2">
                        {shop.barber_management.map((barber: any) => (
                          <div
                            key={barber.barber_id}
                            className="flex items-center justify-between rounded bg-muted/10 p-2"
                          >
                            <div className="flex items-center space-x-2">
                              <UserIcon size={16} className="text-foreground/60" />
                              <span className="text-sm font-medium">{barber.full_name}</span>
                            </div>
                            <span className="text-sm font-bold">
                              {barber.customers_served} served
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Historical Trends */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Historical Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.historical_trends.map((trend: any) => (
              <div
                key={trend.date}
                className="flex items-center justify-between rounded bg-muted/5 px-3 py-2"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(trend.date).toLocaleDateString()}
                </span>
                <div className="flex gap-4">
                  <span className="text-sm">
                    Visits: <span className="font-bold">{trend.total_visits}</span>
                  </span>
                  <span className="text-sm">
                    Avg. Wait: <span className="font-bold">{formatWaitTime(trend.average_wait_time)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
