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
 * Convert time from shop timezone to user timezone (RELIABLE METHOD)
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
    
    // Get the timezone offset difference
    const shopOffsetHours = getTimezoneOffsetInHours(shopTimezone);
    const userOffsetHours = getTimezoneOffsetInHours(userTimezone);
    const offsetDiffHours = userOffsetHours - shopOffsetHours;
    
    // Apply the offset
    let convertedHours = hours + offsetDiffHours;
    
    // Handle day overflow/underflow
    while (convertedHours < 0) convertedHours += 24;
    while (convertedHours >= 24) convertedHours -= 24;
    
    return `${convertedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Failed to convert time to user timezone, returning original:', error);
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
    
    // Parse business hours - handle both 12-hour and 24-hour formats
    // Examples: "09:00 AM - 05:00 PM" or "9:00 - 17:00"
    const timeRangeRegex = /(\d{1,2}:\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i;
    const match = businessHours.match(timeRangeRegex);
    
    if (!match) {
      console.warn('Could not parse business hours:', businessHours);
      return true; // If can't parse, allow booking
    }
    
    const [, startTime, startPeriod, endTime, endPeriod] = match;
    
    // Convert 12-hour format to 24-hour if needed
    const convert12to24 = (time: string, period?: string): string => {
      if (!period) return time; // Already 24-hour format
      
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      
      if (period.toLowerCase() === 'pm' && hours !== 12) {
        hour24 += 12;
      } else if (period.toLowerCase() === 'am' && hours === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    const startTime24 = convert12to24(startTime, startPeriod);
    const endTime24 = convert12to24(endTime, endPeriod);
    
    // Parse times into minutes
    const [appointmentHours, appointmentMinutes] = shopTime.split(':').map(Number);
    const [startHours, startMinutes] = startTime24.split(':').map(Number);
    const [endHours, endMinutes] = endTime24.split(':').map(Number);
    
    const appointmentMinutesTotal = appointmentHours * 60 + appointmentMinutes;
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    // Handle overnight hours (e.g., 22:00 - 06:00)
    if (endMinutesTotal < startMinutesTotal) {
      // Business hours cross midnight
      return appointmentMinutesTotal >= startMinutesTotal || appointmentMinutesTotal <= endMinutesTotal;
    } else {
      // Normal business hours within the same day
      return appointmentMinutesTotal >= startMinutesTotal && appointmentMinutesTotal <= endMinutesTotal;
    }
  } catch (error) {
    console.warn('Failed to check business hours, allowing booking:', error);
    return true;
  }
};

/**
 * Convert time from user timezone to shop timezone (RELIABLE METHOD)
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
    
    // Create a date for today at the specified time
    const today = new Date();
    const inputDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    // Create a date string that represents this time in the user's timezone
    const userDateTimeString = inputDate.toISOString().slice(0, 10) + 'T' + 
                              hours.toString().padStart(2, '0') + ':' + 
                              minutes.toString().padStart(2, '0') + ':00';
    
    // Parse this as a proper datetime
    const baseDateTime = new Date(userDateTimeString);
    
    // Get the timezone offset difference
    const userOffsetHours = getTimezoneOffsetInHours(userTimezone);
    const shopOffsetHours = getTimezoneOffsetInHours(shopTimezone);
    const offsetDiffHours = shopOffsetHours - userOffsetHours;
    
    // Apply the offset
    const convertedDateTime = new Date(baseDateTime.getTime() + (offsetDiffHours * 60 * 60 * 1000));
    
    // Extract the time portion
    const convertedHours = convertedDateTime.getHours();
    const convertedMinutes = convertedDateTime.getMinutes();
    
    return `${convertedHours.toString().padStart(2, '0')}:${convertedMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Failed to convert time to shop timezone, using simple offset calculation:', error);
    
    // Fallback: Use simple offset calculation
    const [hours, minutes] = time.split(':').map(Number);
    const userOffsetHours = getTimezoneOffsetInHours(userTimezone);
    const shopOffsetHours = getTimezoneOffsetInHours(shopTimezone);
    const hoursDiff = shopOffsetHours - userOffsetHours;
    
    let convertedHours = hours + hoursDiff;
    
    // Handle day overflow/underflow
    while (convertedHours < 0) convertedHours += 24;
    while (convertedHours >= 24) convertedHours -= 24;
    
    return `${convertedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};

/**
 * Get timezone offset in hours from UTC (BULLETPROOF METHOD)
 * Uses multiple fallback strategies for maximum reliability
 */
export const getTimezoneOffsetInHours = (timezone: string): number => {
  if (!timezone) {
    console.warn('No timezone provided to getTimezoneOffsetInHours');
    return 0;
  }

  try {
    // Method 1: Use Intl.DateTimeFormat to get the offset
    const now = new Date();
    
    // Create formatter for the target timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (offsetPart && offsetPart.value) {
      // Parse something like "GMT-8" or "GMT+5"
      const match = offsetPart.value.match(/GMT([+-])(\d{1,2}):?(\d{0,2})?/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3] || '0', 10);
        return sign * (hours + minutes / 60);
      }
    }
    
    // Method 2: Fallback - compare date strings
    const utcTime = now.toLocaleString('sv-SE', { timeZone: 'UTC' });
    const localTime = now.toLocaleString('sv-SE', { timeZone: timezone });
    
    const utcDate = new Date(utcTime + 'Z');
    const localDate = new Date(localTime + 'Z');
    
    const diffMs = localDate.getTime() - utcDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours);
  } catch (error) {
    console.warn('Failed to calculate timezone offset, using hardcoded values:', error);
    
    // Method 3: Hardcoded fallback (most reliable for known timezones)
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const isDST = month >= 2 && month <= 10; // Rough DST period
    
    const offsets: { [key: string]: { standard: number; dst: number } } = {
      'America/New_York': { standard: -5, dst: -4 },        // EST/EDT
      'America/Chicago': { standard: -6, dst: -5 },         // CST/CDT
      'America/Denver': { standard: -7, dst: -6 },          // MST/MDT
      'America/Phoenix': { standard: -7, dst: -7 },         // MST (no DST)
      'America/Los_Angeles': { standard: -8, dst: -7 },     // PST/PDT
      'America/Anchorage': { standard: -9, dst: -8 },       // AKST/AKDT
      'Pacific/Honolulu': { standard: -10, dst: -10 },      // HST (no DST)
    };
    
    const tzOffset = offsets[timezone];
    if (tzOffset) {
      return isDST ? tzOffset.dst : tzOffset.standard;
    }
    
    return 0;
  }
};

/**
 * Get timezone offset in minutes from UTC (compatibility function)
 * @deprecated Use getTimezoneOffsetInHours instead
 */
export const getTimezoneOffset = (timezone: string): number => {
  return getTimezoneOffsetInHours(timezone) * 60;
};

/**
 * Get timezone offset difference in hours
 */
export const getTimezoneOffsetDifference = (
  timezone1: string,
  timezone2: string
): number => {
  try {
    const offset1 = getTimezoneOffsetInHours(timezone1);
    const offset2 = getTimezoneOffsetInHours(timezone2);
    return offset1 - offset2;
  } catch (error) {
    console.warn('Failed to calculate timezone offset difference:', error);
    return 0;
  }
};