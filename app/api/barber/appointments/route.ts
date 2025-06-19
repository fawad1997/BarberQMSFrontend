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
    
    // Prepare query params
    const queryParams = new URLSearchParams();
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    
    if (date) queryParams.append('date', date);
    if (status) queryParams.append('status', status);
    
    // Call the backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}/employees/appointments/?${queryParams.toString()}`;
    
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
        { error: 'Failed to fetch employee appointments' }, 
        { status: response.status }
      );
    }

    // Return the appointments data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Barber appointments error:', error);
    // Return empty array instead of error to maintain UI consistency
    return NextResponse.json([]);
  }
}

// Handle updating appointment status
export async function PUT(request: NextRequest) {
  try {
    // Get token from session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the appointment ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const appointmentId = pathParts[pathParts.length - 1];
    
    if (!appointmentId || isNaN(parseInt(appointmentId))) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    // Get the request body
    const body = await request.json();

    // Call the backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/employees/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json({ error: 'Failed to update appointment status' }, { status: response.status });
    }

    // Return the updated appointment data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
