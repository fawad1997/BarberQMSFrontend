"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getApiEndpoint } from "@/lib/utils/api-config"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

interface Shop {
  id: string
  name: string
  services?: Service[]
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface ServiceFormData {
  name: string
  duration: string
  price: string
}

interface EditServiceModalProps {
  service: Service
  shopId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string
}

interface DeleteServiceDialogProps {
  service: Service
  shopId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string
}

function ServiceModal({
  shopId,
  isOpen,
  onClose,
  onSuccess,
  accessToken,
}: {
  shopId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string
}) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    duration: "",
    price: "",
  })

  const handleAddService = async () => {
    try {
      const payload = {
        name: formData.name,
        duration: Number(formData.duration),
        price: Number(formData.price),
      }

      const response = await fetch(
        getApiEndpoint(`business-owners/businesses/${shopId}/services/`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) throw new Error("Failed to add service")

      setFormData({ name: "", duration: "", price: "" })
      onClose()
      onSuccess()
      toast.success("Service added successfully")
    } catch (error) {
      console.error("Error adding service:", error)
      toast.error("Failed to add service")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add New Service
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAddService()
          }}
          className="space-y-6 py-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Service Name
            </label>
            <Input
              id="name"
              placeholder="e.g., Haircut, Manicure"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="duration"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Duration (minutes)
            </label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g., 30"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: e.target.value.replace(/^0+/, ""),
                })
              }
              required
              min="1"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enter the estimated duration in minutes
            </p>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="price"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Price ($)
            </label>
            <Input
              id="price"
              type="number"
              placeholder="e.g., 29.99"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value.replace(/^0+/, ""),
                })
              }
              required
              min="0"
              step="0.01"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enter the price in dollars
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Add Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditServiceModal({
  service,
  shopId,
  isOpen,
  onClose,
  onSuccess,
  accessToken,
}: EditServiceModalProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: service.name,
    duration: service.duration.toString(),
    price: service.price.toString(),
  })

  const handleUpdateService = async () => {
    try {
      const payload = {
        name: formData.name,
        duration: Number(formData.duration),
        price: Number(formData.price),
      }

      const response = await fetch(
        getApiEndpoint(`business-owners/businesses/${shopId}/services/${service.id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) throw new Error("Failed to update service")

      onClose()
      onSuccess()
      toast.success("Service updated successfully")
    } catch (error) {
      console.error("Error updating service:", error)
      toast.error("Failed to update service")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Service
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleUpdateService()
          }}
          className="space-y-6 py-4"
        >
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Service Name
            </label>
            <Input
              id="name"
              placeholder="e.g., Haircut, Manicure"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="duration"
              className="text-sm font-medium leading-none"
            >
              Duration (minutes)
            </label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g., 30"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: e.target.value.replace(/^0+/, ""),
                })
              }
              required
              min="1"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium leading-none">
              Price ($)
            </label>
            <Input
              id="price"
              type="number"
              placeholder="e.g., 29.99"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value.replace(/^0+/, ""),
                })
              }
              required
              min="0"
              step="0.01"
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Update Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteServiceDialog({
  service,
  shopId,
  isOpen,
  onClose,
  onSuccess,
  accessToken,
}: DeleteServiceDialogProps) {
  const handleDelete = async () => {
    try {
      const response = await fetch(
        getApiEndpoint(`business-owners/businesses/${shopId}/services/${service.id}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete service");
        } else {
          const textResponse = await response.text();
          console.error("Non-JSON response:", textResponse.substring(0, 500));
          throw new Error("Failed to delete service. Invalid server response.");
        }
      }

      onClose()
      onSuccess()
      toast.success("Service deleted successfully")
    } catch (error) {
      console.error("Error deleting service:", error)
      toast.error("Failed to delete service")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Delete Service
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete "{service.name}"? This action cannot
            be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <Card key={j}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
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
        You haven't created any shops yet. Create a shop first to manage services.
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

export default function ServicesPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string>("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const session = await getSession()

      if (!session || session.user.role !== "SHOP_OWNER") {
        redirect("/")
      }

      setAccessToken(session.user.accessToken)

      try {
        // Fetch shops
        const shopsResponse = await fetch(
          getApiEndpoint("business-owners/businesses"),
          {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
            },
          }
        )
        
        // Check content type before parsing
        const contentType = shopsResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await shopsResponse.text();
          console.error("Non-JSON shops response:", textResponse.substring(0, 500));
          throw new Error("The server returned an invalid response format.");
        }
        
        const shopsData = await shopsResponse.json()

        // Fetch services for each shop
        const shopsWithServices = await Promise.all(
          shopsData.map(async (shop: Shop) => {
            const servicesResponse = await fetch(
              getApiEndpoint(`business-owners/businesses/${shop.id}/services`),
              {
                headers: {
                  Authorization: `Bearer ${session.user.accessToken}`,
                },
              }
            )
            
            // Check content type before parsing
            const contentType = servicesResponse.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.error("Invalid service response for shop:", shop.id);
              return { ...shop, services: [] };
            }
            
            const services = await servicesResponse.json()
            return { ...shop, services }
          })
        )

        setShops(shopsWithServices)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <LoadingState />
  }

  // Show NoShopsState when there are no shops
  if (shops.length === 0) {
    return <NoShopsState />
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-2xl font-bold">Services Management</h1>
      <div className="space-y-6">
        {shops.map((shop) => (
          <Card key={shop.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{shop.name}</CardTitle>
                <Button
                  onClick={() => {
                    setSelectedShopId(shop.id)
                    setIsModalOpen(true)
                  }}
                >
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!shop.services?.length ? (
                <p className="text-muted-foreground">
                  No services found for this shop.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shop.services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold">{service.name}</h3>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedService(service)
                                  setSelectedShopId(shop.id)
                                  setEditModalOpen(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setServiceToDelete(service)
                                  setSelectedShopId(shop.id)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Duration: {service.duration} minutes
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Price: ${service.price}
                          </p>
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
        <ServiceModal
          shopId={selectedShopId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedShopId(null)
          }}
          onSuccess={() => {
            const refreshServices = async () => {
              const session = await getSession()
              if (!session) return

              try {
                const servicesResponse = await fetch(
                  getApiEndpoint(`business-owners/businesses/${selectedShopId}/services`),
                  {
                    headers: {
                      Authorization: `Bearer ${session.user.accessToken}`,
                    },
                  }
                )

                // Check content type before parsing
                const contentType = servicesResponse.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                  console.error("Invalid service response");
                  throw new Error("The server returned an invalid response format.");
                }
                
                const services = await servicesResponse.json()

                setShops(
                  shops.map((shop) =>
                    shop.id === selectedShopId ? { ...shop, services } : shop
                  )
                )
              } catch (error) {
                toast.error("Failed to refresh services")
              }
            }
            refreshServices()
          }}
          accessToken={accessToken}
        />
      )}

      {selectedService && selectedShopId && (
        <EditServiceModal
          service={selectedService}
          shopId={selectedShopId}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedService(null)
          }}
          onSuccess={() => {
            const refreshServices = async () => {
              const session = await getSession()
              if (!session) return

              try {
                const servicesResponse = await fetch(
                  getApiEndpoint(`business-owners/businesses/${selectedShopId}/services`),
                  {
                    headers: {
                      Authorization: `Bearer ${session.user.accessToken}`,
                    },
                  }
                )

                // Check content type before parsing
                const contentType = servicesResponse.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                  console.error("Invalid service response");
                  throw new Error("The server returned an invalid response format.");
                }
                
                const services = await servicesResponse.json()

                setShops(
                  shops.map((shop) =>
                    shop.id === selectedShopId ? { ...shop, services } : shop
                  )
                )
              } catch (error) {
                toast.error("Failed to refresh services")
              }
            }
            refreshServices()
          }}
          accessToken={accessToken}
        />
      )}

      {serviceToDelete && selectedShopId && (
        <DeleteServiceDialog
          service={serviceToDelete}
          shopId={selectedShopId}
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setServiceToDelete(null)
          }}
          onSuccess={() => {
            const refreshServices = async () => {
              const session = await getSession()
              if (!session) return

              try {
                const servicesResponse = await fetch(
                  getApiEndpoint(`business-owners/businesses/${selectedShopId}/services`),
                  {
                    headers: {
                      Authorization: `Bearer ${session.user.accessToken}`,
                    },
                  }
                )

                // Check content type before parsing
                const contentType = servicesResponse.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                  console.error("Invalid service response");
                  throw new Error("The server returned an invalid response format.");
                }
                
                const services = await servicesResponse.json()

                setShops(
                  shops.map((shop) =>
                    shop.id === selectedShopId ? { ...shop, services } : shop
                  )
                )
              } catch (error) {
                toast.error("Failed to refresh services")
              }
            }
            refreshServices()
          }}
          accessToken={accessToken}
        />
      )}
    </div>
  )
}
