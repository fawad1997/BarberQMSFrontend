import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const metadata: Metadata = {
  title: "Barbers",
  description: "Manage your shop's barbers",
}

export default async function BarbersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Barbers</h1>
      {/* Add your barbers management UI here */}
      <div className="text-muted-foreground">
        Barbers management interface coming soon...
      </div>
    </div>
  )
} 