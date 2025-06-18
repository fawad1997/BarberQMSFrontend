import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Function to generate mock metrics data while backend is updated
function generateMockMetricsData(timePeriod: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  
  // Determine date range based on time period
  if (timePeriod === 'day') {
    startDate = new Date(now);
    endDate = new Date(now);
  } else if (timePeriod === 'week') {
    // Start from Monday of current week
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startDate = new Date(now.setDate(diff));
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  } else if (timePeriod === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    // Default to week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.setDate(diff));
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  }
  
  // Generate daily data for the range with all zeros
  const dailyData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dailyData.push({
      date: currentDate.toISOString().split('T')[0],
      customers_served: 0,
      avg_service_duration: 0,
      appointments_count: 0
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Set all metrics to zero
  const upcomingAppointments = 0;
  const totalCustomersServed = 0;
  const avgServiceDurationMinutes = 0;
  
  return {
    time_period: timePeriod,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    customers_served: totalCustomersServed,
    upcoming_appointments: upcomingAppointments,
    avg_service_duration_minutes: Math.round(avgServiceDurationMinutes * 10) / 10,
    daily_data: dailyData
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get token from session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = searchParams.get('time_period') || 'week';
    
    // Try to call the backend API first
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/barbers/metrics?time_period=${timePeriod}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'Content-Type': 'application/json'
        },
        // Short timeout to fail fast if backend doesn't support the updated metrics format
        signal: AbortSignal.timeout(1500)
      });
  
      if (response.ok) {
        // If backend returns valid data, use it
        const data = await response.json();
        
        // Check if backend data has the new fields, otherwise enhance it
        if (!data.upcoming_appointments || !data.daily_data?.[0]?.avg_service_duration) {
          // Backend is returning old format data, enhance it with mock data
          const mockData = generateMockMetricsData(timePeriod);
          data.upcoming_appointments = mockData.upcoming_appointments;
          
          // Add avg_service_duration to daily data if missing
          if (data.daily_data) {
            data.daily_data = data.daily_data.map((day: any, index: number) => ({
              ...day,
              avg_service_duration: mockData.daily_data[index % mockData.daily_data.length].avg_service_duration
            }));
          }
        }
        
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('Backend API not updated yet, using mock data');
    }
    
    // If backend fails or doesn't support new format, return mock data
    const mockData = generateMockMetricsData(timePeriod);
    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Barber metrics error:', error);
    
    // Even if there's an error, return mock data to keep the UI working
    const timePeriod = request.nextUrl.searchParams.get('time_period') || 'week';
    return NextResponse.json(generateMockMetricsData(timePeriod));
  }
}
