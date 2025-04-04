"use client"

import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import type { BarberSchedule } from "@/types/schedule"

interface AddScheduleFormData {
  day_of_week: string
  start_time: string
  end_time: string
}

interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  barberId: number
  shopId: number
  accessToken: string
  onSuccess: () => void
  existingSchedules: BarberSchedule[]
}

const dayOptions = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
]

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const getDayName = (dayNumber: number | string): string => {
  return dayNames[Number(dayNumber)] || dayNumber.toString()
}

export function AddScheduleModal({ isOpen, onClose, barberId, shopId, accessToken, onSuccess, existingSchedules }: AddScheduleModalProps) {
  const { control, handleSubmit, reset, watch } = useForm<AddScheduleFormData>({
    defaultValues: {
      day_of_week: '',
      start_time: '',
      end_time: ''
    }
  })

  const [isRepeat, setIsRepeat] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const availableDays = dayOptions.filter(day => 
    !existingSchedules.some(schedule => 
      schedule.day_of_week === parseInt(day.value)
    )
  )

  const onSubmit = async (data: AddScheduleFormData) => {
    try {
      setIsLoading(true)

      if (isRepeat && selectedDays.length === 0) {
        toast.error("Please select at least one day")
        return
      }

      const daysToSchedule = isRepeat ? selectedDays : [parseInt(data.day_of_week)]
      const errors: string[] = []
      const successfulDays: number[] = []

      // Make separate API calls for each day
      for (const day of daysToSchedule) {
        const requestBody = {
          barber_id: barberId,
          shop_id: shopId,
          day_of_week: day,
          start_time: data.start_time,
          end_time: data.end_time
        }

        console.log(`Creating schedule for ${getDayName(day)}:`, JSON.stringify(requestBody))

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barberId}/schedules/`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(requestBody),
            }
          )

          const responseData = await response.json()
          console.log(`API Response for ${getDayName(day)}:`, responseData)

          if (!response.ok) {
            if (responseData.detail) {
              if (typeof responseData.detail === 'string') {
                if (responseData.detail.includes("Schedule already exists for day")) {
                  errors.push(`Schedule already exists for ${getDayName(day)}`)
                } else {
                  errors.push(`Failed to add schedule for ${getDayName(day)}: ${responseData.detail}`)
                }
              } else {
                errors.push(`Failed to add schedule for ${getDayName(day)}`)
              }
            } else {
              errors.push(`Failed to add schedule for ${getDayName(day)}`)
            }
          } else {
            successfulDays.push(day)
          }
        } catch (error) {
          console.error(`Error adding schedule for ${getDayName(day)}:`, error)
          errors.push(`Failed to add schedule for ${getDayName(day)}`)
        }
      }

      // Show success message if any days were successful
      if (successfulDays.length > 0) {
        const successMessage = successfulDays.length === 1
          ? `Schedule added successfully for ${getDayName(successfulDays[0])}`
          : `Schedules added successfully for ${successfulDays.map(day => getDayName(day)).join(', ')}`
        toast.success(successMessage)
      }

      // Show error messages if any days failed
      errors.forEach(error => toast.error(error))

      // Close the modal if all days were successful
      if (errors.length === 0) {
        reset()
        setSelectedDays([])
        setIsRepeat(false)
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error in schedule creation:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="repeat"
                checked={isRepeat}
                onCheckedChange={(checked) => {
                  setIsRepeat(checked as boolean)
                  if (!checked) {
                    setSelectedDays([])
                  }
                }}
              />
              <label htmlFor="repeat" className="text-sm font-medium">
                Repeat schedule for multiple days
              </label>
            </div>

            {isRepeat ? (
              <div className="space-y-2">
                <Label>Select Days</Label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDays.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(parseInt(day.value))}
                        onCheckedChange={(checked) => {
                          setSelectedDays(prev =>
                            checked
                              ? [...prev, parseInt(day.value)]
                              : prev.filter(d => d !== parseInt(day.value))
                          )
                        }}
                      />
                      <label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="day_of_week">Day of Week</Label>
                <Controller
                  name="day_of_week"
                  control={control}
                  rules={{ required: "Day is required" }}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      onValueChange={onChange}
                      defaultValue={value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDays.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time</Label>
            <Controller
              name="start_time"
              control={control}
              rules={{ required: "Start time is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  type="time"
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <Controller
              name="end_time"
              control={control}
              rules={{ required: "End time is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  type="time"
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Add Schedule'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
