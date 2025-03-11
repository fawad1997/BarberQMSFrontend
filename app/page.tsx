import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Hero from "@/components/pages/hero"
import FeatureCards from "@/components/pages/feature-cards"
import Features from "@/components/pages/features"
import HowItWorks from "@/components/pages/how-it-works"
import Stats from "@/components/pages/stats"
import CallToAction from "@/components/pages/cta"

export default async function Home() {
  // Get the user session
  const session = await getServerSession(authOptions)
  
  // If user is logged in as shop owner, redirect to dashboard
  if (session?.user?.role === "SHOP_OWNER") {
    redirect("/shop/dashboard")
  }

  return (
    <main>
      <Hero />
      <FeatureCards />
      <HowItWorks />
      <Stats />
      <Features />
      <CallToAction />
    </main>
  )
}
