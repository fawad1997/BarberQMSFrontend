"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"
import { Shop } from "@/types/shop"
import { Barber } from "@/types/barber"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

interface AddBarberFormData {
  full_name: string
  email: string
  phone_number: string
  status: string
}

interface EditBarberFormData {
  full_name: string
  email: string
  phone_number: string
  status: string
}

function AddBarberModal({ 
  shopId, 
  isOpen, 
  onClose, 
  onSuccess,
  accessToken 
}: { 
  shopId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string 
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddBarberFormData>()

  const onSubmit = async (data: AddBarberFormData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...data,
            password: 'Temp1234',
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add barber')
      }

      toast.success('Barber has been added successfully')
      reset()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error adding barber:', error)
      toast.error('Failed to add barber. Please try again.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Barber</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Full Name"
              {...register('full_name', { required: true })}
            />
          </div>
          <div>
            <Input
              placeholder="Email"
              type="email"
              {...register('email', { required: true })}
            />
          </div>
          <div>
            <Input
              placeholder="Phone Number"
              {...register('phone_number', { required: true })}
            />
          </div>
          <div>
            <Select onValueChange={(value) => register('status').onChange({ target: { value } })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_service">In Service</SelectItem>
                <SelectItem value="on_break">On Break</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Add Barber</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditBarberModal({ 
  shopId,
  barber,
  isOpen, 
  onClose, 
  onSuccess,
  accessToken 
}: { 
  shopId: number
  barber: Barber
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string 
}) {
  const { register, handleSubmit, reset, setValue } = useForm<EditBarberFormData>({
    defaultValues: {
      full_name: barber.full_name,
      email: barber.email,
      phone_number: barber.phone_number,
      status: barber.status
    }
  })

  const onSubmit = async (data: EditBarberFormData) => {
    try {
      console.log('Sending data:', data)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barber.id}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            full_name: data.full_name,
            email: data.email,
            phone_number: data.phone_number,
            status: data.status,
            shop: shopId
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error('Failed to update barber')
      }

      toast.success('Barber has been updated successfully')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating barber:', error)
      toast.error('Failed to update barber. Please try again.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Barber</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Full Name"
              {...register('full_name', { required: true })}
            />
          </div>
          <div>
            <Input
              placeholder="Email"
              type="email"
              {...register('email', { required: true })}
            />
          </div>
          <div>
            <Input
              placeholder="Phone Number"
              {...register('phone_number', { required: true })}
            />
          </div>
          <div>
            <Select 
              defaultValue={barber.status}
              onValueChange={(value) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_service">In Service</SelectItem>
                <SelectItem value="on_break">On Break</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Update Barber</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BarbersPage() {
  const [shops, setShops] = useState<Array<{ id: number; name: string; barbers: Barber[] }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [accessToken, setAccessToken] = useState<string>('')
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const fetchShopsAndBarbers = async () => {
      try {
        const session = await getSession()
        if (!session?.user?.accessToken) {
          throw new Error("No access token found")
        }
        setAccessToken(session.user.accessToken)

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

  const refreshBarbers = async (shopId: number) => {
    try {
      const barbersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (barbersResponse.ok) {
        const barbersData: Barber[] = await barbersResponse.json()
        setShops(prevShops =>
          prevShops.map(prevShop =>
            prevShop.id === shopId
              ? { ...prevShop, barbers: barbersData }
              : prevShop
          )
        )
      }
    } catch (error) {
      console.error('Error refreshing barbers:', error)
    }
  }

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
              <div className="flex justify-between items-center">
                <CardTitle>{shop.name}</CardTitle>
                <Button
                  onClick={() => {
                    setSelectedShopId(shop.id)
                    setIsModalOpen(true)
                  }}
                >
                  Add Barber
                </Button>
              </div>
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
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              barber.status === 'available' 
                                ? 'bg-green-100 text-green-800'
                                : barber.status === 'in_service'
                                ? 'bg-blue-100 text-blue-800'
                                : barber.status === 'on_break'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {barber.status.replace('_', ' ')}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBarber(barber)
                                setSelectedShopId(shop.id)
                                setIsEditModalOpen(true)
                              }}
                            >
                              Edit
                            </Button>
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

      {selectedShopId && (
        <AddBarberModal
          shopId={selectedShopId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedShopId(null)
          }}
          onSuccess={() => refreshBarbers(selectedShopId)}
          accessToken={accessToken}
        />
      )}

      {selectedShopId && selectedBarber && (
        <EditBarberModal
          shopId={selectedShopId}
          barber={selectedBarber}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedBarber(null)
            setSelectedShopId(null)
          }}
          onSuccess={() => refreshBarbers(selectedShopId)}
          accessToken={accessToken}
        />
      )}
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