"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Shop } from "@/types/shop";
import { checkUsernameAvailability } from "@/lib/services/shopService";
import { updateSalonUrlAfterUsernameChange, updateShopUrlAfterUsernameChange } from "@/lib/utils/navigation";

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Define validation schema using Zod
const shopFormSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .refine((username) => {
      const reservedNames = [
        'admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'app', 'web',
        'mobile', 'help', 'support', 'contact', 'about', 'terms', 'privacy',
        'login', 'register', 'signup', 'signin', 'logout', 'dashboard',
        'profile', 'settings', 'account', 'user', 'users', 'shop', 'shops',
        'queue', 'queues', 'barber', 'barbers', 'booking', 'bookings',
        'appointment', 'appointments', 'service', 'services', 'payment',
        'payments', 'billing', 'invoice', 'invoices', 'report', 'reports',
        'analytics', 'stats', 'statistics', 'config', 'configuration',
        'setup', 'install', 'installation', 'upgrade', 'update', 'patch',
        'maintenance', 'status', 'health', 'ping', 'test', 'debug',
        'dev', 'development', 'prod', 'production', 'staging', 'demo'
      ];
      return !reservedNames.includes(username.toLowerCase());
    }, "This username is reserved and cannot be used"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "ZIP code is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  opening_time: z.string().min(1, "Opening time is required"),
  closing_time: z.string().min(1, "Closing time is required"),
  average_wait_time: z.string().min(1, "Average wait time is required"),
  has_advertisement: z.boolean().default(false),
});

interface EditShopProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  initialData: Shop;
  onEditComplete: (updatedShop: Shop) => void;
}

export function EditShop({ isOpen, onClose, shopId, initialData, onEditComplete }: EditShopProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState(initialData.username || "");

  // Convert Shop object to form-compatible object
  const formInitialData = {
    name: initialData.name,
    username: initialData.username || "",
    address: initialData.address,
    city: initialData.city,
    state: initialData.state,
    zip_code: initialData.zip_code,
    phone_number: initialData.phone_number,
    email: initialData.email,
    opening_time: initialData.opening_time,
    closing_time: initialData.closing_time,
    average_wait_time: initialData.average_wait_time.toString(),
    has_advertisement: initialData.has_advertisement
  };
  const form = useForm<z.infer<typeof shopFormSchema>>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: formInitialData,
  });

  // Debounced username availability check
  const debouncedUsernameCheck = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3 || username === originalUsername) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const result = await checkUsernameAvailability(username);
        setUsernameAvailable(result.available);
      } catch (error) {
        console.error("Username check error:", error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500),
    [originalUsername]
  );

  // Watch username field changes
  const watchedUsername = form.watch("username");
  useEffect(() => {
    if (watchedUsername && watchedUsername !== originalUsername) {
      debouncedUsernameCheck(watchedUsername);
    } else if (watchedUsername === originalUsername) {
      setUsernameAvailable(null);
    }
  }, [watchedUsername, debouncedUsernameCheck, originalUsername]);
  // Reset the form when shop data changes
  useEffect(() => {
    const newFormData = {
      name: initialData.name,
      username: initialData.username || "",
      address: initialData.address,
      city: initialData.city,
      state: initialData.state,
      zip_code: initialData.zip_code,
      phone_number: initialData.phone_number,
      email: initialData.email,
      opening_time: initialData.opening_time,
      closing_time: initialData.closing_time,
      average_wait_time: initialData.average_wait_time.toString(),
      has_advertisement: initialData.has_advertisement
    };
    form.reset(newFormData);
    setOriginalUsername(initialData.username || "");
  }, [initialData, form]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof shopFormSchema>) {
    try {
      setIsLoading(true);

      const session = await getSession();
      if (!session?.user?.accessToken) {
        toast.error("No access token found. Please login again.");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({
          ...values,
          average_wait_time: parseInt(values.average_wait_time)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to update shop details.");
      }      const updatedShopData = await response.json();
      toast.success("Shop details updated successfully!");

      // Preserve original shop properties not in the form
      const updatedShop: Shop = {
        ...initialData,
        ...updatedShopData
      };      // Check if username/slug changed and update URL if needed
      const usernameChanged = values.username !== originalUsername;
      if (usernameChanged) {
        console.log(`Username changed from ${originalUsername} to ${values.username}, updating URL...`);
        // Use the shop-specific navigation utility to update the URL
        const urlUpdated = updateShopUrlAfterUsernameChange(values.username, router);
        if (urlUpdated) {
          console.log("URL update initiated for shop username change");
        }
      }

      onEditComplete(updatedShop);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shop Details</DialogTitle>
          <DialogDescription>
            Update your shop's information. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >{/* Shop Name */}              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="mb-2">Shop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Username */}
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Choose a unique username" 
                        {...field}
                        className={`pr-10 ${
                          usernameAvailable === true 
                            ? 'border-green-500 focus:border-green-500' 
                            : usernameAvailable === false 
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {checkingUsername ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        ) : usernameAvailable === true ? (
                          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : usernameAvailable === false ? (
                          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : null}
                      </div>
                    </div>
                  </FormControl>
                  <div className="text-sm text-gray-600">
                    This will be used in your shop URL: yourshop.com/shop/{field.value || 'username'}
                  </div>
                  {usernameAvailable === false && (
                    <div className="text-sm text-red-500">
                      This username is already taken
                    </div>
                  )}
                  {usernameAvailable === true && (
                    <div className="text-sm text-green-500">
                      This username is available
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              {/* Address */}
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* State */}
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* ZIP Code */}
                <FormField control={form.control} name="zip_code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ZIP code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Phone Number */}
                <FormField control={form.control} name="phone_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Email */}
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                {/* Opening Time */}
                <FormField control={form.control} name="opening_time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Closing Time */}
                <FormField control={form.control} name="closing_time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Average Wait Time */}
              <FormField control={form.control} name="average_wait_time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Average Wait Time (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="Enter average wait time in minutes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </motion.div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isLoading || 
                  usernameAvailable === false || 
                  (!!watchedUsername && watchedUsername !== originalUsername && usernameAvailable === null)
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Shop"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
