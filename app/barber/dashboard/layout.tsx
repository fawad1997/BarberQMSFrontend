import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Barber Dashboard | WalkInOnline",
  description: "Manage your barbering services and schedule",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}