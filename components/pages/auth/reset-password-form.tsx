"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Get token from URL query parameters
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      validateToken(tokenFromUrl);
    } else {
      setIsValidating(false);
      setTokenValid(false);
      setError("No reset token provided in URL");
    }
  }, [searchParams]);

  async function validateToken(resetToken: string) {
    setIsValidating(true);
    try {
      const response = await fetch("/api/auth/validate-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken }),
      });

      const data = await response.json();
      
      if (response.ok && data.valid) {
        setTokenValid(true);
        setUserEmail(data.user_email);
      } else {
        setTokenValid(false);
        setError(data.message || "Invalid or expired reset token");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setTokenValid(false);
      setError("Failed to validate reset token");
    } finally {
      setIsValidating(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      setError("No reset token available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token,
          new_password: values.password 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success("Password reset successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-6"
      >
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Validating reset token...
        </p>
      </motion.div>
    );
  }

  if (!tokenValid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-6"
      >
        <div className="flex items-center justify-center p-8">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-destructive">Invalid Reset Link</h2>
          <p className="text-sm text-muted-foreground">
            {error || "This password reset link is invalid or has expired."}
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <Button asChild>
            <Link href="/forgot-password">
              Request New Reset Link
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">
              <ArrowLeft size={16} className="mr-1" />
              Back to Login
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-6"
      >
        <div className="flex items-center justify-center p-8">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-green-600">Password Reset Successful!</h2>
          <p className="text-sm text-muted-foreground">
            Your password has been updated successfully. You will be redirected to the login page shortly.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">
            Continue to Login
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {userEmail && (
        <div className="rounded-md bg-primary/10 p-3 text-sm text-primary border border-primary/20">
          <p>Resetting password for: <strong>{userEmail}</strong></p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">New Password</FormLabel>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="Enter new password" 
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10" 
                      {...field} 
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Confirm New Password</FormLabel>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="Confirm new password" 
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 pr-10" 
                      {...field} 
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </Form>

      <div className="flex justify-center pt-2">
        <Link 
          href="/login" 
          className="flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to login
        </Link>
      </div>
    </motion.div>
  );
} 