import Hero from "@/app/components/pages/hero"
import FeatureCards from "@/app/components/pages/feature-cards"
import Features from "@/app/components/pages/features"
import HowItWorks from "@/app/components/pages/how-it-works"
import Stats from "@/app/components/pages/stats"
import CallToAction from "@/app/components/pages/cta"

export default function Home() {
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
