import { Salon } from "@/types/salon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, MapPin } from "lucide-react";

interface SalonListProps {
  salons: Salon[];
  isLoading: boolean;
}

export default function SalonList({ salons, isLoading }: SalonListProps) {
  if (isLoading) {
    return <div className="text-center">Loading salons...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {salons.map((salon) => (
        <Card key={salon.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{salon.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {salon.address}, {salon.city}, {salon.state}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${salon.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                {salon.isOpen ? 'Open' : 'Closed'}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {salon.openingTime} - {salon.closingTime}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Wait time: {salon.waitTime} min
            </p>
            <Button className="w-full mt-2" variant={salon.isOpen ? "default" : "secondary"}>
              Check In
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 