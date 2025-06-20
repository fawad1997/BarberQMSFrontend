import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
    const timePeriod = searchParams.get('time_period') || 'day';
    
    // Call the backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}/employees/appointments/upcoming/?time_period=${timePeriod}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      console.error('Backend error:', await response.text());
      return NextResponse.json(
        { error: 'Failed to fetch upcoming appointments' }, 
        { status: response.status }
      );
    }    // Return the upcoming appointments data
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Upcoming appointments error:', error);
    // Return zero appointments instead of error to maintain UI consistency
    return NextResponse.json({
      count: 0,
      appointments: []
    });
  }
}
