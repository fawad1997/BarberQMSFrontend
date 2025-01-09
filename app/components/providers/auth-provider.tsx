"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/app/components/providers/theme-provider"
import QueryProvider from "@/app/components/providers/query-provider"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  )
} 