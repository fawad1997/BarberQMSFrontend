import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "../../types/auth";

export default async function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the user session
  const session = await getServerSession(authOptions);
  
  // If not logged in, redirect to login page
  if (!session) {
    redirect("/login");
  }

  // If not a barber, redirect to appropriate page
  if (session.user?.role !== UserRole.BARBER) {
    if (session.user?.role === UserRole.SHOP_OWNER) {
      redirect("/shop/dashboard");
    } else {
      redirect("/login");
    }
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
