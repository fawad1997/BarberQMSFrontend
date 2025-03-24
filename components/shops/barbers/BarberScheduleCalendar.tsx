import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarberSchedule } from '@/types/schedule'
import { Barber } from '@/types/barber'
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface BarberScheduleCalendarProps {
  barbers: Barber[]
  shopId: number
  accessToken: string
}

interface EventFormData {
  title: string
  start: string
  end: string
  description: string
  type: 'task' | 'appointment' | 'reminder'
  isAllDay: boolean
  reminderTime?: string
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function BarberScheduleCalendar({ barbers, shopId, accessToken }: BarberScheduleCalendarProps) {
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    start: '',
    end: '',
    description: '',
    type: 'appointment',
    isAllDay: false,
  })

  useEffect(() => {
    if (selectedBarber) {
      const fetchSchedules = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${selectedBarber.id}/schedules/`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
          if (!response.ok) throw new Error('Failed to fetch schedules')
          const schedules: BarberSchedule[] = await response.json()
          
          // Convert schedules to calendar events
          const calendarEvents = schedules.map(schedule => ({
            id: schedule.id,
            title: `${selectedBarber.full_name} - ${dayNames[schedule.day_of_week]}`,
            start: `2024-01-${(schedule.day_of_week + 1).toString().padStart(2, '0')}T${schedule.start_time}`,
            end: `2024-01-${(schedule.day_of_week + 1).toString().padStart(2, '0')}T${schedule.end_time}`,
            backgroundColor: '#4F46E5', // Indigo color for schedule
            borderColor: '#4F46E5',
            extendedProps: {
              type: 'schedule'
            }
          }))
          
          setEvents(calendarEvents)
        } catch (error) {
          console.error('Error fetching schedules:', error)
          toast.error('Failed to fetch schedules')
        }
      }

      fetchSchedules()
    } else {
      setEvents([])
    }
  }, [selectedBarber, shopId, accessToken])

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start)
    setFormData({
      ...formData,
      start: selectInfo.start.toISOString().slice(0, 16),
      end: selectInfo.end.toISOString().slice(0, 16),
    })
    setIsCreateEventModalOpen(true)
  }

  const handleEventSubmit = async () => {
    if (!selectedBarber || !selectedDate) {
      toast.error('Please select a barber and date')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.start || !formData.end) {
      toast.error('Please select start and end times')
      return
    }

    if (new Date(formData.start) >= new Date(formData.end)) {
      toast.error('End time must be after start time')
      return
    }

    try {
      const dayOfWeek = selectedDate.getDay()
      const startTime = new Date(formData.start).toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
      const endTime = new Date(formData.end).toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })

      const requestBody = {
        barber_id: selectedBarber.id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        shop_id: shopId
      }

      console.log('Creating schedule with data:', requestBody)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${selectedBarber.id}/schedules/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody),
        }
      )

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to create schedule')
      }

      const newSchedule = responseData
      const eventColor = formData.type === 'task' ? '#10B981' : 
                        formData.type === 'reminder' ? '#F59E0B' : 
                        '#EF4444'

      const newEvent = {
        id: newSchedule.id,
        title: formData.title || `${selectedBarber.full_name} - ${dayNames[dayOfWeek]}`,
        start: `2024-01-${(dayOfWeek + 1).toString().padStart(2, '0')}T${startTime}`,
        end: `2024-01-${(dayOfWeek + 1).toString().padStart(2, '0')}T${endTime}`,
        backgroundColor: eventColor,
        borderColor: eventColor,
        extendedProps: {
          type: formData.type,
          description: formData.description,
          reminderTime: formData.reminderTime
        }
      }

      setEvents([...events, newEvent])
      toast.success('Schedule created successfully')
      setIsCreateEventModalOpen(false)
      setFormData({
        title: '',
        start: '',
        end: '',
        description: '',
        type: 'appointment',
        isAllDay: false,
      })
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create schedule')
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Schedule Calendar</CardTitle>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateEventModalOpen(true)}
            >
              Create Schedule
            </Button>
            <Select
              value={selectedBarber?.id.toString()}
              onValueChange={(value) => {
                const barber = barbers.find(b => b.id.toString() === value)
                setSelectedBarber(barber || null)
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a barber" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id.toString()}>
                    {barber.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px]">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={true}
            height="100%"
            selectable={true}
            select={handleDateSelect}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
          />
        </div>
      </CardContent>

      {/* Create Schedule Modal */}
      <Dialog open={isCreateEventModalOpen} onOpenChange={setIsCreateEventModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="appointment" className="w-full" onValueChange={(value) => setFormData({ ...formData, type: value as 'task' | 'appointment' | 'reminder' })}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="task">Task</TabsTrigger>
              <TabsTrigger value="appointment">Appointment</TabsTrigger>
              <TabsTrigger value="reminder">Reminder</TabsTrigger>
            </TabsList>
            <TabsContent value={formData.type} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter schedule title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter schedule description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allDay"
                  checked={formData.isAllDay}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAllDay: checked })}
                />
                <Label htmlFor="allDay">All Day Schedule</Label>
              </div>
              {formData.type === 'reminder' && (
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Time</Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEventModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEventSubmit}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}