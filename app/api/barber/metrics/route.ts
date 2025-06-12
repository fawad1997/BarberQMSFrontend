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
    const timePeriod = searchParams.get('time_period') || 'week';
    
    // Call the backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/barbers/metrics?time_period=${timePeriod}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      console.error('Backend error:', await response.text());
      return NextResponse.json(
        { error: 'Failed to fetch barber metrics' }, 
        { status: response.status }
      );
    }

    // Return the metrics data
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Barber metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
