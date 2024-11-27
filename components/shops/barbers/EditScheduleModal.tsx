// components/shops/barbers/EditScheduleModal.tsx

"use client"

import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { BarberSchedule } from "@/types/schedule"

interface EditScheduleFormData {
  start_time: string
  end_time: string
}

interface EditScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  schedule: BarberSchedule
  accessToken: string
  onSuccess: () => void
}

export function EditScheduleModal({ isOpen, onClose, schedule, accessToken, onSuccess }: EditScheduleModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditScheduleFormData>({
    defaultValues: {
      start_time: schedule.start_time,
      end_time: schedule.end_time,
    }
  })

  const onSubmit = async (data: EditScheduleFormData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${schedule.shop_id}/barbers/${schedule.barber_id}/schedules/${schedule.id}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            start_time: data.start_time,
            end_time: data.end_time,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update schedule')
      }

      toast.success('Schedule updated successfully')
      reset()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast.error((error as Error).message || 'Failed to update schedule')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <p className="font-medium">Day: {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][schedule.day_of_week]}</p>
          </div>
          <div>
            <Input
              type="time"
              placeholder="Start Time"
              {...register('start_time', { required: true })}
            />
            {errors.start_time && <p className="text-red-500 text-sm">Start time is required.</p>}
          </div>
          <div>
            <Input
              type="time"
              placeholder="End Time"
              {...register('end_time', { required: true })}
            />
            {errors.end_time && <p className="text-red-500 text-sm">End time is required.</p>}
          </div>
          <Button type="submit" className="w-full">Update Schedule</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
