"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"
import { Shop } from "@/types/shop"
import { Barber } from "@/types/barber"
import { BarberSchedule } from "@/types/schedule"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BarberServicesModal } from "@/components/shops/barbers/BarberServicesModal"
import { AddScheduleModal } from "@/components/shops/barbers/AddScheduleModal"
import { EditScheduleModal } from "@/components/shops/barbers/EditScheduleModal"
import { ScheduleList } from "@/components/shops/barbers/ScheduleList"
import Link from "next/link"
import { PlusCircle, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react"
import { Session } from "next-auth"
import { AlertCircle, X } from "lucide-react"
import { BarberBigCalendar } from "@/components/shops/barbers/BarberBigCalendar"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"

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
  accessToken,
}: {
  shopId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddBarberFormData>()
  const onSubmit = async (data: AddBarberFormData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        // Parse the error response to get the detailed message
        const errorData = await response.json()
        const errorMessage = errorData.detail || 
                            errorData.message || 
                            errorData.error || 
                            `Failed to add artist (Status: ${response.status})`
        throw new Error(errorMessage)
      }

      toast.success(
        "Artist has been added successfully. An email with password setup instructions has been sent to their email address."
      )
      reset()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error adding artist:", error)
      // Display the specific error message from the backend
      toast.error(error instanceof Error ? error.message : "Failed to add artist. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Artist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Full Name"
              {...register("full_name", { required: true })}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">Full name is required.</p>
            )}
          </div>
          <div>
            <Input
              placeholder="Email"
              type="email"
              {...register("email", { required: true })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">Email is required.</p>
            )}
          </div>
          <div>
            <Input
              placeholder="Phone Number"
              {...register("phone_number", { required: true })}
            />
            {errors.phone_number && (
              <p className="text-sm text-red-500">Phone number is required.</p>
            )}
          </div>
          <div>
            <Select
              onValueChange={(value) => {
                // Update form value manually
                // This is a workaround; ideally, use a controlled component
                // Alternatively, use Controller from react-hook-form
                // For simplicity, updating manually here
                // @ts-ignore
                register("status").onChange({ target: { value } })
              }}
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
            {errors.status && (
              <p className="text-sm text-red-500">Status is required.</p>
            )}
          </div>          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            <p>An email will be sent to the artist with instructions to set up their password.</p>
          </div>
          <Button type="submit" className="w-full">
            Add Artist
          </Button>
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
  accessToken,
}: {
  shopId: number
  barber: Barber
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditBarberFormData>({
    defaultValues: {
      full_name: barber.full_name,
      email: barber.email,
      phone_number: barber.phone_number,
      status: barber.status,
    },
  })

  const onSubmit = async (data: EditBarberFormData) => {
    try {
      console.log("Sending data:", data)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barber.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            full_name: data.full_name,
            email: data.email,
            phone_number: data.phone_number,
            status: data.status,
          }),
        }
      )

      if (!response.ok) {
        // Parse the error response to get the detailed message
        const errorData = await response.json()
        console.error("API Error Response:", errorData)
        const errorMessage = errorData.detail || 
                            errorData.message || 
                            errorData.error || 
                            `Failed to update artist (Status: ${response.status})`
        throw new Error(errorMessage)
      }

      toast.success("Artist has been updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating artist:", error)
      // Display the specific error message from the backend
      toast.error(error instanceof Error ? error.message : "Failed to update artist. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Artist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Full Name"
              {...register("full_name", { required: true })}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">Full name is required.</p>
            )}
          </div>
          <div>
            <Input
              placeholder="Email"
              type="email"
              {...register("email", { required: true })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">Email is required.</p>
            )}
          </div>
          <div>
            <Input
              placeholder="Phone Number"
              {...register("phone_number", { required: true })}
            />
            {errors.phone_number && (
              <p className="text-sm text-red-500">Phone number is required.</p>
            )}
          </div>
          <div>
            <Select
              defaultValue={barber.status}
              onValueChange={(value) => setValue("status", value)}
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
            {errors.status && (
              <p className="text-sm text-red-500">Status is required.</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Update Artist
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteBarberDialog({
  isOpen,
  onClose,
  onConfirm,
  barberName,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  barberName: string
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {barberName} from the system. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function BarbersPage() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth()
  const [shops, setShops] = useState<
    Array<{ id: number; name: string; barbers: Barber[] }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [barberToDelete, setBarberToDelete] = useState<{
    id: number
    name: string
    shopId: number
  } | null>(null)
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false)
  const [selectedBarberForServices, setSelectedBarberForServices] =
    useState<Barber | null>(null)
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<BarberSchedule | null>(null)
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false)
  const [expandedShops, setExpandedShops] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!user || !accessToken) return

    const fetchShopsAndBarbers = async () => {
      try {
        // Fetch shops
        const shopsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!shopsResponse.ok) {
          throw new Error("Failed to fetch shops")
        }

        const shopsData: Shop[] = await shopsResponse.json()
        const simplifiedShops = shopsData.map((shop) => ({
          id: shop.id,
          name: shop.name,
          barbers: [] as Barber[],
        }))

        setShops(simplifiedShops)

        // Fetch barbers for each shop
        for (const shop of simplifiedShops) {
          const barbersResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shop.id}/barbers/`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )

          if (barbersResponse.ok) {
            const barbersData: Barber[] = await barbersResponse.json()
            const barbersWithSchedules = await Promise.all(
              barbersData.map(async (barber) => {
                const schedules = await fetchBarberSchedules(shop.id, barber.id)
                return { ...barber, schedules }
              })
            )

            setShops((prevShops) =>
              prevShops.map((prevShop) =>
                prevShop.id === shop.id
                  ? { ...prevShop, barbers: barbersWithSchedules }
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
  }, [user, accessToken])

  const fetchBarberSchedules = async (shopId: number, barberId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barberId}/schedules/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      if (!response.ok) {
        throw new Error('Failed to fetch schedules')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching schedules:', error)
      return []
    }
  }

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
        
        // Fetch schedules for each barber
        const barbersWithSchedules = await Promise.all(
          barbersData.map(async (barber) => {
            const schedules = await fetchBarberSchedules(shopId, barber.id)
            return { ...barber, schedules }
          })
        )

        setShops((prevShops) =>
          prevShops.map((prevShop) =>
            prevShop.id === shopId
              ? { ...prevShop, barbers: barbersWithSchedules }
              : prevShop
          )
        )
      }
    } catch (error) {
      console.error("Error refreshing barbers:", error)
    }
  }

  const handleDeleteBarber = async () => {
    if (!barberToDelete) return
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/barbers/${barberToDelete.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        let errorMessage = `Failed to delete artist (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || 
                        errorData.message || 
                        errorData.error || 
                        errorMessage;
        } catch (parseError) {
          // If can't parse JSON, use text or status code
          try {
            const textError = await response.text();
            if (textError) errorMessage = textError;
          } catch (textError) {
            // Keep the default error message if text can't be parsed
          }
        }
        
        throw new Error(errorMessage);
      }

      toast.success("Artist has been removed successfully")
      await refreshBarbers(barberToDelete.shopId)
    } catch (error) {
      console.error("Error deleting artist:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete artist. Please try again.")
    } finally {
      setIsDeleteDialogOpen(false)
      setBarberToDelete(null)
    }
  }

  const handleAddScheduleSuccess = () => {
    // Refresh or refetch schedules if necessary
    toast.success("Schedule added successfully")
  }

  const handleEditScheduleSuccess = () => {
    // Refresh or refetch schedules if necessary
    toast.success("Schedule updated successfully")
  }

  const handleScheduleEdit = async (schedule: BarberSchedule) => {
    // Find the shop and barber for this schedule
    const shop = shops.find(s => s.id === schedule.shop_id)
    const barber = shop?.barbers.find(b => b.id === schedule.barber_id)
    
    if (shop && barber) {
      setSelectedShopId(shop.id)
      setSelectedBarber(barber)
      setEditSchedule(schedule)
      setIsEditScheduleModalOpen(true)
    }
  }

  const toggleShopExpansion = (shopId: number) => {
    setExpandedShops(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }))
  }

  if (isAuthLoading || isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (shops.length === 0) {
    return <NoShopsState />
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Artists Management</h1>
      <div className="space-y-6">
        {shops.map((shop) => (
          <Card key={shop.id} className="overflow-hidden">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleShopExpansion(shop.id)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {expandedShops[shop.id] ? (
                      <Unlock className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <CardTitle>{shop.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setSelectedShopId(shop.id)
                      setIsAddModalOpen(true)
                    }}
                  >
                    Add Artist
                  </Button>
                  <button
                    onClick={() => toggleShopExpansion(shop.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {expandedShops[shop.id] ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </CardHeader>
            <AnimatePresence>
              {expandedShops[shop.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent>
                    {shop.barbers.length === 0 ? (
                      <p className="text-muted-foreground">
                        No artists found for this shop.
                      </p>
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                          {shop.barbers.map((barber) => (
                            <Card key={barber.id}>
                              <CardContent className="pt-6">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-semibold">{barber.full_name}</h3>
                                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                        barber.status === 'available'
                                          ? 'bg-green-100 text-green-800'
                                          : barber.status === 'in_service'
                                          ? 'bg-blue-100 text-blue-800'
                                          : barber.status === 'on_break'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {barber.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedBarberForServices(barber)
                                          setSelectedShopId(shop.id)
                                          setIsServicesModalOpen(true)
                                        }}
                                      >
                                        Services
                                      </Button>
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
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          setBarberToDelete({
                                            id: barber.id,
                                            name: barber.full_name,
                                            shopId: shop.id,
                                          })
                                          setIsDeleteDialogOpen(true)
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p>Email: {barber.email}</p>
                                    <p>Phone: {barber.phone_number}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <div className="mt-6">
                          <BarberBigCalendar 
                            barbers={shop.barbers}
                            shopId={shop.id}
                            accessToken={accessToken}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      {/* Add Artist Modal */}
      {selectedShopId && (
        <AddBarberModal
          shopId={selectedShopId}
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false)
            setSelectedShopId(null)
          }}
          onSuccess={() => refreshBarbers(selectedShopId)}
          accessToken={accessToken}
        />
      )}

      {/* Edit Artist Modal */}
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

      {/* Delete Artist Dialog */}
      {barberToDelete && (
        <DeleteBarberDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setBarberToDelete(null)
          }}
          onConfirm={handleDeleteBarber}
          barberName={barberToDelete.name}
        />
      )}

      {/* Manage Services Modal */}
      {selectedShopId && selectedBarberForServices && (
        <BarberServicesModal
          shopId={selectedShopId}
          barberId={selectedBarberForServices.id}
          barberName={selectedBarberForServices.full_name}
          isOpen={isServicesModalOpen}
          onClose={() => {
            setIsServicesModalOpen(false)
            setSelectedBarberForServices(null)
            setSelectedShopId(null)
          }}
          accessToken={accessToken}
        />
      )}

      {/* Add/Edit Schedule Modal */}
      {selectedBarber && selectedShopId && (
        <AddScheduleModal
          isOpen={isAddScheduleModalOpen}
          onClose={() => {
            setIsAddScheduleModalOpen(false)
            setEditSchedule(null)
          }}
          barberId={selectedBarber.id}
          shopId={selectedShopId}
          accessToken={accessToken}
          onSuccess={() => refreshBarbers(selectedShopId)}
          existingSchedules={selectedBarber.schedules || []}
        />
      )}

      {/* Edit Schedule Modal */}
      {editSchedule && (
        <EditScheduleModal
          isOpen={isEditScheduleModalOpen}
          onClose={() => {
            setIsEditScheduleModalOpen(false)
            setEditSchedule(null)
            setSelectedShopId(null)
            setSelectedBarber(null)
          }}
          schedule={editSchedule}
          accessToken={accessToken}
          onSuccess={async () => {
            if (selectedShopId) {
              await refreshBarbers(selectedShopId)
              setEditSchedule(null)
              setIsEditScheduleModalOpen(false)
              setSelectedShopId(null)
              setSelectedBarber(null)
            }
          }}
        />
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
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

function NoShopsState() {
  return (
    <div className="container mx-auto py-10 flex flex-col items-center justify-center text-center">
      <div className="mb-8">
        <img 
          src="/empty-shop.svg" 
          alt="No Shops" 
          className="w-64 h-64 mx-auto opacity-80"
          onError={(e) => {
            e.currentTarget.src = "https://api.iconify.design/solar:shop-2-outline.svg?color=%23888";
          }}
        />
      </div>
      <h2 className="text-2xl font-bold mb-3">No Shops Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        You haven't created any shops yet. Create a shop first to manage artists.
      </p>
      <Link href="/shop/shops/create">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Your First Shop
        </Button>
      </Link>
    </div>
  )
}
