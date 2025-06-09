import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token || !token.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Call the backend API to validate token and get user info
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/auth/validate-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Backend error:', await response.text())
      return NextResponse.json(
        { error: 'Failed to check walkthrough status' }, 
        { status: response.status }
      )
    }

    const userData = await response.json()
    return NextResponse.json({
      is_first_login: userData.is_first_login,
      user_id: userData.user_id,
      role: userData.role
    })

  } catch (error) {
    console.error('Check walkthrough status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
