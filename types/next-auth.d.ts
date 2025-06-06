import "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role?: string
      accessToken?: string
      isFirstLogin?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name: string
    email: string
    role: string
    accessToken: string
    isFirstLogin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    accessToken: string
    isFirstLogin: boolean
  }
} 