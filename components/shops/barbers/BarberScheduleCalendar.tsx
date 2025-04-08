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
import { Calendar, Clock, Users, Mail, Phone, Bell, Trash2, Edit2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { useTheme } from "next-themes"

interface BarberScheduleCalendarProps {
  barbers: Barber[]
  shopId: number
  accessToken: string
}

interface EventFormData {
  clientName: string
  clientPhone: string
  appointmentTime: string
  numberOfPeople: number
  id?: string
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const eventColors = {
  appointment: '#4285F4', // Google Calendar blue
  reminder: '#F4B400', // Google Calendar yellow
  schedule: '#1a73e8', // Google Calendar primary blue
  tentative: '#EA4335', // Google Calendar red
  busy: '#34A853' // Google Calendar green
}

export function BarberScheduleCalendar({ barbers, shopId, accessToken }: BarberScheduleCalendarProps) {
  const { theme } = useTheme()
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    clientName: '',
    clientPhone: '',
    appointmentTime: '',
    numberOfPeople: 1,
    id: undefined
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

      const fetchEvents = async () => {
    if (!selectedBarber) return;

    setIsLoading(true)
    try {
          const appointmentsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/appointments/?barber_id=${selectedBarber.id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
          }
            }
          )
      
          if (!appointmentsResponse.ok) {
        let errorMessage = 'Failed to fetch appointments'
        try {
            const errorData = await appointmentsResponse.json()
          errorMessage = errorData.detail || errorMessage
            console.error('Appointment fetch error:', errorData)
        } catch (e) {
          console.error('Error parsing error response:', e)
          }
        throw new Error(errorMessage)
      }

          const appointments = await appointmentsResponse.json()
          
          // Get current date to create proper date strings
          const now = new Date()
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth()
          const currentDate = now.getDate()
          
          // Convert schedules to calendar events
      const scheduleEvents = selectedBarber.schedules.flatMap(schedule => {
        // Convert day 7 to 0 for Sunday if needed
        const scheduleDay = schedule.day_of_week === 7 ? 0 : schedule.day_of_week
        console.log(`Processing schedule for day ${scheduleDay} (${dayNames[scheduleDay]})`)
        
        // Get the next 4 weeks of dates for this schedule
        const events = []
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        const currentDate = now.getDate()
        
        // Create events for the next 4 weeks
        for (let week = 0; week < 4; week++) {
            const eventDate = new Date(currentYear, currentMonth, currentDate)
          const daysUntilNext = (scheduleDay - eventDate.getDay() + 7) % 7
          eventDate.setDate(currentDate + daysUntilNext + (week * 7))
            
            const startDateTime = new Date(eventDate)
            const [startHours, startMinutes] = schedule.start_time.split(':')
            startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))
            
            const endDateTime = new Date(eventDate)
            const [endHours, endMinutes] = schedule.end_time.split(':')
            endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))
            
          console.log(`Created schedule event for ${dayNames[scheduleDay]} - Week ${week + 1}: ${startDateTime.toLocaleString()} to ${endDateTime.toLocaleString()}`)
          
          events.push({
            id: `schedule-${schedule.id}-${week}`,
            title: `${selectedBarber.full_name} - ${dayNames[scheduleDay]}`,
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              backgroundColor: eventColors.schedule,
              borderColor: eventColors.schedule,
              extendedProps: {
                type: 'schedule',
              barberName: selectedBarber.full_name,
              recurring: true,
              dayOfWeek: scheduleDay
            },
            display: 'background'
          })
        }
        
        return events
          })

          // Convert appointments to calendar events
          const appointmentEvents = appointments.map((appointment: any) => ({
            id: appointment.id,
        title: `${appointment.full_name} - ${appointment.phone_number}`,
            start: appointment.appointment_time,
            end: new Date(new Date(appointment.appointment_time).getTime() + 30 * 60000).toISOString(), // 30 min duration
            backgroundColor: eventColors.appointment,
            borderColor: eventColors.appointment,
            extendedProps: {
              type: 'appointment',
          description: appointment.description || '',
              clientName: appointment.full_name,
              clientPhone: appointment.phone_number,
          clientEmail: appointment.email || '',
              barberName: selectedBarber.full_name
            }
          }))
          
          setEvents([...scheduleEvents, ...appointmentEvents])
        } catch (error) {
          console.error('Error fetching events:', error)
          toast.error(error instanceof Error ? error.message : 'Failed to fetch events')
    } finally {
      setIsLoading(false)
        }
      }

  useEffect(() => {
      fetchEvents()
  }, [selectedBarber, shopId, accessToken, refreshKey])

  const isWithinBusinessHours = (date: Date) => {
    if (!selectedBarber) return false

    return selectedBarber.schedules.some(schedule => {
      const day = date.getDay()
      if (schedule.day_of_week !== day) return false

      const [startHour, startMinute] = schedule.start_time.split(':').map(Number)
      const [endHour, endMinute] = schedule.end_time.split(':').map(Number)
      
      const timeHour = date.getHours()
      const timeMinute = date.getMinutes()
      
      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute
      const time = timeHour * 60 + timeMinute
      
      return time >= startTime && time < endTime
    })
  }

  const handleDateSelect = (selectInfo: any) => {
    if (!selectedBarber) {
      toast.error('Please select a barber first')
      return
    }

    // Check if the selected time is within business hours
    if (!isWithinBusinessHours(selectInfo.start)) {
      toast.error('Please select a time within business hours')
      return
    }

    setSelectedDate(selectInfo.start)
    setFormData({
      clientName: '',
      clientPhone: '',
      appointmentTime: selectInfo.startStr,
      numberOfPeople: 1,
      id: undefined
    })
    setIsEditing(false)
    setIsCreateEventModalOpen(true)
  }

  const handleEventSubmit = async () => {
    try {
      if (!selectedBarber) {
        toast.error('Please select a barber first')
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

      if (!formData.appointmentTime) {
        toast.error('Please select appointment time')
        return
      }

      const startDate = new Date(formData.appointmentTime)

      // Check if the appointment time is within business hours
      if (!isWithinBusinessHours(startDate)) {
        toast.error('Selected time is outside business hours')
        return
      }

      // Only check for overlapping appointments when creating a new appointment
      if (!isEditing) {
      const hasOverlap = events.some(event => {
          if (event.extendedProps?.type !== 'appointment') return false

        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end)
        
        return (
          (startDate >= eventStart && startDate < eventEnd) ||
            (startDate <= eventStart && startDate >= eventEnd)
        )
      })

      if (hasOverlap) {
        toast.error('This time slot is already booked. Please choose a different time.')
        return
        }
      }

      // Map the request body to exactly match the API's expected format
      const requestBody = {
        "shop_id": shopId,
        "barber_id": selectedBarber.id,
        "service_id": 0,
        "appointment_time": startDate.toISOString(),
        "number_of_people": formData.numberOfPeople,
        "user_id": 0,
        "full_name": formData.clientName,
        "phone_number": formData.clientPhone
      }

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/appointments/`
      const method = isEditing ? 'PUT' : 'POST'
      const url = isEditing ? `${endpoint}${formData.id}/` : endpoint

      console.log('Making request to:', url)
      console.log('Request body:', requestBody)
      console.log('Selected barber schedules:', selectedBarber.schedules)
      console.log('Appointment time:', startDate.toLocaleString(), 'Day:', startDate.getDay())

      setIsLoading(true)

      try {
      const response = await fetch(url, {
        method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
          let errorMessage = 'Failed to create appointment'
          try {
        const errorData = await response.json()
            errorMessage = errorData.detail || errorMessage
            console.error('Server error response:', errorData)
          } catch (e) {
            console.error('Error parsing error response:', e)
          }
          throw new Error(errorMessage)
        }

        const savedAppointment = await response.json()

        // Update events list with the new appointment
      const newEvent = {
          id: savedAppointment.id,
          title: `${formData.clientName} - ${formData.clientPhone}`,
          start: startDate.toISOString(),
          end: new Date(startDate.getTime() + 30 * 60000).toISOString(), // 30 minutes duration
        backgroundColor: eventColors.appointment,
        borderColor: eventColors.appointment,
        extendedProps: {
          type: 'appointment',
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          barberName: selectedBarber.full_name,
            numberOfPeople: formData.numberOfPeople
        }
      }

      if (isEditing) {
        setEvents(events.map(event => 
          event.id === formData.id ? newEvent : event
        ))
      } else {
        setEvents([...events, newEvent])
      }

      toast.success(`Appointment ${isEditing ? 'updated' : 'created'} successfully`)
      setIsCreateEventModalOpen(false)
        resetFormData()
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        console.error('Network or parsing error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create appointment')
    } finally {
      setIsLoading(false)
      setIsEditing(false)
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    const props = event.extendedProps

    if (props.type === 'appointment') {
      // Handle appointment click for editing
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setFormData({
        clientName: props.clientName,
        clientPhone: props.clientPhone,
        appointmentTime: formatDate(event.start),
        numberOfPeople: props.numberOfPeople || 1,
        id: event.id
      })
      setIsEditing(true)
      setIsCreateEventModalOpen(true)
    } else if (props.type === 'schedule') {
      // Handle schedule click for creating new appointment
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setFormData({
        clientName: '',
        clientPhone: '',
        appointmentTime: formatDate(event.start),
        numberOfPeople: 1,
        id: undefined
      })
      setIsEditing(false)
      setIsCreateEventModalOpen(true)
    }
  }

  const handleDeleteAppointment = async () => {
    try {
      if (!appointmentToDelete?.id) {
        toast.error('No appointment selected for deletion')
        return
      }

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentToDelete.id}/`
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete appointment')
      }

      // Remove the appointment from the events list
      setEvents(events.filter(event => event.id !== appointmentToDelete.id))
      
      toast.success('Appointment deleted successfully')
      setIsDeleteDialogOpen(false)
      setAppointmentToDelete(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete appointment')
    }
  }

  const renderEventContent = (eventInfo: any) => {
    const props = eventInfo.event.extendedProps
    const isAppointment = props.type === 'appointment'
    
    return (
      <div className="flex items-center gap-2 p-1">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: eventInfo.event.backgroundColor }}
        />
        <span className="text-sm font-medium truncate">{eventInfo.event.title}</span>
        {isAppointment && props.hasReminder && (
          <Bell className="w-3 h-3 text-yellow-500" />
        )}
      </div>
    )
  }

  const renderEventTooltip = (event: any) => {
    const props = event.extendedProps
    if (props.type !== 'appointment') return null

    return (
      <div className="space-y-2 p-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{event.title}</h4>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEventClick({ event })
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit appointment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAppointmentToDelete(event)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete appointment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(event.start), 'MMM d, yyyy h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{props.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{props.clientPhone}</span>
          </div>
          {props.clientEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{props.clientEmail}</span>
            </div>
          )}
          {props.description && (
            <p className="mt-2 text-sm text-gray-600">{props.description}</p>
          )}
          {props.hasReminder && (
            <div className="flex items-center gap-2 mt-2 text-yellow-600">
              <Bell className="h-4 w-4" />
              <span>Reminder set for {props.reminderTime}</span>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setAppointmentToDelete(event)
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Appointment
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Convert barber schedules to business hours format
  const getBusinessHours = () => {
    if (!selectedBarber) return []

    console.log('Processing business hours for barber:', selectedBarber.full_name)
    
    return selectedBarber.schedules.map(schedule => {
      // Convert day 7 to 0 for Sunday if needed
      const dayOfWeek = schedule.day_of_week === 7 ? 0 : schedule.day_of_week
      console.log(`Setting business hours for ${dayNames[dayOfWeek]}: ${schedule.start_time} - ${schedule.end_time}`)
      
      return {
        daysOfWeek: [dayOfWeek],
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        display: 'background'
      }
    })
  }

  const resetFormData = () => {
    setFormData({
      clientName: '',
      clientPhone: '',
      appointmentTime: '',
      numberOfPeople: 1,
      id: undefined
    })
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Appointments Calendar</CardTitle>
          <div className="flex items-center gap-4">
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
        <style>
          {`
            .fc {
              --fc-event-bg-color: ${eventColors.appointment};
              --fc-event-border-color: ${eventColors.appointment};
              --fc-today-bg-color: rgba(66, 133, 244, 0.1);
              --fc-now-indicator-color: ${eventColors.tentative};
              --fc-highlight-color: rgba(66, 133, 244, 0.2);
            }
            .dark .fc {
              --fc-border-color: rgba(255, 255, 255, 0.2);
              --fc-page-bg-color: rgb(17, 24, 39);
              --fc-neutral-bg-color: rgb(31, 41, 55);
              --fc-list-event-hover-bg-color: rgb(55, 65, 81);
              --fc-today-bg-color: rgba(66, 133, 244, 0.1);
            }
            .dark .fc-theme-standard td, 
            .dark .fc-theme-standard th {
              border-color: var(--fc-border-color);
            }
            .dark .fc-timegrid-slot-label,
            .dark .fc-timegrid-axis-cushion,
            .dark .fc-col-header-cell-cushion,
            .dark .fc-toolbar-title,
            .dark .fc-event-title,
            .dark .fc-event-time {
              color: rgb(229, 231, 235);
            }
            .dark .fc-button {
              background-color: rgb(31, 41, 55);
              border-color: rgba(255, 255, 255, 0.2);
              color: rgb(229, 231, 235);
            }
            .dark .fc-button:hover {
              background-color: rgb(55, 65, 81);
            }
            .dark .fc-button-active {
              background-color: ${eventColors.schedule} !important;
              border-color: ${eventColors.schedule} !important;
            }
            .dark .fc-timegrid-col-bg .fc-non-business {
              background: rgba(0, 0, 0, 0.2);
            }
            .dark .fc-highlight {
              background: rgba(66, 133, 244, 0.2);
            }
            .dark .fc-event {
              border-color: transparent;
            }
            .dark .fc-event:hover {
              filter: brightness(1.1);
            }
            .fc-event {
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .fc-event:hover {
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transform: translateY(-1px);
            }
            .fc-toolbar-chunk {
              display: flex;
              gap: 0.5rem;
              align-items: center;
            }
            .fc-button {
              text-transform: capitalize !important;
              font-weight: 500 !important;
            }
            .fc-button-primary {
              background-color: ${eventColors.schedule} !important;
              border-color: ${eventColors.schedule} !important;
            }
            .fc-button-primary:not(.fc-button-active):hover {
              background-color: ${eventColors.schedule} !important;
              filter: brightness(1.1);
            }
            .fc-timegrid-slot {
              height: 48px !important;
            }
            .fc-timegrid-slot-label {
              font-size: 0.875rem;
            }
            .fc-col-header-cell {
              padding: 8px 0;
              font-weight: 500;
            }
          `}
        </style>
        <div className="h-[700px] relative dark:bg-gray-900">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            allDaySlot={false}
            height="100%"
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: true
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: true
            }}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
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
            businessHours={getBusinessHours()}
            selectConstraint="businessHours"
            eventConstraint="businessHours"
            slotLabelInterval="01:00"
            weekends={true}
            firstDay={1}
            scrollTime="08:00:00"
            snapDuration="00:15:00"
          />
        </div>
      </CardContent>

      {/* Create/Edit Event Modal */}
      <Dialog open={isCreateEventModalOpen} onOpenChange={setIsCreateEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                placeholder="Enter client name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone Number</Label>
                <Input
                  id="clientPhone"
                placeholder="Enter phone number"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
              <Label>Appointment Time</Label>
              <p className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfPeople">Number of People</Label>
                <Input
                id="numberOfPeople"
                type="number"
                min="1"
                placeholder="Enter number of people"
                value={formData.numberOfPeople}
                onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 1 })}
              />
            </div>
              </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateEventModalOpen(false)
              resetFormData()
            }}>
              Cancel
            </Button>
            {isEditing && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setAppointmentToDelete({ id: formData.id })
                  setIsDeleteDialogOpen(true)
                  setIsCreateEventModalOpen(false)
                }}
              >
                Delete Appointment
              </Button>
            )}
            <Button onClick={handleEventSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 