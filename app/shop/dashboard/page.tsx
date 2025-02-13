import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getDashboardData } from "@/lib/services/shopService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    redirect("/api/auth/signin")
  }

  const dashboardData = await getDashboardData(session.user.accessToken)

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-2xl font-bold">Shop Dashboard</h1>
      
      {/* Daily Insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Daily Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm text-muted-foreground">Total Customers Today</h3>
                <p className="text-2xl font-bold">{dashboardData.daily_insights.total_customer_visits_today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm text-muted-foreground">Average Wait Time</h3>
                <p className="text-2xl font-bold">{formatWaitTime(dashboardData.daily_insights.average_wait_time)}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Shops Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shops Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.shops.map((shop) => (
              <Card key={shop.shop_id}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-3">{shop.shop_name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">In Queue</p>
                      <p className="font-bold">{shop.customers_in_queue}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Served Today</p>
                      <p className="font-bold">{shop.customers_served}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cancellations</p>
                      <p className="font-bold">{shop.cancellations}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Wait Time</p>
                      <p className="font-bold">{formatWaitTime(shop.average_wait_time)}</p>
                    </div>
                  </div>
                  
                  {/* Barber Management */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Barbers Performance</h4>
                    <div className="space-y-2">
                      {shop.barber_management.map((barber) => (
                        <div key={barber.barber_id} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{barber.full_name}</span>
                          <span className="font-bold">{barber.customers_served} customers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboardData.historical_trends.map((trend) => (
              <div key={trend.date} className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {new Date(trend.date).toLocaleDateString()}
                </span>
                <div className="flex gap-4">
                  <span>Visits: {trend.total_visits}</span>
                  <span>Avg. Wait: {formatWaitTime(trend.average_wait_time)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 