import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getDashboardData } from "@/lib/services/shopService"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Users,
  Clock,
  Activity,
  CheckSquare,
  XSquare,
  User as UserIcon
} from "lucide-react" // Example icon imports from lucide-react

// Helper function to format wait time
function formatWaitTime(seconds: number): string {
  if (seconds === 0) return "0 min"
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // Redirect if not a shop owner
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    redirect("/login")
  }

  // Check if token exists and is not empty
  if (!session.user.accessToken || session.user.accessToken.trim() === '') {
    console.log("Missing or empty access token - redirecting to login");
    redirect("/login?error=InvalidToken");
  }

  try {
    console.log("Attempting to fetch dashboard data...");
    const dashboardData = await getDashboardData(session.user.accessToken)

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
              
              {/* Optionally add more daily insight cards */}
              {/* e.g., <Card className="border-none shadow-sm bg-green-50"> ... </Card> */}
            </div>
          </CardContent>
        </Card>

        {/* Shops Overview */}
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
              <>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📊 <strong>Note:</strong> Dashboard metrics are currently showing placeholder data. 
                    Real-time analytics will be available once the metrics endpoints are implemented.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {dashboardData.shops.map((shop) => (
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

                    {/* Artist Management */}
                    <div className="mt-4">
                      <h4 className="mb-2 text-base font-semibold">
                        Artists Performance
                      </h4>
                      <div className="space-y-2">
                        {shop.barber_management.map((barber) => (
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
              </>
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
              {dashboardData.historical_trends.map((trend) => (
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
    )
  } catch (error) {
    console.error("Error loading dashboard:", error);
    
    // Force redirect to login for any type of error related to authentication or fetching data
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      const errorName = error.name.toLowerCase();
      
      if (
        errorName.includes('auth') || 
        errorName.includes('network') || 
        errorMsg.includes('failed to connect') || 
        errorMsg.includes('token') || 
        errorMsg.includes('unauthorized') || 
        errorMsg.includes('session')
      ) {
        console.log("Authentication or network error detected, redirecting to login");
        return redirect("/login?error=SessionExpired");
      }
    }
    
    // For truly unexpected errors, throw to Next.js error boundary
    throw new Error("Failed to load dashboard data. Please try again later.");
  }
}
