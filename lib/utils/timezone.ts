import { US_TIMEZONES } from '@/types/shop';

/**
 * Get the user's current timezone
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect user timezone, falling back to UTC');
    return 'UTC';
  }
};

/**
 * Get a user-friendly timezone display name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  if (!timezone) {
    console.warn('No timezone provided to getTimezoneDisplayName');
    return 'Unknown Timezone';
  }
  
  // Process the timezone to get a display name
  
  // First check if the timezone is directly in our mapping
  if (timezone in US_TIMEZONES) {
    return US_TIMEZONES[timezone as keyof typeof US_TIMEZONES];
  }
  
  // If not found, try to format it nicely
  try {
    // For timezones like "America/Los_Angeles", extract the city part and check if any part matches a US timezone
    if (timezone.includes('/')) {
      // Check if this is a US timezone with a different format
      for (const [tzKey, tzValue] of Object.entries(US_TIMEZONES)) {
        if (timezone.includes(tzKey.split('/')[1])) {
          // Found a matching US timezone
          return tzValue;
        }
      }
      
      // If no match found, extract the city part
      const parts = timezone.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      return city;
    }
    
    // Return the original if we can't format it
    return timezone;
  } catch (error) {
    console.warn('Failed to format timezone name:', error);
    return timezone;
  }
};

/**
 * Convert time from shop timezone to user timezone
 */
export const convertTimeToUserTimezone = (
  time: string, // Format: "HH:MM"
  shopTimezone: string,
  userTimezone: string = getUserTimezone()
): string => {
  try {
    if (shopTimezone === userTimezone) {
      return time; // No conversion needed
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a date object for today with the given time in UTC
    const today = new Date();
    const baseDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes));
    
    // First, adjust the date as if the time was specified in the shop's timezone
    // This gives us the correct UTC time that corresponds to the shop's local time
    const shopOffsetMinutes = getTimezoneOffset(shopTimezone);
    baseDate.setMinutes(baseDate.getMinutes() - shopOffsetMinutes);
    
    // Now format this UTC time in the user's timezone
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(baseDate);
    
    return userTime;
  } catch (error) {
    console.warn('Failed to convert time, returning original:', error);
    return time;
  }
};

/**
 * Convert formatted hours from shop timezone to user timezone
 */
export const convertFormattedHoursToUserTimezone = (
  formattedHours: string,
  shopTimezone: string,
  userTimezone: string = getUserTimezone()
): string => {
  try {
    if (shopTimezone === userTimezone) {
      return formattedHours; // No conversion needed
    }
    
    // Parse common formats like "9:00 AM - 6:00 PM" or "09:00 - 18:00"
    const timeRangeRegex = /(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i;
    const match = formattedHours.match(timeRangeRegex);
    
    if (!match) {
      return formattedHours; // Return original if can't parse
    }
    
    const [, startTime, endTime] = match;
    
    // Convert 12-hour to 24-hour format if needed
    const convertTo24Hour = (time: string): string => {
      const ampmRegex = /(\d{1,2}:\d{2})\s*([AP]M)/i;
      const ampmMatch = time.match(ampmRegex);
      
      if (!ampmMatch) {
        return time; // Already 24-hour format
      }
      
      const [, timeStr, period] = ampmMatch;
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      let convertedHours = hours;
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        convertedHours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        convertedHours = 0;
      }
      
      return `${convertedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    const start24 = convertTo24Hour(startTime);
    const end24 = convertTo24Hour(endTime);
    
    const convertedStart = convertTimeToUserTimezone(start24, shopTimezone, userTimezone);
    const convertedEnd = convertTimeToUserTimezone(end24, shopTimezone, userTimezone);
    
    // Convert back to 12-hour format for display
    const convertTo12Hour = (time: string): string => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    
    return `${convertTo12Hour(convertedStart)} - ${convertTo12Hour(convertedEnd)}`;
  } catch (error) {
    console.warn('Failed to convert formatted hours, returning original:', error);
    return formattedHours;
  }
};

/**
 * Check if a time is within business hours (considering timezone conversion)
 */
export const isTimeWithinBusinessHours = (
  appointmentTime: string, // Format: "HH:MM"
  businessHours: string,
  shopTimezone: string,
  userTimezone: string = getUserTimezone()
): boolean => {
  try {
    // Convert appointment time from user timezone to shop timezone
    const shopTime = shopTimezone === userTimezone ? 
      appointmentTime : // No conversion needed if timezones are the same
      convertTimeFromUserToShopTimezone(appointmentTime, userTimezone, shopTimezone);
    
    // Parse business hours
    const timeRangeRegex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
    const match = businessHours.match(timeRangeRegex);
    
    if (!match) {
      return true; // If can't parse, allow booking
    }
    
    const [, startTime, endTime] = match;
    const [appointmentHours, appointmentMinutes] = shopTime.split(':').map(Number);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const appointmentMinutesTotal = appointmentHours * 60 + appointmentMinutes;
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    return appointmentMinutesTotal >= startMinutesTotal && appointmentMinutesTotal <= endMinutesTotal;
  } catch (error) {
    console.warn('Failed to check business hours, allowing booking:', error);
    return true;
  }
};

/**
 * Convert time from user timezone to shop timezone
 */
export const convertTimeFromUserToShopTimezone = (
  time: string, // Format: "HH:MM"
  userTimezone: string = getUserTimezone(),
  shopTimezone: string
): string => {
  try {
    if (shopTimezone === userTimezone) {
      return time; // No conversion needed
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a date object for today with the given time in UTC
    const today = new Date();
    const baseDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes));
    
    // First, adjust the date as if the time was specified in the user's timezone
    // This gives us the correct UTC time that corresponds to the user's local time
    const userOffsetMinutes = getTimezoneOffset(userTimezone);
    baseDate.setMinutes(baseDate.getMinutes() - userOffsetMinutes);
    
    // Now format this UTC time in the shop's timezone
    const shopTime = new Intl.DateTimeFormat('en-US', {
      timeZone: shopTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(baseDate);
    
    return shopTime;
  } catch (error) {
    console.warn('Failed to convert time to shop timezone, returning original:', error);
    return time;
  }
};

/**
 * Get timezone offset in minutes from UTC
 * Positive values indicate timezones ahead of UTC (east)
 * Negative values indicate timezones behind UTC (west)
 */
export const getTimezoneOffset = (timezone: string): number => {
  if (!timezone) {
    console.warn('No timezone provided to getTimezoneOffset');
    return 0;
  }

  try {
    // Use a simpler and more reliable approach to get timezone offset
    const now = new Date();
    
    // Get the local time string in the target timezone
    const tzString = now.toLocaleString('en-US', { timeZone: timezone });
    
    // Create a date object from that string in local time
    const tzDate = new Date(tzString);
    
    // Get the ISO string which is always in UTC
    const tzDateISO = new Date(tzDate.getTime() - tzDate.getTimezoneOffset() * 60000).toISOString();
    
    // Create a date object from the ISO string (which will be in local time)
    const utcDate = new Date(tzDateISO);
    
    // Calculate the difference between UTC and the target timezone
    // Positive means ahead of UTC, negative means behind UTC
    return (utcDate.getTime() - now.getTime()) / 60000;
  } catch (error) {
    console.error('Failed to get timezone offset for', timezone, error);
    
    // Fallback method using predefined offsets for common US timezones
    if (timezone === 'America/New_York') return -300; // EST, -5 hours
    if (timezone === 'America/Chicago') return -360; // CST, -6 hours
    if (timezone === 'America/Denver') return -420; // MST, -7 hours
    if (timezone === 'America/Phoenix') return -420; // MST, -7 hours
    if (timezone === 'America/Los_Angeles') return -480; // PST, -8 hours
    if (timezone === 'America/Anchorage') return -540; // AKST, -9 hours
    if (timezone === 'Pacific/Honolulu') return -600; // HST, -10 hours
    
    return 0; // Default fallback
  }
};

/**
 * Get timezone offset difference in hours
 */
export const getTimezoneOffsetDifference = (
  timezone1: string,
  timezone2: string
): number => {
  try {
    const offset1 = getTimezoneOffset(timezone1);
    const offset2 = getTimezoneOffset(timezone2);
    return (offset1 - offset2) / 60;
  } catch (error) {
    console.warn('Failed to calculate timezone offset difference:', error);
    return 0;
  }
};