"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function LoginFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") || "An authentication error occurred";

  const handleRetry = () => {
    router.push("/login");
  };

  // Add automatic redirection after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 10000); // 10 seconds delay

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold">Login Failed</h1>
          <p className="text-muted-foreground">
            There was a problem with your authentication attempt
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            {decodeURIComponent(error)}
          </AlertDescription>
        </Alert>
        
        <p className="text-sm text-muted-foreground text-center">
          You will be redirected to the login page automatically in 10 seconds...
        </p>
        
        <Button onClick={handleRetry} className="w-full">
          Return to Login
        </Button>
      </div>
    </div>
  );
} 