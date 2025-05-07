import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Event } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
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
import { Switch } from '@/components/ui/switch'

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

// Create DnD Calendar
const DnDCalendar = withDragAndDrop<EventWithAppointment>(Calendar as any)

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
  barber_id?: number
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

interface BarberScheduleCreate {
  barber_id: number;
  start_date: string; // ISO format datetime string
  end_date: string;   // ISO format datetime string
  repeat_frequency: "none" | "daily" | "weekly" | "monthly" | "yearly";
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
  const [calendarViewMode, setCalendarViewMode] = useState<'work_schedules' | 'appointments'>('appointments')
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false)
  const [scheduleFormData, setScheduleFormData] = useState({
    barber_id: '',
    start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    repeat_frequency: 'none'
  })
  const [selectedSchedule, setSelectedSchedule] = useState<EventWithAppointment | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

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
      console.log('Raw appointments data from backend:', data)
      
      // Transform the data to match the calendar format
      const transformedEvents = data
        .filter((appointment: Appointment) => appointment.status !== 'cancelled') // Only include non-cancelled appointments
        .map((appointment: Appointment) => {
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

      console.log('Transformed events for calendar:', transformedEvents)
      setEvents(transformedEvents)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to fetch appointments')
    }
  }, [shopId, accessToken])

  // Fetch barber schedules
  const fetchBarberSchedules = useCallback(async () => {
    if (!accessToken) {
      console.log('No access token available')
      return
    }

    try {
      console.log('Starting to fetch barber schedules...')
      // Fetch schedules for all barbers
      const schedulePromises = barbers.map(async (barber) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${barber.id}/schedules/`
        console.log(`Fetching schedules for barber ${barber.id} from:`, url)
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`Error fetching schedules for barber ${barber.id}:`, errorData)
          return []
        }

        const data = await response.json()
        console.log(`Received schedules for barber ${barber.id}:`, data)
        return data
      })

      const allSchedules = await Promise.all(schedulePromises)
      const schedules = allSchedules.flat()
      console.log('All received schedules:', schedules)
      
      // Transform schedules into events
      const scheduleEvents: EventWithAppointment[] = []

      schedules.forEach(schedule => {
        console.log('Processing schedule:', schedule)
        const barber = barbers.find(b => b.id === schedule.barber_id)
        if (!barber) {
          console.log(`Barber not found for ID: ${schedule.barber_id}`)
          return
        }

        try {
          const startDate = new Date(schedule.start_date)
          const endDate = new Date(schedule.end_date)
          
          console.log(`Creating events for schedule ${schedule.id}:`, {
            barber: barber.full_name,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            repeat_frequency: schedule.repeat_frequency
          })

          // Create events based on repeat_frequency
          switch (schedule.repeat_frequency.toLowerCase()) {
            case 'none':
              // Single event
              scheduleEvents.push({
                id: `schedule-${schedule.id}`,
                title: `${barber.full_name} - Work Hours`,
                start: startDate,
                end: endDate,
                resource: {
                  barber_id: schedule.barber_id,
                  type: 'schedule'
                }
              } as EventWithAppointment)
              break

            case 'daily':
              // Create daily events for the next 30 days
              for (let i = 0; i < 30; i++) {
                const eventStart = addDays(startDate, i)
                const eventEnd = addDays(endDate, i)
                scheduleEvents.push({
                  id: `schedule-${schedule.id}-${i}`,
                  title: `${barber.full_name} - Work Hours`,
                  start: eventStart,
                  end: eventEnd,
                  resource: {
                    barber_id: schedule.barber_id,
                    type: 'schedule'
                  }
                } as EventWithAppointment)
              }
              break

            case 'weekly':
              // Create weekly events for the next 12 weeks
              for (let i = 0; i < 12; i++) {
                const eventStart = addDays(startDate, i * 7)
                const eventEnd = addDays(endDate, i * 7)
                scheduleEvents.push({
                  id: `schedule-${schedule.id}-${i}`,
                  title: `${barber.full_name} - Work Hours`,
                  start: eventStart,
                  end: eventEnd,
                  resource: {
                    barber_id: schedule.barber_id,
                    type: 'schedule'
                  }
                } as EventWithAppointment)
              }
              break

            case 'monthly':
              // Create monthly events for the next 6 months
              for (let i = 0; i < 6; i++) {
                const eventStart = addDays(startDate, i * 30)
                const eventEnd = addDays(endDate, i * 30)
                scheduleEvents.push({
                  id: `schedule-${schedule.id}-${i}`,
                  title: `${barber.full_name} - Work Hours`,
                  start: eventStart,
                  end: eventEnd,
                  resource: {
                    barber_id: schedule.barber_id,
                    type: 'schedule'
                  }
                } as EventWithAppointment)
              }
              break

            case 'yearly':
              // Create yearly events for the next 2 years
              for (let i = 0; i < 2; i++) {
                const eventStart = addDays(startDate, i * 365)
                const eventEnd = addDays(endDate, i * 365)
                scheduleEvents.push({
                  id: `schedule-${schedule.id}-${i}`,
                  title: `${barber.full_name} - Work Hours`,
                  start: eventStart,
                  end: eventEnd,
                  resource: {
                    barber_id: schedule.barber_id,
                    type: 'schedule'
                  }
                } as EventWithAppointment)
              }
              break
          }
        } catch (error) {
          console.error('Error processing schedule:', schedule, error)
        }
      })

      console.log('Final schedule events created:', scheduleEvents)
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

  // Filter events based on selected barber and view mode
  const filteredEvents = useCallback(() => {
    console.log('Filtering events:', {
      calendarViewMode,
      selectedBarber,
      scheduleEventsCount: scheduleEvents.length,
      eventsCount: events.length,
      currentDate: date
    })

    if (calendarViewMode === 'work_schedules') {
      const filtered = scheduleEvents.filter(event => {
        const isSchedule = event.resource?.type === 'schedule'
        const matchesBarber = !selectedBarber || event.resource?.barber_id === selectedBarber
        const isInFuture = event.start >= new Date()
        
        console.log('Filtering schedule event:', {
          eventId: event.id,
          isSchedule,
          matchesBarber,
          isInFuture,
          start: event.start,
          end: event.end
        })
        
        return isSchedule && matchesBarber && isInFuture
      })
      
      console.log('Filtered schedule events:', filtered)
      return filtered
    } else {
      const filtered = events.filter(event => {
        const isAppointment = event.appointment !== undefined
        const matchesBarber = !selectedBarber || event.appointment?.barber_id === selectedBarber
        
        console.log('Filtering appointment event:', {
          eventId: event.id,
          isAppointment,
          matchesBarber,
          start: event.start,
          end: event.end
        })
        
        return isAppointment && matchesBarber
      })
      
      console.log('Filtered appointment events:', filtered)
      return filtered
    }
  }, [events, scheduleEvents, selectedBarber, calendarViewMode, date])

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

      // Update local state to mark the appointment as cancelled
      setEvents(prevEvents => {
        return prevEvents.map(event => {
          if (event.appointment?.id === selectedEvent.id) {
            return {
              ...event,
              appointment: {
                ...event.appointment,
                status: 'cancelled'
              }
            }
          }
          return event
        })
      })

      // Clear selection and close modal
      setSelectedEvent(null)
      setIsDeleteModalOpen(false)

      // Force a refresh of the events
      console.log('Refreshing events from backend...')
      await fetchEvents()

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
          <div className="font-medium text-gray-700 truncate">
            {typeof event.title === 'string' ? event.title.replace('Barber', 'Artist') : event.title}
          </div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddScheduleModalOpen(true)}
            className="rbc-btn"
          >
            Add Work Schedule
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
              <SelectValue placeholder="Select Artist" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
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

  // Handle event drop for both appointments and schedules
  const handleEventDrop = async ({ event, start, end }: { event: EventWithAppointment, start: Date, end: Date }) => {
    // Handle schedule drag and drop
    if (event.resource?.type === 'schedule') {
      try {
        const scheduleId = event.id.toString().split('-')[1]
        const dayOfWeek = getDay(start) // Get the new day of week (0-6)

        const scheduleData = {
          barber_id: event.resource.barber_id,
          day_of_week: dayOfWeek,
          start_time: format(start, 'HH:mm'),
          end_time: format(end, 'HH:mm'),
        }

        console.log('Updating schedule:', {
          scheduleId,
          data: scheduleData
        })

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${event.resource.barber_id}/schedules/${scheduleId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(scheduleData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to update schedule')
        }

        await fetchBarberSchedules()
        toast.success('Schedule updated successfully')
        return
      } catch (err) {
        console.error('Error updating schedule:', err)
        toast.error(err instanceof Error ? err.message : 'Failed to update schedule')
        await fetchBarberSchedules() // Refresh to revert changes
        return
      }
    }

    // Handle appointment drag and drop (existing code)
    if (!event.appointment) {
      toast.error('Cannot reschedule this event')
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${event.id}?phone_number=${encodeURIComponent(event.appointment.phone_number)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shop_id: shopId,
            barber_id: event.appointment.barber_id,
            service_id: event.appointment.service_id || 0,
            appointment_time: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
            end_time: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
            number_of_people: event.appointment.number_of_people,
            user_id: 0,
            full_name: event.appointment.full_name,
            phone_number: event.appointment.phone_number,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to reschedule appointment')
      }

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(prevEvent => {
          if (prevEvent.id === event.id) {
            return {
              ...prevEvent,
              start,
              end,
              appointment: {
                ...prevEvent.appointment!,
                appointment_time: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
                end_time: format(end, "yyyy-MM-dd'T'HH:mm:ss")
              }
            }
          }
          return prevEvent
        })
      )

      toast.success('Appointment rescheduled successfully')
    } catch (err) {
      console.error('Error rescheduling appointment:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule appointment')
      await fetchEvents()
    }
  }

  // Handle event resize for both appointments and schedules
  const handleEventResize = async ({ event, start, end }: { event: EventWithAppointment, start: Date, end: Date }) => {
    // Handle schedule resize
    if (event.resource?.type === 'schedule') {
      try {
        const scheduleId = event.id.toString().split('-')[1]
        const scheduleData = {
          barber_id: event.resource.barber_id,
          day_of_week: getDay(start),
          start_time: format(start, 'HH:mm'),
          end_time: format(end, 'HH:mm'),
        }

        console.log('Updating schedule duration:', {
          scheduleId,
          data: scheduleData
        })

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${event.resource.barber_id}/schedules/${scheduleId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(scheduleData),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to update schedule')
        }

        await fetchBarberSchedules()
        toast.success('Schedule updated successfully')
        return
      } catch (err) {
        console.error('Error updating schedule:', err)
        toast.error(err instanceof Error ? err.message : 'Failed to update schedule')
        await fetchBarberSchedules() // Refresh to revert changes
        return
      }
    }

    // Handle appointment resize (existing code)
    if (!event.appointment) {
      toast.error('Cannot resize this event')
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${event.id}?phone_number=${encodeURIComponent(event.appointment.phone_number)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shop_id: shopId,
            barber_id: event.appointment.barber_id,
            service_id: event.appointment.service_id || 0,
            appointment_time: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
            end_time: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
            number_of_people: event.appointment.number_of_people,
            user_id: 0,
            full_name: event.appointment.full_name,
            phone_number: event.appointment.phone_number,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update appointment duration')
      }

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(prevEvent => {
          if (prevEvent.id === event.id) {
            return {
              ...prevEvent,
              start,
              end,
              appointment: {
                ...prevEvent.appointment!,
                appointment_time: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
                end_time: format(end, "yyyy-MM-dd'T'HH:mm:ss")
              }
            }
          }
          return prevEvent
        })
      )

      toast.success('Appointment duration updated successfully')
    } catch (err) {
      console.error('Error updating appointment duration:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update appointment duration')
      await fetchEvents()
    }
  }

  // Add schedule event component
  const ScheduleEventComponent = ({ event }: { event: EventWithAppointment }) => {
    if (!event.resource?.type || event.resource.type !== 'schedule') return null

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!event.resource?.barber_id) return

      const scheduleId = event.id.toString().split('-')[1]
      const scheduleDate = event.start
      setScheduleFormData({
        barber_id: event.resource.barber_id.toString(),
        start_date: format(scheduleDate, "yyyy-MM-dd'T'HH:mm"),
        end_date: format(event.end, "yyyy-MM-dd'T'HH:mm"),
        repeat_frequency: 'none'
      })
      setSelectedSchedule(event)
      setIsAddScheduleModalOpen(true)
    }

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedSchedule(event)
      setIsDeleteConfirmOpen(true)
    }

    return (
      <div className="p-1 h-full overflow-hidden bg-gray-200 border border-gray-300 rounded group relative">
        <div className="font-medium text-gray-700 truncate">
          {typeof event.title === 'string' ? event.title.replace('Barber', 'Artist') : event.title}
        </div>
        {event.start && event.end && (
          <div className="text-xs text-gray-600 truncate">
            {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
          </div>
        )}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow p-1">
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit Schedule"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete Schedule"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Add delete schedule handler
  const handleDeleteSchedule = async () => {
    if (!selectedSchedule?.id || !selectedSchedule.resource?.barber_id) return

    try {
      const scheduleId = selectedSchedule.id.toString().split('-')[1]
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${selectedSchedule.resource.barber_id}/schedules/${scheduleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete schedule')
      }

      await fetchBarberSchedules()
      setIsDeleteConfirmOpen(false)
      setSelectedSchedule(null)
      toast.success('Schedule deleted successfully')
    } catch (err) {
      console.error('Error deleting schedule:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete schedule')
    }
  }

  // Update schedule submit handler to handle both create and update
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!scheduleFormData.barber_id) {
      toast.error('Please select a barber')
      return
    }

    const startDateTime = new Date(scheduleFormData.start_date)
    const endDateTime = new Date(scheduleFormData.end_date)

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time')
      return
    }

    try {
      const scheduleData = {
        barber_id: parseInt(scheduleFormData.barber_id),
        start_date: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
        end_date: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
        repeat_frequency: scheduleFormData.repeat_frequency
      }

      const isEditing = selectedSchedule !== null
      const scheduleId = isEditing ? selectedSchedule.id.toString().split('-')[1] : ''
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${scheduleFormData.barber_id}/schedules/${isEditing ? scheduleId : ''}`
      
      console.log(`${isEditing ? 'Updating' : 'Creating'} schedule:`, {
        url,
        data: scheduleData
      })

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error response:', errorData)
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            throw new Error(errorData.detail)
          } else if (Array.isArray(errorData.detail)) {
            throw new Error(errorData.detail.join(', '))
          } else {
            throw new Error(JSON.stringify(errorData.detail))
          }
        }
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} schedule`)
      }

      const result = await response.json()
      console.log('Schedule operation successful:', result)

      await fetchBarberSchedules()
      setIsAddScheduleModalOpen(false)
      setSelectedSchedule(null)
      
      setScheduleFormData({
        barber_id: '',
        start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        repeat_frequency: 'none'
      })
      
      toast.success(`Work hours ${isEditing ? 'updated' : 'created'} successfully`)
    } catch (error) {
      console.error('Error handling schedule:', error)
      toast.error(error instanceof Error ? error.message : `Failed to ${selectedSchedule ? 'update' : 'create'} work hours`)
    }
  }

  // Update the schedule modal form
  const ScheduleModalContent = () => (
    <form onSubmit={handleScheduleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="barber_id" className="text-right">
            Artist
          </Label>
          <Select
            value={scheduleFormData.barber_id}
            onValueChange={(value) => setScheduleFormData(prev => ({ ...prev, barber_id: value }))}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select Artist" />
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
          <Label htmlFor="start_date" className="text-right">
            Start Date/Time
          </Label>
          <Input
            id="start_date"
            type="datetime-local"
            value={scheduleFormData.start_date}
            onChange={(e) => setScheduleFormData(prev => ({ ...prev, start_date: e.target.value }))}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="end_date" className="text-right">
            End Date/Time
          </Label>
          <Input
            id="end_date"
            type="datetime-local"
            value={scheduleFormData.end_date}
            onChange={(e) => setScheduleFormData(prev => ({ ...prev, end_date: e.target.value }))}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="repeat_frequency" className="text-right">
            Repeat
          </Label>
          <Select
            value={scheduleFormData.repeat_frequency}
            onValueChange={(value) => setScheduleFormData(prev => ({ ...prev, repeat_frequency: value }))}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select Repeat Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        {selectedSchedule && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setIsAddScheduleModalOpen(false)
              setIsDeleteConfirmOpen(true)
            }}
          >
            Delete
          </Button>
        )}
        <Button type="submit">
          {selectedSchedule ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )

  // Update the Add Schedule Modal to use the new content
  const AddScheduleModal = () => (
    <Dialog open={isAddScheduleModalOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedSchedule(null)
        setScheduleFormData({
          barber_id: '',
          start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          end_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          repeat_frequency: 'none'
        })
      }
      setIsAddScheduleModalOpen(open)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{selectedSchedule ? 'Edit Work Hours' : 'Add Work Hours'}</DialogTitle>
        </DialogHeader>
        <ScheduleModalContent />
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="h-[700px]">
      <div className="flex items-center gap-4 mb-2">
        <span>View:</span>
        <button
          className={`px-3 py-1 rounded ${calendarViewMode === 'appointments' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => {
            setCalendarViewMode('appointments')
            console.log('Switched to appointments view')
          }}
        >
          Appointments
        </button>
        <button
          className={`px-3 py-1 rounded ${calendarViewMode === 'work_schedules' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => {
            setCalendarViewMode('work_schedules')
            console.log('Switched to work schedules view')
          }}
        >
          Work Schedules
        </button>
      </div>
      <DnDCalendar
        localizer={localizer}
        events={filteredEvents()}
        startAccessor={(event: EventWithAppointment) => event.start}
        endAccessor={(event: EventWithAppointment) => event.end}
        view={view}
        onView={(newView: View) => {
          console.log('Calendar view changed to:', newView)
          setView(newView)
        }}
        date={date}
        onNavigate={date => {
          console.log('Calendar date changed to:', date)
          setDate(date)
        }}
        views={{
          month: true,
          week: true,
          day: true
        }}
        selectable
        resizable
        onEventDrop={({ event, start, end }: any) => handleEventDrop({ 
          event: event as EventWithAppointment, 
          start: start as Date, 
          end: end as Date 
        })}
        onEventResize={({ event, start, end }: any) => handleEventResize({ 
          event: event as EventWithAppointment,
          start: start as Date, 
          end: end as Date 
        })}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event: any) => {
          const typedEvent = event as EventWithAppointment
          if (!typedEvent.resource?.type) {
            handleSelectEvent(typedEvent)
          }
        }}
        components={{
          event: (props: any) => {
            const typedEvent = props.event as EventWithAppointment
            console.log('Rendering event:', typedEvent)
            if (typedEvent.resource?.type === 'schedule') {
              return <ScheduleEventComponent event={typedEvent} />
            }
            return <EventComponent event={typedEvent} />
          },
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
                  Artist
                </Label>
                <Select
                  value={formData.barber_id}
                  onValueChange={handleBarberChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Artist" />
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

      <AddScheduleModal />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Work Hours</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete these work hours? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSchedule}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
