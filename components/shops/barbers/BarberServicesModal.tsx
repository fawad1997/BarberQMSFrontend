import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface Service {
  id: number
  name: string
  duration: number
  price: number
  business_id: number // Changed from shop_id
}

interface EmployeeServicesModalProps { // Renamed from BarberServicesModalProps
  businessId: number // Changed from shopId
  employeeId: number // Changed from barberId
  employeeName: string // Changed from barberName
  isOpen: boolean
  onClose: () => void
  accessToken: string
}

// Keep old interface for backward compatibility
interface BarberServicesModalProps extends EmployeeServicesModalProps {}

// Export with old name for backward compatibility
export function BarberServicesModal(props: BarberServicesModalProps) {
  return EmployeeServicesModal(props);
}

export function EmployeeServicesModal({
  businessId,
  employeeId,
  employeeName,
  isOpen,
  onClose,
  accessToken,
}: EmployeeServicesModalProps) {
  const [allServices, setAllServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      try {
        // Fetch all business services
        const allServicesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/business-owners/businesses/${businessId}/services/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!allServicesResponse.ok) {
          throw new Error('Failed to fetch all services')
        }

        const allServicesData = await allServicesResponse.json()

        // Ensure allServicesData is an array
        const servicesArray = Array.isArray(allServicesData)
          ? allServicesData
          : allServicesData.services || []

        setAllServices(servicesArray)

        // Fetch employee's current services
        const employeeServicesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/business-owners/businesses/${businessId}/employees/${employeeId}/services`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!employeeServicesResponse.ok) {
          throw new Error('Failed to fetch employee services')
        }

        const employeeServicesData = await employeeServicesResponse.json()
        console.log("employeeServicesData", employeeServicesData)

        // Ensure employeeServicesData is an array
        const employeeServicesArray = Array.isArray(employeeServicesData)
          ? employeeServicesData
          : employeeServicesData.services || []

        setSelectedServices(employeeServicesArray)
      } catch (error) {
        console.error('Error fetching services:', error)
        toast.error('Failed to fetch services')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchServices()
    }
  }, [isOpen, businessId, employeeId, accessToken])

  const toggleService = async (service: Service) => {
    try {
      const isSelected = selectedServices.some(s => s.id === service.id)
      
      if (isSelected) {
        // Remove service
        const response = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/business-owners/businesses/${businessId}/employees/${employeeId}/services/${service.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
  
        if (response.status !== 204) {
          const errorData = await response.json();
          console.error('API Error removing service:', errorData);
          throw new Error(errorData.message || 'Failed to remove service');
        }
  
        setSelectedServices(prev => prev.filter(s => s.id !== service.id))
        toast.success(`Removed ${service.name} from ${employeeName}'s services`)
      } else {
        // Add service
        const response = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/business-owners/businesses/${businessId}/employees/${employeeId}/services`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify([service.id]), // Changed from object to array
          }
        )
  
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error adding service:', errorData);
          throw new Error(errorData.message || 'Failed to add service');
        }
  
        setSelectedServices(prev => [...prev, service])
        toast.success(`Added ${service.name} to ${employeeName}'s services`)
      }
    } catch (error) {
      console.error('Error toggling service:', error)
      if (error instanceof Error && error.message) {
        toast.error(error.message)
      } else {
        toast.error('Failed to toggle service')
      }
    }
  }
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Services for {employeeName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p>Loading services...</p>
        ) : (
          <div className="space-y-4">
            {/* Service Selection */}
            <div>
              <h4 className="text-sm font-medium mb-2">Assign Services:</h4>
              <div className="space-y-2">
                {allServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services available.</p>
                ) : (
                  allServices.map((service) => {
                    const isSelected = selectedServices.some(s => s.id === service.id)
                    return (
                      <div key={service.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={isSelected}
                          onChange={() => toggleService(service)}
                          className="mr-2"
                        />
                        <label htmlFor={`service-${service.id}`} className="flex-1">
                          <span className="font-semibold">{service.name}</span> - ${service.price} - {service.duration}min
                        </label>
                        {isSelected && <Check className="h-4 w-4 text-green-500" />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Selected Services */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Services:</h4>
              <div className="space-y-2">
                {selectedServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services selected</p>
                ) : (
                  selectedServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <span>{service.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          ${service.price} - {service.duration}min
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleService(service)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
