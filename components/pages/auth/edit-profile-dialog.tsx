"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionUpdate } from "@/lib/hooks/useSessionUpdate";

// Define validation schema for name form
const nameFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

// Define validation schema for password form
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileDialog({ isOpen, onClose }: EditProfileProps) {
  const { session, updateSession, resetSessionUI } = useSessionUpdate();
  const [activeTab, setActiveTab] = useState("name");
  const [isNameLoading, setIsNameLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Form for name update
  const nameForm = useForm<z.infer<typeof nameFormSchema>>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
    },
  });

  // Ensure form has the latest name value when mounted
  useEffect(() => {
    try {
      // Check if DOM has a more recent name value
      const nameElements = document.querySelectorAll('[data-profile-name]');
      if (nameElements.length > 0) {
        const nameFromDOM = nameElements[0].textContent?.trim();
        if (nameFromDOM && nameFromDOM !== "User" && nameFromDOM !== nameForm.getValues().name) {
          console.log("Updating form with name from DOM on mount:", nameFromDOM);
          nameForm.reset({ name: nameFromDOM });
        }
      }
    } catch (error) {
      console.error("Error setting initial name from DOM:", error);
    }
  }, []);

  // Form for password update
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Reset forms when user data changes or dialog opens/closes
  useEffect(() => {
    if (session?.user?.name) {
      nameForm.reset({
        name: session.user.name,
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Reset any errors
      setPasswordError(null);
    }
  }, [session, nameForm, passwordForm, isOpen]);

  // Reset forms when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Try to get the current name from multiple sources in priority order
      let currentName = session?.user?.name || "";
      
      try {
        // 1. First try to get the name from localStorage (most reliable for recent changes)
        if (typeof window !== 'undefined') {
          const storedName = localStorage.getItem('lastUpdatedName');
          if (storedName) {
            currentName = storedName;
            console.log("Using name from localStorage:", currentName);
          }
        }
        
        // 2. Then try to get the name from the DOM if still needed
        if (currentName === session?.user?.name) {
          const nameElements = document.querySelectorAll('[data-profile-name]');
          if (nameElements.length > 0) {
            const nameFromDOM = nameElements[0].textContent?.trim();
            if (nameFromDOM && nameFromDOM !== "User" && nameFromDOM !== currentName) {
              currentName = nameFromDOM;
              console.log("Using name from DOM for form:", currentName);
            }
          }
        }
      } catch (error) {
        console.error("Error getting current name:", error);
      }
      
      // Always reset to current data when dialog opens
      nameForm.reset({
        name: currentName
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setPasswordError(null);
    }
  }, [isOpen, session, nameForm, passwordForm]);

  async function onNameSubmit(values: z.infer<typeof nameFormSchema>) {
    try {
      setIsNameLoading(true);
      
      // Check if name is actually changed
      if (values.name === session?.user?.name) {
        toast.info("No changes were made to your name.");
        onClose();
        return;
      }
      
      console.log("Starting name update process:", values.name);
      
      // Prepare request data
      const requestData = {
        name: values.name,
      };

      console.log("Submitting name update to API:", requestData);

      // Make the API request using our Next.js API route
      const response = await fetch("/api/auth/update-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || errorData?.detail || "Failed to update profile");
      }

      // Get updated user data
      const updatedUserData = await response.json();
      console.log("Name update successful, server response:", updatedUserData);
      
      // Store the updated name in localStorage as a backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastUpdatedName', updatedUserData.name);
        localStorage.setItem('lastUpdateTime', new Date().toISOString());
      }
      
      // Update session with new name - this should trigger UI updates
      const updated = await updateSession({
        name: updatedUserData.name,
      });
      
      console.log("Session update completed:", updated);
      
      // Force UI refresh for components using the session
      resetSessionUI();
      
      // Fallback: directly update DOM elements showing the name
      setTimeout(() => {
        try {
          // Try to directly update DOM elements with data-profile-name attribute
          document.querySelectorAll('[data-profile-name]').forEach(el => {
            el.textContent = updatedUserData.name;
          });
          console.log("Applied direct DOM update for name elements");
        } catch (error) {
          console.error("Failed to update DOM directly:", error);
        }
      }, 300);
      
      // Show success message
      toast.success("Name updated successfully!");
      
      // Close the dialog after session update
      onClose();
      
    } catch (error) {
      console.error("Name update error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsNameLoading(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    try {
      setIsPasswordLoading(true);
      setPasswordError(null);
      
      // Check if passwords match (redundant with Zod, but added for extra safety)
      if (values.newPassword !== values.confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
      
      // Prepare request data
      const requestData = {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      };

      // Make the API request using our Next.js API route
      const response = await fetch("/api/auth/update-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // Handle response
      const data = await response.json().catch(() => null);
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          setPasswordError("Current password is incorrect");
          return;
        } else if (response.status === 422) {
          setPasswordError(data?.error || "Validation error occurred");
          return;
        } else {
          throw new Error(data?.error || data?.detail || "Failed to update password");
        }
      }

      // Show success message
      toast.success("Password updated successfully!");
      
      // Close the dialog
      onClose();
      
      // Reset form
      passwordForm.reset();
    } catch (error) {
      // Error is shown via the passwordError state and toast
      if (!passwordError) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    } finally {
      setIsPasswordLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        nameForm.reset();
        passwordForm.reset();
        setPasswordError(null);
        onClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={onClose}
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing when clicking outside
      >
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and password
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="name" 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value);
            setPasswordError(null);
          }}
          className="w-full pt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="name" data-testid="name-tab">Name</TabsTrigger>
            <TabsTrigger value="password" data-testid="password-tab">Password</TabsTrigger>
          </TabsList>
          
          {/* Name Tab Content */}
          <TabsContent value="name" className="mt-4 focus-visible:outline-none">
            <Form {...nameForm}>
              <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <FormField 
                    control={nameForm.control} 
                    name="name" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="name-input">Name</FormLabel>
                        <FormControl>
                          <Input 
                            id="name-input"
                            placeholder="Enter your name" 
                            {...field} 
                            aria-describedby="name-error"
                            autoComplete="name"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage id="name-error" />
                      </FormItem>
                    )} 
                  />
                </motion.div>

                <div className="flex justify-end space-x-4 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isNameLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isNameLoading}>
                    {isNameLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* Password Tab Content */}
          <TabsContent value="password" className="mt-4 focus-visible:outline-none">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Current Password */}
                  <FormField 
                    control={passwordForm.control} 
                    name="currentPassword" 
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel htmlFor="current-password-input">Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              id="current-password-input"
                              type={showCurrentPassword ? "text" : "password"} 
                              placeholder="Enter current password" 
                              {...field} 
                              aria-describedby="current-password-error"
                              autoComplete="current-password"
                              autoFocus={activeTab === "password"}
                            />
                            <button 
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                            >
                              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage id="current-password-error" />
                      </FormItem>
                    )} 
                  />

                  {/* New Password */}
                  <FormField 
                    control={passwordForm.control} 
                    name="newPassword" 
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel htmlFor="new-password-input">New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              id="new-password-input"
                              type={showNewPassword ? "text" : "password"} 
                              placeholder="Enter new password" 
                              {...field} 
                              aria-describedby="new-password-error"
                              autoComplete="new-password"
                            />
                            <button 
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                            >
                              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage id="new-password-error" />
                      </FormItem>
                    )} 
                  />

                  {/* Confirm Password */}
                  <FormField 
                    control={passwordForm.control} 
                    name="confirmPassword" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="confirm-password-input">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              id="confirm-password-input"
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm new password" 
                              {...field}
                              aria-describedby="confirm-password-error" 
                              autoComplete="new-password"
                            />
                            <button 
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage id="confirm-password-error" />
                      </FormItem>
                    )} 
                  />

                  {/* Display specific password error */}
                  {passwordError && (
                    <div 
                      className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                      role="alert"
                      aria-live="assertive"
                    >
                      {passwordError}
                    </div>
                  )}
                </motion.div>

                <div className="flex justify-end space-x-4 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isPasswordLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPasswordLoading}>
                    {isPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 