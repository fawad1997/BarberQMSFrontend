import LoginForm from "@/components/pages/auth/login-form";
import { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import LoginIllustration from "@/components/pages/auth/login-illustration";

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
    <section className="container min-h-[calc(100vh-200px)] py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-xl shadow-lg md:flex-row">
        {/* Left side - Login Form */}
        <div className="flex w-full flex-col items-center justify-center bg-background p-8 md:w-1/2 md:p-12">
          <div className="mb-8 flex w-full flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Login with your account credentials to access your dashboard
            </p>
          </div>
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-6 w-full max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
        </div>

        {/* Right side - Image and Benefits */}
        <div className="hidden w-1/2 bg-gradient-to-br from-primary/5 to-primary/20 p-12 md:flex md:flex-col md:justify-center">
          <LoginIllustration />
          
          <h2 className="mb-4 text-center text-2xl font-semibold">Streamline Your Barbershop</h2>
          <ul className="space-y-3">
            <li className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Manage your queue efficiently</span>
            </li>
            <li className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Access real-time customer data</span>
            </li>
            <li className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Improve customer satisfaction</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
} 