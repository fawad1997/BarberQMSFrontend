import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Event } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, addHours } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/styles/calendar.css'
import { Barber } from '@/types/barber'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Trash2, Edit, Clock, User, Phone, Calendar as CalendarIcon } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'

// Set up the localizer
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface BarberBigCalendarProps {
  barbers: Barber[]
  shopId: number
  accessToken: string
}

interface Appointment {
  id: number
  shop_id: number
  barber_id: number
  service_id: number | null
  appointment_time: string
  end_time: string | null
  number_of_people: number
  status: string
  created_at: string
  actual_start_time: string | null
  actual_end_time: string | null
  full_name: string
  phone_number: string
  barber: {
    id: number
    status: string
    full_name: string
    phone_number: string
    email: string
  }
  service: any | null
}

interface EventWithAppointment extends Event {
  id: number | string
  appointment?: Appointment
  resource?: {
    barber_id: number
    type: string
  }
  start: Date
  end: Date
}

interface BarberSchedule {
  id: number
  barber_id: number
  day_of_week: number
  start_time: string
  end_time: string
}

interface Service {
  id: number
  name: string
  description: string | null
  duration: number
  price: number
}

export function BarberBigCalendar({ barbers, shopId, accessToken }: BarberBigCalendarProps) {
  const [events, setEvents] = useState<EventWithAppointment[]>([])
  const [scheduleEvents, setScheduleEvents] = useState<EventWithAppointment[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithAppointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null)
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    start_time: '',
    end_time: '',
    barber_id: '',
    service_id: '',
    number_of_people: 1,
  })
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)

  // Fetch events from the backend
  const fetchEvents = useCallback(async () => {
    if (!accessToken) return

    try {
      console.log('Fetching appointments for shop:', shopId)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/shop/${shopId}/appointments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error fetching appointments:', errorData)
        throw new Error(errorData.detail || 'Failed to fetch appointments')
      }

      const data = await response.json()
      console.log('Fetched appointments:', data)
      
      // Transform the data to match the calendar format
      const transformedEvents = data.map((appointment: Appointment) => {
        const startTime = new Date(appointment.appointment_time)
        const endTime = appointment.end_time 
          ? new Date(appointment.end_time)
          : addHours(startTime, 1) // Default to 1 hour if no end time

        return {
          id: appointment.id,
          title: appointment.full_name,
          start: startTime,
          end: endTime,
          appointment_time: appointment.appointment_time,
          status: appointment.status,
          created_at: appointment.created_at,
          number_of_people: appointment.number_of_people,
          shop_id: appointment.shop_id,
          barber_id: appointment.barber_id,
          service_id: appointment.service_id,
          full_name: appointment.full_name,
          phone_number: appointment.phone_number,
          barber: appointment.barber,
          service: appointment.service,
          appointment,
        }
      })

      console.log('Transformed events:', transformedEvents)
      setEvents(transformedEvents)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to fetch appointments')
    }
  }, [shopId, accessToken])

  // Fetch barber schedules
  const fetchBarberSchedules = useCallback(async () => {
    if (!accessToken) return

    try {
      console.log('Fetching barber schedules...')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barberId}/schedules/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error fetching barber schedules:', errorData)
        throw new Error('Failed to fetch barber schedules')
      }

      const schedules: BarberSchedule[] = await response.json()
      console.log('Received barber schedules:', schedules)
      
      // Transform schedules into recurring events
      const currentDate = new Date()
      const scheduleEvents: EventWithAppointment[] = []

      // Create events for the next 3 months
      for (let i = 0; i < 90; i++) {
        const date = addDays(currentDate, i)
        const dayOfWeek = getDay(date)

        schedules.forEach(schedule => {
          // Backend uses 1-7 (Monday-Sunday), convert to 0-6 (Sunday-Saturday)
          const scheduleDayOfWeek = schedule.day_of_week === 7 ? 0 : schedule.day_of_week - 1

          if (scheduleDayOfWeek === dayOfWeek) {
            const barber = barbers.find(b => b.id === schedule.barber_id)
            if (!barber) {
              console.log(`Barber not found for ID: ${schedule.barber_id}`)
              return
            }

            const [startHour, startMinute] = schedule.start_time.split(':')
            const [endHour, endMinute] = schedule.end_time.split(':')

            const start = new Date(date)
            start.setHours(parseInt(startHour), parseInt(startMinute), 0)
            
            const end = new Date(date)
            end.setHours(parseInt(endHour), parseInt(endMinute), 0)

            console.log(`Creating schedule event for ${barber.full_name} on ${format(date, 'yyyy-MM-dd')} from ${schedule.start_time} to ${schedule.end_time}`)

            scheduleEvents.push({
              id: `schedule-${schedule.id}-${i}`,
              title: `${barber.full_name} - Available`,
              start,
              end,
              resource: {
                barber_id: schedule.barber_id,
                type: 'schedule'
              }
            } as EventWithAppointment)
          }
        })
      }

      console.log('Created schedule events:', scheduleEvents)
      setScheduleEvents(scheduleEvents)
    } catch (error) {
      console.error('Error fetching barber schedules:', error)
      toast.error('Failed to fetch barber schedules')
    }
  }, [shopId, accessToken, barbers])

  // Add function to fetch barber services
  const fetchBarberServices = useCallback(async (barberId: number) => {
    setIsLoadingServices(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barberId}/services`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch barber services')
      }

      const data = await response.json()
      setAvailableServices(data)
    } catch (error) {
      console.error('Error fetching barber services:', error)
      toast.error('Failed to load barber services')
      setAvailableServices([])
    } finally {
      setIsLoadingServices(false)
    }
  }, [shopId, accessToken])

  useEffect(() => {
    fetchEvents()
    fetchBarberSchedules()
  }, [fetchEvents, fetchBarberSchedules])

  // Check if a time slot is within business hours
  const isWithinBusinessHours = (date: Date) => {
    const dayOfWeek = date.getDay()
    // Check if it's a weekday (Monday to Saturday)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 6
    return isWeekday
  }

  // Handle slot selection
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    if (!isWithinBusinessHours(start)) {
      toast.error('Appointments can only be scheduled during business hours (9 AM to 6 PM, Monday to Saturday)')
      return
    }

    // Format the times for the form
    const startTime = format(start, 'yyyy-MM-dd\'T\'HH:mm')
    const endTime = format(end, 'yyyy-MM-dd\'T\'HH:mm')

    setFormData({
      client_name: '',
      client_phone: '',
      start_time: startTime,
      end_time: endTime,
      barber_id: selectedBarber?.toString() || '',
      service_id: '',
      number_of_people: 1,
    })

    setIsModalOpen(true)
  }, [selectedBarber])

  // Handle event selection
  const handleSelectEvent = useCallback((event: EventWithAppointment) => {
    setSelectedEvent(event)
    setIsModalOpen(true)

    if (event.appointment) {
      setFormData({
        client_name: event.appointment.full_name || '',
        client_phone: event.appointment.phone_number || '',
        start_time: format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"),
        barber_id: event.appointment.barber_id?.toString() || '',
        service_id: event.appointment.service_id?.toString() || '',
        number_of_people: event.appointment.number_of_people || 1,
      })
      setSelectedBarber(event.appointment.barber_id || null)
      if (event.appointment.barber_id) {
        fetchBarberServices(event.appointment.barber_id)
      }
    } else {
      // This is for creating a new appointment from a time slot
      const startTime = format(event.start, "yyyy-MM-dd'T'HH:mm")
      const endTime = format(event.end, "yyyy-MM-dd'T'HH:mm")
      
      setFormData({
        client_name: '',
        client_phone: '',
        start_time: startTime,
        end_time: endTime,
        barber_id: selectedBarber?.toString() || '',
        service_id: '0',
        number_of_people: 1,
      })
    }
  }, [selectedBarber, fetchBarberServices])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBarber) {
      toast.error('Please select a barber')
      return
    }

    try {
      const url = selectedEvent
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointments/${selectedEvent.id}?phone_number=${encodeURIComponent(formData.client_phone)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/appointments/`

      const method = selectedEvent ? 'PUT' : 'POST'

      console.log('Making request to:', url)
      console.log('Request payload:', {
        shop_id: shopId,
        barber_id: selectedBarber,
        service_id: formData.service_id || 0,
        appointment_time: formData.start_time,
        end_time: formData.end_time,
        number_of_people: formData.number_of_people,
        user_id: 0,
        full_name: formData.client_name,
        phone_number: formData.client_phone,
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: shopId,
          barber_id: selectedBarber,
          service_id: formData.service_id || 0,
          appointment_time: formData.start_time,
          end_time: formData.end_time,
          number_of_people: formData.number_of_people,
          user_id: 0,
          full_name: formData.client_name,
          phone_number: formData.client_phone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.detail || 'Failed to save appointment')
      }

      await fetchEvents()
      setIsModalOpen(false)
      setSelectedEvent(null)
      toast.success(`Appointment ${selectedEvent ? 'updated' : 'created'} successfully`)
    } catch (error) {
      console.error('Error saving appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save appointment')
    }
  }

  // Handle appointment deletion
  const handleDeleteAppointment = async () => {
    if (!selectedEvent?.id || !selectedEvent.appointment?.phone_number) {
      toast.error('Missing appointment information')
      return
    }

    try {
      console.log('Deleting appointment with ID:', selectedEvent.id)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/appointments/${selectedEvent.id}?phone_number=${encodeURIComponent(selectedEvent.appointment.phone_number)}`
      console.log('API URL:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error data:', errorData)
        throw new Error(Array.isArray(errorData.detail) ? errorData.detail.join(', ') : errorData.detail || 'Failed to delete appointment')
      }

      // Only update UI after successful deletion
      await fetchEvents() // Refresh events from backend
      setIsDeleteModalOpen(false)
      setSelectedEvent(null)
      toast.success('Appointment deleted successfully')
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete appointment')
    }
  }

  // Custom event component
  const EventComponent = ({ event }: { event: EventWithAppointment }) => {
    const isSchedule = event.resource?.type === 'schedule'
    
    if (isSchedule) {
      return (
        <div className="p-1 h-full overflow-hidden bg-gray-200 border border-gray-300 rounded">
          <div className="font-medium text-gray-700 truncate">{event.title}</div>
          {event.start && event.end && (
            <div className="text-xs text-gray-600 truncate">
              {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
            </div>
          )}
        </div>
      )
    }

    const appointment = event.appointment
    if (!appointment) return null

    return (
      <div className="p-1 h-full overflow-hidden bg-blue-100 border border-blue-300 rounded">
        <div className="font-medium truncate">{appointment.full_name}</div>
        <div className="text-xs text-gray-500 truncate">
          {format(new Date(appointment.actual_start_time || appointment.appointment_time), 'HH:mm')} - {format(new Date(appointment.actual_end_time || appointment.appointment_time), 'HH:mm')}
        </div>
      </div>
    )
  }

  // Custom toolbar component
  const ToolbarComponent = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV')
    }

    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }

    const goToToday = () => {
      toolbar.onNavigate('TODAY')
    }

    const changeView = (newView: string) => {
      setView(newView as View)
      toolbar.onView(newView as View)
    }

    return (
      <div className="rbc-toolbar">
        <div className="rbc-btn-group">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="rbc-btn"
          >
            today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToBack}
            className="rbc-btn"
          >
            back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="rbc-btn"
          >
            next
          </Button>
        </div>
        <span className="rbc-toolbar-label">{toolbar.label}</span>
        <div className="rbc-btn-group">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeView('month')}
            className={`rbc-btn ${view === 'month' ? 'rbc-active' : ''}`}
          >
            month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeView('week')}
            className={`rbc-btn ${view === 'week' ? 'rbc-active' : ''}`}
          >
            week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeView('day')}
            className={`rbc-btn ${view === 'day' ? 'rbc-active' : ''}`}
          >
            day
          </Button>
        </div>
        <div className="rbc-toolbar-filter">
          <Select
            value={selectedBarber?.toString() || 'all'}
            onValueChange={(value) => setSelectedBarber(value === 'all' ? null : Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Barber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Barbers</SelectItem>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id.toString()}>
                  {barber.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // Filter events based on selected barber
  const filteredEvents = useCallback(() => {
    const allEvents = [...events, ...scheduleEvents]
    if (!selectedBarber) return allEvents

    const filtered = allEvents.filter(event => {
      if (event.resource?.type === 'schedule') {
        return event.resource.barber_id === selectedBarber
      }
      return event.appointment?.barber_id === selectedBarber
    })
    console.log('Filtered events:', filtered)
    return filtered
  }, [events, scheduleEvents, selectedBarber])

  // Update the barber selection handler
  const handleBarberChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, barber_id: value, service_id: '' }))
    setSelectedBarber(value ? Number(value) : null)
    
    if (value) {
      fetchBarberServices(Number(value))
    } else {
      setAvailableServices([])
    }
  }, [fetchBarberServices])

  return (
    <div className="h-[700px]">
      <Calendar
        localizer={localizer}
        events={filteredEvents()}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={(newView: View) => setView(newView)}
        date={date}
        onNavigate={date => setDate(date)}
        views={{
          month: true,
          week: true,
          day: true
        }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event: EventWithAppointment) => {
          if (!event.resource?.type) {
            handleSelectEvent(event)
          }
        }}
        components={{
          event: EventComponent,
          toolbar: ToolbarComponent,
        }}
        min={new Date(0, 0, 0, 0, 0, 0)}
        max={new Date(0, 0, 0, 23, 59, 59)}
        step={30}
        timeslots={2}
        formats={{
          timeGutterFormat: (date: Date) => format(date, 'h:mm a'),
          monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy'),
          dayHeaderFormat: (date: Date) => format(date, 'MMMM dd, yyyy'),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'MMMM dd')} - ${format(end, 'dd, yyyy')}`,
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
        }}
        className="rbc-calendar"
      />

      {/* Appointment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Appointment' : 'New Appointment'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_name" className="text-right">
                  <User className="h-4 w-4 inline mr-1" />
                  Client
                </Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client_phone" className="text-right">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone
                </Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_time" className="text-right">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Start Time
                </Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_time" className="text-right">
                  <Clock className="h-4 w-4 inline mr-1" />
                  End Time
                </Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="number_of_people" className="text-right">
                  <User className="h-4 w-4 inline mr-1" />
                  People
                </Label>
                <Input
                  id="number_of_people"
                  type="number"
                  min="1"
                  value={formData.number_of_people}
                  onChange={(e) => setFormData({ ...formData, number_of_people: parseInt(e.target.value) })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="barber_id" className="text-right">
                  <User className="h-4 w-4 inline mr-1" />
                  Barber
                </Label>
                <Select
                  value={formData.barber_id}
                  onValueChange={handleBarberChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Barber" />
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service_id" className="text-right">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Service
                </Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
                  disabled={!formData.barber_id || isLoadingServices}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={isLoadingServices ? "Loading services..." : "Select Service"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} - ${service.price} ({service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              {selectedEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setIsModalOpen(false)
                    setIsDeleteModalOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              <Button type="submit">
                {selectedEvent ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Delete Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this appointment?</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAppointment}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 