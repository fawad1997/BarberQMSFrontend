import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barber Dashboard | WalkInOnline",
  description: "Manage your barbering services and schedule",
};

export default function BarberDashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Barber Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Today's Appointments Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-medium">Today's Appointments</h3>
          <div className="space-y-4">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
          </div>
        </div>
        
        {/* Queue Status Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-medium">Queue Status</h3>
          <div className="space-y-4">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No customers waiting in the queue</p>
          </div>
        </div>
        
        {/* My Services Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-medium">My Services</h3>
          <div className="space-y-4">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No services assigned to you yet</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold">My Schedule</h2>
        <p className="text-muted-foreground">Your upcoming schedule will appear here.</p>
        <div className="mt-4 rounded-lg border bg-muted/50 p-8 text-center">
          <p>No scheduled hours yet</p>
        </div>
      </div>
    </div>
  );
}
