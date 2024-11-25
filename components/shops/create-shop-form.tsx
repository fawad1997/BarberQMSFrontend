"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const shopFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "ZIP code is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  average_wait_time: z.number().min(0),
  has_advertisement: z.boolean().default(false),
  advertisement_image_url: z.string().optional(),
  advertisement_start_date: z.string().optional(),
  advertisement_end_date: z.string().optional(),
  is_advertisement_active: z.boolean().default(false),
});

export default function CreateShopForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof shopFormSchema>>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      has_advertisement: false,
      is_advertisement_active: false,
    },
  });

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    
    // Replace with your image upload endpoint
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    return data.url;
  }

  async function onSubmit(values: z.infer<typeof shopFormSchema>) {
    try {
      setIsLoading(true);

      // Get session using getSession() instead of useSession
      const session = await getSession();
      console.log('Session:', session);

      if (!session?.user?.accessToken) {
        toast.error("No access token found. Please login again.");
        return;
      }

      let imageUrl = values.advertisement_image_url;
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload image');
          return;
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`, // Use session.user.accessToken
        },
        body: JSON.stringify({
          ...values,
          advertisement_image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        });
        
        if (response.status === 401) {
          toast.error("Unauthorized: Please log in again");
        } else if (response.status === 400) {
          toast.error(errorData?.message || "Invalid form data");
        } else if (response.status === 403) {
          toast.error("You don't have permission to create a shop");
        } else {
          toast.error(`Failed to create shop: ${errorData?.message || response.statusText}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      toast.success("Shop created successfully");
      router.push("/shop/shops");
    } catch (error) {
      console.error('Submit error:', error);
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shop Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter shop name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Enter state" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zip_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter ZIP code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="average_wait_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Average Wait Time (minutes)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter average wait time" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="has_advertisement"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Has Advertisement</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("has_advertisement") && (
          <>
            <FormItem>
              <FormLabel>Advertisement Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </FormControl>
            </FormItem>
            
            <FormField
              control={form.control}
              name="advertisement_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertisement Start Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="advertisement_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertisement End Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Shop"}
        </Button>
      </form>
    </Form>
  );
} 