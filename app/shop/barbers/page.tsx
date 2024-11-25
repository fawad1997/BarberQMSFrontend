"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"
import { Shop } from "@/types/shop"
import { Barber } from "@/types/barber"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function BarbersPage() {
  const [shops, setShops] = useState<Array<{ id: number; name: string; barbers: Barber[] }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShopsAndBarbers = async () => {
      try {
        const session = await getSession()
        if (!session?.user?.accessToken) {
          throw new Error("No access token found")
        }

        // Fetch shops
        const shopsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/`,
          {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
            },
          }
        )

        if (!shopsResponse.ok) {
          throw new Error("Failed to fetch shops")
        }

        const shopsData: Shop[] = await shopsResponse.json()
        const simplifiedShops = shopsData.map(shop => ({
          id: shop.id,
          name: shop.name,
          barbers: [] as Barber[]
        }))

        setShops(simplifiedShops)

        // Fetch barbers for each shop
        for (const shop of simplifiedShops) {
          const barbersResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shop.id}/barbers/`,
            {
              headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
              },
            }
          )

          if (barbersResponse.ok) {
            const barbersData: Barber[] = await barbersResponse.json()
            setShops(prevShops =>
              prevShops.map(prevShop =>
                prevShop.id === shop.id
                  ? { ...prevShop, barbers: barbersData }
                  : prevShop
              )
            )
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchShopsAndBarbers()
  }, [])

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Barbers Management</h1>
      <div className="space-y-6">
        {shops.map((shop) => (
          <Card key={shop.id}>
            <CardHeader>
              <CardTitle>{shop.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {shop.barbers.length === 0 ? (
                <p className="text-muted-foreground">No barbers found for this shop.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shop.barbers.map((barber) => (
                    <Card key={barber.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{barber.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Email: {barber.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Phone: {barber.phone_number}
                          </p>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              barber.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {barber.status}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <Card key={j}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 