"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'

interface User {
  id: number
  email: string
  name: string
  accessToken: string
  shop_id: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }

        setUser(session.user as User)
        setAccessToken(session.user.accessToken)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  return { user, accessToken, isLoading }
} 