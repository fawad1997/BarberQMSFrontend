import HeadingText from "@/components/heading-text"

const stats = [
  {
    number: "500+",
    label: "Barbershops"
  },
  {
    number: "50k+",
    label: "Happy Customers"
  },
  {
    number: "1M+",
    label: "Queue Entries"
  }
]

export default function Stats() {
  return (
    <section className="bg-slate-50 dark:bg-slate-900">
      <div className="container py-12 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-2">
              <p className="text-4xl lg:text-5xl font-bold text-primary">
                {stat.number}
              </p>
              <p className="text-lg text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 