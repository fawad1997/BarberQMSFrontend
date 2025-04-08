"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const token = searchParams?.get("token");
    
    const handleToken = async () => {
      if (!token) {
        setError("Invalid or missing token");
        setIsProcessing(false);
        return;
      }

      try {
        // Sign in with the token from SSO
        const result = await signIn("sso", {
          accessToken: token,
          redirect: false,
          callbackUrl: "/shop/dashboard"
        });

        if (result?.error) {
          setError(result.error);
          setIsProcessing(false);
          return;
        }

        // Redirect to dashboard on success
        router.push("/shop/dashboard");
      } catch (err) {
        setError("An error occurred during authentication");
        setIsProcessing(false);
      }
    };

    // Only process if we're not already authenticated
    if (status === "unauthenticated") {
      handleToken();
    } else if (status === "authenticated") {
      router.push("/shop/dashboard");
    }
  }, [searchParams, router, status]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {isProcessing && status !== "authenticated" ? (
          <>
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 rounded-full"></div>
              <div className="h-6 w-48 bg-muted rounded"></div>
            </div>
            <p className="text-muted-foreground text-center">
              Processing your login...
            </p>
          </>
        ) : error ? (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                {error}. Please try <a href="/login" className="underline">logging in</a> again.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            <Alert variant="default" className="bg-primary/10 border-primary">
              <CheckCircle className="h-5 w-5 text-primary" />
              <AlertDescription>Login successful! Redirecting...</AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </div>
  );
} 