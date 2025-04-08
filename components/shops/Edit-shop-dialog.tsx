"use client";

import { useEffect, useState } from "react";
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

// Define validation schema using Zod
const shopFormSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
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

  // Convert Shop object to form-compatible object
  const formInitialData = {
    name: initialData.name,
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

  // Reset the form when shop data changes
  useEffect(() => {
    form.reset({
      name: initialData.name,
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
    });
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
      }

      const updatedShopData = await response.json();
      toast.success("Shop details updated successfully!");

      // Preserve original shop properties not in the form
      const updatedShop: Shop = {
        ...initialData,
        ...updatedShopData
      };

      onEditComplete(updatedShop);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Shop Details</DialogTitle>
          <DialogDescription>
            Update your shop's information. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Shop Name */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop name" {...field} />
                  </FormControl>
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
              <Button type="submit" disabled={isLoading}>
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
