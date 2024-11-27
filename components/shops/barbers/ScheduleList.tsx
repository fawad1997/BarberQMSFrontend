// components/shops/barbers/ScheduleList.tsx

import { BarberSchedule } from "@/types/schedule"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2 } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

interface ScheduleListProps {
  schedules: BarberSchedule[]
  onEdit: (schedule: BarberSchedule) => void
  onDelete: (schedule: BarberSchedule) => void
  accessToken: string
  shopId: number
  barberId: number
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function ScheduleList({ schedules, onEdit, onDelete, accessToken, shopId, barberId }: ScheduleListProps) {
  const handleDelete = async (schedule: BarberSchedule) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barberId}/schedules/${schedule.id}/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }

      toast.success('Schedule deleted successfully')
      onDelete(schedule)
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete schedule')
    }
  }

  // Sort schedules by day of week
  const sortedSchedules = [...schedules].sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Weekly Schedule</h4>
      </div>
      
      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No schedules set for this barber.</p>
      ) : (
        <Card className="p-4">
          <div className="space-y-2">
            {sortedSchedules.map((schedule) => (
              <div 
                key={schedule.id} 
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  <span className="min-w-[100px] text-sm font-medium">
                    {dayNames[schedule.day_of_week]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {schedule.start_time} - {schedule.end_time}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(schedule)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(schedule)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
