"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { getApiEndpoint } from "../../../lib/utils/api-config";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Separator } from "../../../components/ui/separator";
import SSOButton from "./sso-button";

const formSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      console.log("API URL:", getApiEndpoint("auth/login")); // Debug info
      
      const response = await fetch(getApiEndpoint("auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      // Check response type before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // If not JSON, get the text to see what was returned
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse.substring(0, 500));
        throw new Error("The server returned an invalid response format. Please try again later.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid username or password");
      }      // Determine redirect URL based on the user's role from API response
      const userRole = data.role?.value || "";
      const callbackUrl = userRole === "BARBER" ? "/barber/dashboard" : "/shop/dashboard";

      // Call signIn with credentials
      const result = await signIn("credentials", {
        username: values.username,
        password: values.password,
        accessToken: data.access_token,
        callbackUrl: callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid credentials");
      }      if (result?.ok) {
        toast.success("Login successful!");
        // Redirect to the appropriate dashboard based on role
        const redirectUrl = userRole === "BARBER" ? "/barber/dashboard" : "/shop/dashboard";
        router.push(redirectUrl);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md space-y-6"
    >
      <div className="grid grid-cols-1 gap-3">
        <SSOButton 
          provider="google" 
          className="border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900" 
        />
        <SSOButton 
          provider="facebook" 
          className="bg-[#1877F2]/10 border-[#1877F2]/30 hover:bg-[#1877F2]/20 dark:border-[#1877F2]/20 text-[#1877F2] dark:text-[#1877F2]" 
        />
        <SSOButton 
          provider="microsoft" 
          className="border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900" 
        />
      </div>
      
      <div className="relative flex items-center justify-center">
        <Separator className="flex-1" />
        <span className="mx-4 text-xs font-medium text-muted-foreground">OR CONTINUE WITH EMAIL</span>
        <Separator className="flex-1" />
      </div>      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium">Email or Phone Number</FormLabel>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Mail size={18} />
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="john@example.com" 
                      type="text" 
                      className="pl-10" 
                      {...field} 
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="font-medium">Password</FormLabel>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="********" 
                      type={showPassword ? "text" : "password"} 
                      className="pl-10 pr-10" 
                      {...field} 
                    />
                  </FormControl>
                  <div 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-6"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>
      {/* Will hide register for now */}
      {/* <p className="text-center text-sm text-muted-foreground pt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Register
        </Link>
      </p> */}
    </motion.div>
  );
}