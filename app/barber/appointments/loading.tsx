import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAppointments() {
  return (
    <div className="container mx-auto py-6">
      <Skeleton className="h-8 w-48 mb-6" />
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
          <Skeleton className="h-10 w-full sm:w-[240px]" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[200px]" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
