import LoginForm from "@/components/pages/auth/login-form";
import { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Login | WalkInOnline",
  description: "Login to your WalkInOnline account",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Check for error in search params
  const errorMessage = searchParams.error
    ? searchParams.error === "SessionExpired"
      ? "Your session has expired. Please login again."
      : "Authentication error. Please login again."
    : null;

  return (
    <section className="container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">
            Login to manage your barbershop queue
          </p>
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
      </div>
    </section>
  );
} 