import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Barber } from '@/types/barber'
import { BarberBigCalendar } from '@/components/shops/barbers/BarberBigCalendar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from '@/hooks/useAuth'

export default function BarberPage() {
  const router = useRouter()
  const { shopId, barberId } = router.query
  const { accessToken } = useAuth()
  const [barber, setBarber] = useState<Barber | null>(null)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBarber = async () => {
      if (!shopId || !barberId || !accessToken) return

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barberId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch barber')
        }

        const data = await response.json()
        setBarber(data)
      } catch (error) {
        console.error('Error fetching barber:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchBarbers = async () => {
      if (!shopId || !accessToken) return

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch barbers')
        }

        const data = await response.json()
        setBarbers(data)
      } catch (error) {
        console.error('Error fetching barbers:', error)
      }
    }

    fetchBarber()
    fetchBarbers()
  }, [shopId, barberId, accessToken])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Barber not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{barber.full_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Barber Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p className="text-muted-foreground">{barber.full_name}</p>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">{barber.email}</p>
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-muted-foreground">{barber.phone_number}</p>
              </div>
              <div>
                <h3 className="font-medium">Status</h3>
                <p className="text-muted-foreground">
                  {barber.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <BarberBigCalendar
                barbers={barbers}
                shopId={Number(shopId)}
                accessToken={accessToken || ''}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 