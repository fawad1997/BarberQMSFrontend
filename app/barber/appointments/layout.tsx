import "@/styles/calendar.css";

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex-1">
      {children}
    </div>
  );
}
