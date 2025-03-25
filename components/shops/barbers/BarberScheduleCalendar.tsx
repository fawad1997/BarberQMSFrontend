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
import { Badge } from "@/components/ui/badge"

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
  type: 'appointment' | 'reminder'
  isAllDay: boolean
  reminderTime?: string
  clientName: string
  clientPhone: string
  clientEmail: string
  color?: string
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const eventColors = {
  appointment: '#EF4444', // Red
  reminder: '#F59E0B', // Yellow
  schedule: '#4F46E5', // Indigo
}

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
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    color: eventColors.appointment
  })

  useEffect(() => {
    if (selectedBarber) {
      const fetchEvents = async () => {
        try {
          // Use schedules from the barber object
          const schedules = selectedBarber.schedules || []

          // Fetch appointments
          const appointmentsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/appointments/?barber_id=${selectedBarber.id}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          )
          if (!appointmentsResponse.ok) {
            const errorData = await appointmentsResponse.json()
            console.error('Appointment fetch error:', errorData)
            throw new Error(errorData.detail || 'Failed to fetch appointments')
          }
          const appointments = await appointmentsResponse.json()
          
          // Get current date to create proper date strings
          const now = new Date()
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth()
          const currentDate = now.getDate()
          
          // Convert schedules to calendar events
          const scheduleEvents = schedules.map(schedule => {
            const eventDate = new Date(currentYear, currentMonth, currentDate)
            eventDate.setDate(currentDate + (schedule.day_of_week - now.getDay()))
            
            const startDateTime = new Date(eventDate)
            const [startHours, startMinutes] = schedule.start_time.split(':')
            startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))
            
            const endDateTime = new Date(eventDate)
            const [endHours, endMinutes] = schedule.end_time.split(':')
            endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))
            
            return {
              id: schedule.id,
              title: `${selectedBarber.full_name} - ${dayNames[schedule.day_of_week]}`,
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              backgroundColor: eventColors.schedule,
              borderColor: eventColors.schedule,
              extendedProps: {
                type: 'schedule',
                barberName: selectedBarber.full_name
              }
            }
          })

          // Convert appointments to calendar events
          const appointmentEvents = appointments.map((appointment: any) => ({
            id: appointment.id,
            title: appointment.title || 'Appointment',
            start: appointment.appointment_time,
            end: new Date(new Date(appointment.appointment_time).getTime() + 30 * 60000).toISOString(), // 30 min duration
            backgroundColor: eventColors.appointment,
            borderColor: eventColors.appointment,
            extendedProps: {
              type: 'appointment',
              description: appointment.description,
              clientName: appointment.full_name,
              clientPhone: appointment.phone_number,
              clientEmail: appointment.email,
              barberName: selectedBarber.full_name
            }
          }))
          
          setEvents([...scheduleEvents, ...appointmentEvents])
        } catch (error) {
          console.error('Error fetching events:', error)
          toast.error(error instanceof Error ? error.message : 'Failed to fetch events')
        }
      }

      fetchEvents()
    } else {
      setEvents([])
    }
  }, [selectedBarber, shopId, accessToken])

  const handleDateSelect = (selectInfo: any) => {
    if (!selectedBarber) {
      toast.error('Please select a barber first')
      return
    }

    setSelectedDate(selectInfo.start)
    setFormData({
      ...formData,
      start: selectInfo.start.toISOString().slice(0, 16),
      end: selectInfo.end.toISOString().slice(0, 16),
    })
    setIsCreateEventModalOpen(true)
  }

  const handleEventSubmit = async () => {
    try {
      if (!selectedBarber) {
        toast.error('Please select a barber first')
        return
      }

      if (!formData.title.trim()) {
        toast.error('Please enter a title')
        return
      }

      if (!formData.clientName.trim()) {
        toast.error('Please enter client name')
        return
      }

      if (!formData.clientPhone.trim()) {
        toast.error('Please enter client phone number')
        return
      }

      if (!formData.start || !formData.end) {
        toast.error('Please select start and end times')
        return
      }

      const startDate = new Date(formData.start)
      const endDate = new Date(formData.end)

      if (startDate >= endDate) {
        toast.error('End time must be after start time')
        return
      }

      // Validate appointment time against shop operating hours
      const dayOfWeek = startDate.getDay()
      const barberSchedule = selectedBarber.schedules?.find(schedule => schedule.day_of_week === dayOfWeek)
      
      if (!barberSchedule) {
        toast.error('Barber is not working on this day')
        return
      }

      // Convert schedule times to Date objects for comparison
      const [startHours, startMinutes] = barberSchedule.start_time.split(':')
      const [endHours, endMinutes] = barberSchedule.end_time.split(':')
      
      // Create schedule start and end times for the appointment date
      const scheduleStart = new Date(startDate)
      scheduleStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)
      
      const scheduleEnd = new Date(startDate)
      scheduleEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)

      // Handle overnight hours (when end time is earlier than start time)
      if (scheduleEnd < scheduleStart) {
        scheduleEnd.setDate(scheduleEnd.getDate() + 1)
      }

      // Get appointment times in hours and minutes for comparison
      const appointmentStartHours = startDate.getHours()
      const appointmentStartMinutes = startDate.getMinutes()
      const appointmentEndHours = endDate.getHours()
      const appointmentEndMinutes = endDate.getMinutes()

      // Convert to minutes for easier comparison
      const scheduleStartMinutes = parseInt(startHours) * 60 + parseInt(startMinutes)
      const scheduleEndMinutes = parseInt(endHours) * 60 + parseInt(endMinutes)
      const appointmentStartTotalMinutes = appointmentStartHours * 60 + appointmentStartMinutes
      const appointmentEndTotalMinutes = appointmentEndHours * 60 + appointmentEndMinutes

      // Check if appointment is within operating hours
      if (appointmentStartTotalMinutes < scheduleStartMinutes || appointmentEndTotalMinutes > scheduleEndMinutes) {
        toast.error(`Appointment must be within operating hours (${barberSchedule.start_time} - ${barberSchedule.end_time})`)
        return
      }

      const requestBody = {
        shop_id: shopId,
        barber_id: selectedBarber.id,
        title: formData.title,
        description: formData.description,
        appointment_time: formData.start,
        full_name: formData.clientName,
        phone_number: formData.clientPhone,
        email: formData.clientEmail,
        is_all_day: formData.isAllDay
      }

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/appointments/`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to create appointment')
      }

      const newEvent = {
        id: responseData.id,
        title: formData.title,
        start: formData.start,
        end: formData.end,
        backgroundColor: eventColors.appointment,
        borderColor: eventColors.appointment,
        extendedProps: {
          type: 'appointment',
          description: formData.description,
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail,
          barberName: selectedBarber.full_name
        }
      }

      setEvents([...events, newEvent])
      toast.success('Appointment created successfully')
      setIsCreateEventModalOpen(false)
      setFormData({
        title: '',
        start: '',
        end: '',
        description: '',
        type: 'appointment',
        isAllDay: false,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        color: eventColors.appointment
      })
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create appointment')
    }
  }

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="flex items-center gap-2 p-1">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: eventInfo.event.backgroundColor }}
        />
        <span className="text-sm font-medium">{eventInfo.event.title}</span>
      </div>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Appointment Calendar</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                Working Hours
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                Appointment
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                Reminder
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (!selectedBarber) {
                  toast.error('Please select a barber first')
                  return
                }
                setIsCreateEventModalOpen(true)
              }}
            >
              New Appointment
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
            eventContent={renderEventContent}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            slotLabelClassNames="text-sm font-medium"
            dayHeaderClassNames="text-sm font-medium"
            nowIndicator={true}
            eventDisplay="block"
            eventMinHeight={25}
            eventShortHeight={25}
            expandRows={true}
            stickyHeaderDates={true}
            dayMaxEvents={true}
            eventMaxStack={3}
            eventDidMount={(info) => {
              const event = info.event
              const props = event.extendedProps
              info.el.title = `
                ${event.title}
                Client: ${props.clientName}
                Phone: ${props.clientPhone}
                Email: ${props.clientEmail}
                ${props.description ? `\nDescription: ${props.description}` : ''}
              `
            }}
          />
        </div>
      </CardContent>

      {/* Create Appointment Modal */}
      <Dialog open={isCreateEventModalOpen} onOpenChange={setIsCreateEventModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="appointment" className="w-full" onValueChange={(value) => {
            const type = value as 'appointment' | 'reminder'
            setFormData({ 
              ...formData, 
              type,
              color: eventColors[type]
            })
          }}>
            <TabsList className="grid w-full grid-cols-2">
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
                  placeholder="Enter appointment title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="Enter client phone number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="Enter client email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter appointment description"
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
                <Label htmlFor="allDay">All Day Event</Label>
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
              Create {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}