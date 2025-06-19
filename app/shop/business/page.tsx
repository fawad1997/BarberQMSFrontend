"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm, Path, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { getSession } from "next-auth/react";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import WorkScheduleManager from '@/components/shops/schedules/WorkScheduleManager';
import debounce from 'lodash/debounce';

interface OperatingHour {
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
}

interface Business {
  id: number;
  name: string;
  username: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  email: string;
  operating_hours: OperatingHour[];
  average_wait_time: number;
  has_advertisement: boolean;
  advertisement_image_url?: string;
  advertisement_start_date?: string;
  advertisement_end_date?: string;
  is_advertisement_active: boolean;
  estimated_wait_time: number;
  owner_id: number;
  services: Service[];
}

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'Available' | 'In Service' | 'On Break' | 'Off';
}

interface WorkSchedule {
  id: number;
  barber_id: number;
  barber_name: string;
  shop_id: number;
  start_date: string;
  end_date: string;
  repeat_frequency: 'none' | 'daily' | 'weekly' | 'weekly_no_weekends';
}

async function checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
  try {
    const session = await getSession();
    if (!session?.user?.accessToken) {
      throw new Error("No access token found. Please login again.");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/check-username/${username}`, {
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Failed to check username: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking username:", error);
    throw error;
  }
}

// BusinessDialog for add/edit business
function BusinessDialog({ open, onClose, onSubmit, initialData }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: Business | null;
}) {
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [originalUsername, setOriginalUsername] = useState(initialData?.username || "");
  const [services, setServices] = useState<Service[]>(initialData?.services || []);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceEditData, setServiceEditData] = useState<Service | null>(null);

  const businessSchema = z.object({
    name: z.string().min(1, "Business name is required"),
    username: z.string().min(1, "Username is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip_code: z.string().min(1, "ZIP code is required"),
    phone_number: z.string().min(1, "Phone number is required"),
    email: z.string().email("Invalid email address"),
    average_wait_time: z.number().min(1, "Average wait time is required"),
    has_advertisement: z.boolean().default(false),
    operating_hours: z.array(z.object({
      day_of_week: z.number(),
      opening_time: z.string(),
      closing_time: z.string(),
      is_closed: z.boolean().default(false),
    })),
    services: z.array(z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Service name is required"),
      duration: z.number().min(1, "Duration must be a positive number"),
      price: z.number().min(0, "Price must be a non-negative number"),
    })),
  });

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: initialData?.name || "",
      username: initialData?.username || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zip_code: initialData?.zip_code || "",
      phone_number: initialData?.phone_number || "",
      email: initialData?.email || "",
      average_wait_time: initialData?.average_wait_time || 0,
      has_advertisement: initialData?.has_advertisement || false,
      operating_hours: initialData?.operating_hours || [
        { day_of_week: 0, opening_time: "09:00", closing_time: "17:00", is_closed: true }, // Sunday
        { day_of_week: 1, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Monday
        { day_of_week: 2, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Tuesday
        { day_of_week: 3, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Wednesday
        { day_of_week: 4, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Thursday
        { day_of_week: 5, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Friday
        { day_of_week: 6, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Saturday
      ],
      services: initialData?.services || [],
    },
  });

  // Reset form and services when dialog opens/closes or initialData changes
  useEffect(() => {
    const newFormData = {
      name: initialData?.name || "",
      username: initialData?.username || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zip_code: initialData?.zip_code || "",
      phone_number: initialData?.phone_number || "",
      email: initialData?.email || "",
      average_wait_time: initialData?.average_wait_time || 0,
      has_advertisement: initialData?.has_advertisement || false,
      operating_hours: initialData?.operating_hours || [
        { day_of_week: 0, opening_time: "09:00", closing_time: "17:00", is_closed: true }, // Sunday
        { day_of_week: 1, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Monday
        { day_of_week: 2, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Tuesday
        { day_of_week: 3, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Wednesday
        { day_of_week: 4, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Thursday
        { day_of_week: 5, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Friday
        { day_of_week: 6, opening_time: "09:00", closing_time: "17:00", is_closed: false }, // Saturday
      ],
      services: initialData?.services || [],
    };
    form.reset(newFormData);
    setServices(initialData?.services || []);
    setOriginalUsername(initialData?.username || "");
    form.setValue('services', initialData?.services || []);
  }, [initialData, form, setServices]);

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

  const handleServiceAdd = () => {
    setServiceEditData(null);
    setServiceDialogOpen(true);
  };

  const handleServiceEdit = (service: Service) => {
    setServiceEditData(service);
    setServiceDialogOpen(true);
  };

  const handleServiceDelete = (id: number) => {
    const updatedServices = services.filter(service => service.id !== id);
    setServices(updatedServices);
  };

  const handleServiceDialogSubmit = (data: any) => {
    if (serviceEditData) {
      // Update existing service
      const updatedServices = services.map(service => 
        service.id === serviceEditData.id ? { ...data, id: service.id } : service
      );
      setServices(updatedServices);
    } else {
      // Add new service
      const newService = {
        ...data,
        id: Math.max(0, ...services.map(s => s.id || 0)) + 1
      };
      setServices([...services, newService]);
    }
    setServiceDialogOpen(false);
  };

  const serviceColumns: GridColDef[] = [
    { field: "name", headerName: "Service Name", width: 200 },
    { field: "price", headerName: "Price", width: 120, renderCell: (params: GridRenderCellParams) => `$${params.value}` },
    { field: "duration", headerName: "Duration (min)", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleServiceEdit(params.row)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleServiceDelete(params.row.id)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const days = [
    { key: 0, label: "Sunday" },
    { key: 1, label: "Monday" },
    { key: 2, label: "Tuesday" },
    { key: 3, label: "Wednesday" },
    { key: 4, label: "Thursday" },
    { key: 5, label: "Friday" },
    { key: 6, label: "Saturday" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Business" : "Add Business"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update your business information" : "Enter your business information"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] pr-4">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <Typography variant="h6" className="text-lg font-semibold">
                  Basic Information
                </Typography>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        {checkingUsername && (
                          <div className="text-sm text-gray-500">
                            Checking username availability...
                          </div>
                        )}
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
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="average_wait_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Wait Time (minutes)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Operating Hours Section */}
              <div className="space-y-4 mt-6">
                <Typography variant="h6" className="text-lg font-semibold">
                  Operating Hours
                </Typography>
                {days.map((day) => {
                  const dayIndex = form.getValues("operating_hours").findIndex(
                    (hours) => hours.day_of_week === day.key
                  );
                  
                  return (
                    <div key={day.key} className="grid grid-cols-4 gap-4 items-center">
                      <Controller
                        control={form.control}
                        name={`operating_hours.${dayIndex}.is_closed`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {day.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <Controller
                        control={form.control}
                        name={`operating_hours.${dayIndex}.opening_time`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="time"
                                value={field.value ? String(field.value) : ''}
                                disabled={Boolean(form.watch(`operating_hours.${dayIndex}.is_closed`))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Controller
                        control={form.control}
                        name={`operating_hours.${dayIndex}.closing_time`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="time"
                                value={field.value ? String(field.value) : ''}
                                disabled={Boolean(form.watch(`operating_hours.${dayIndex}.is_closed`))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Services Section */}
              <div className="space-y-4 mt-6">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" className="text-lg font-semibold">
                    Services
                  </Typography>
                  <Button onClick={handleServiceAdd} className="min-w-[140px] font-semibold">
                    <Plus className="h-4 w-4 mr-2" /> Add Service
                  </Button>
                </Box>
                <Box border={1} borderColor="divider" borderRadius={2} p={2} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                  <DataGrid
                    rows={services}
                    columns={serviceColumns}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 5 } },
                    }}
                    autoHeight
                    disableRowSelectionOnClick
                  />
                </Box>
              </div>

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
                    <FormLabel className="font-normal">
                      Enable Advertisement
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? "Update Business" : "Add Business"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Service Dialog */}
      <ServiceDialog
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        onSubmit={handleServiceDialogSubmit}
        initialData={serviceEditData}
      />
    </Dialog>
  );
}

// ServiceDialog for add/edit service
function ServiceDialog({ open, onClose, onSubmit, initialData }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: Service | null;
}) {
  const schema = z.object({
    name: z.string().min(1, "Service name is required"),
    duration: z.coerce.number().min(1, "Duration must be a positive number"),
    price: z.coerce.number().min(0, "Price must be a non-negative number"),
    id: z.number().optional(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      duration: initialData?.duration || 0,
      price: initialData?.price || 0,
      id: initialData?.id || undefined,
    },
  });

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    const newFormData = {
      name: initialData?.name || "",
      duration: initialData?.duration || 0,
      price: initialData?.price || 0,
      id: initialData?.id || undefined,
    };
    form.reset(newFormData);
  }, [open, initialData, form]);

  const onSubmitForm = (data: z.infer<typeof schema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {initialData ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Haircut, Manicure" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 30" min="1" {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Enter the estimated duration in minutes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 25" min="0" step="0.01" {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit">{initialData ? "Update" : "Add"}</Button>
          </Box>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// DeleteConfirmationDialog component
function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  dialogTitle,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  dialogTitle: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{itemName}&quot;? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessManagementPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Business | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: number; name: string } | null>(null);

  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    status: ''
  });
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);
  const [showEmployeeDeleteConfirmDialog, setShowEmployeeDeleteConfirmDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: number; name: string } | null>(null);

  // Fetch businesses on component mount
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const session = await getSession();
        
        if (!session?.user?.accessToken) {
          throw new Error("No access token found. Please login again.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops`, {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to fetch businesses: ${response.statusText}`);
        }

        const data = await response.json();
        setBusinesses(data);
      } catch (error) {
        console.error("Error fetching businesses:", error);
        setError(error instanceof Error ? error : new Error("Failed to fetch businesses"));
        toast.error(error instanceof Error ? error.message : "Failed to fetch businesses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  // 2. Fetch employees for selected business
  useEffect(() => {
    if (!selectedBusiness) return;
    const fetchEmployees = async () => {
      setEmployeeLoading(true);
      setEmployeeError(null);
      try {
        const session = await getSession();
        if (!session?.user?.accessToken) throw new Error('No access token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/barbers/`, {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch employees');
        const data = await res.json();
        const mapped = data.map((emp: any) => ({
          ...emp,
          name: emp.full_name,
          phone: emp.phone_number,
        }));
        setEmployees(mapped);
      } catch (err) {
        setEmployeeError(err instanceof Error ? err.message : 'Failed to fetch employees');
        toast.error(err instanceof Error ? err.message : 'Failed to fetch employees');
      } finally {
        setEmployeeLoading(false);
      }
    };
    fetchEmployees();
  }, [selectedBusiness]);

  // 3. Add employee
  const handleEmployeeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.status) return;
    setEmployeeLoading(true);
    setEmployeeError(null);
    try {
      const session = await getSession();
      if (!session?.user?.accessToken) throw new Error('No access token');
      const statusMap: Record<string, string> = {
        "Available": "available",
        "In Service": "in_service",
        "On Break": "on_break",
        "Off": "off"
      };
      const payload = {
        full_name: newEmployee.name,
        email: newEmployee.email,
        phone_number: newEmployee.phone,
        status: statusMap[newEmployee.status] || newEmployee.status,
      };
      const url = editEmployeeId !== null
        ? `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness?.id}/barbers/${editEmployeeId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness?.id}/barbers/`;
      const res = await fetch(url, {
        method: editEmployeeId !== null ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to save employee');
      }
      setEmployeeDialogOpen(false);
      toast.success(editEmployeeId !== null ? 'Employee updated successfully' : 'Employee added successfully');
      // Refresh list
      const refreshed = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness?.id}/barbers/`, {
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const refreshedData = await refreshed.json();
      const mapped = refreshedData.map((emp: any) => ({
        ...emp,
        name: emp.full_name,
        phone: emp.phone_number,
      }));
      setEmployees(mapped);
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Failed to save employee');
      toast.error(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setEmployeeLoading(false);
    }
  };

  // 4. Delete employee
  const handleDeleteEmployee = async (id: number, name: string) => {
    setEmployeeToDelete({ id, name });
    setShowEmployeeDeleteConfirmDialog(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!selectedBusiness || !employeeToDelete) return;
    setEmployeeLoading(true);
    setEmployeeError(null);
    try {
      const session = await getSession();
      if (!session?.user?.accessToken) throw new Error('No access token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness?.id}/barbers/${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to delete employee');
      }
      toast.success('Employee deleted successfully');
      // Refresh list
      const refreshed = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness?.id}/barbers/`, {
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const refreshedData = await refreshed.json();
      const mapped = refreshedData.map((emp: any) => ({
        ...emp,
        name: emp.full_name,
        phone: emp.phone_number,
      }));
      setEmployees(mapped);
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Failed to delete employee');
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee');
    } finally {
      setEmployeeLoading(false);
      setShowEmployeeDeleteConfirmDialog(false);
      setEmployeeToDelete(null);
    }
  };

  // 1. Add state for editing employee
  const handleAddEmployee = () => {
    setNewEmployee({ name: '', email: '', phone: '', status: '' });
    setEditEmployeeId(null);
    setEmployeeDialogOpen(true);
  };

  // 3. Add handleEditEmployee
  const handleEditEmployee = (employee: Employee) => {
    setNewEmployee({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      status: employee.status
    });
    setEditEmployeeId(employee.id);
    setEmployeeDialogOpen(true);
  };

  // 6. Update employeeColumns to add actions
  const employeeColumns: GridColDef[] = [
    { field: 'name', headerName: 'Full Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone Number', width: 150 },
    { field: 'status', headerName: 'Status', width: 140 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEditEmployee(params.row)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDeleteEmployee(params.row.id, params.row.name)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleAdd = () => {
    setEditData(null);
    setBusinessDialogOpen(true);
  };

  const handleEdit = (data: Business) => {
    setEditData(data);
    setBusinessDialogOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    setBusinessToDelete({ id, name });
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteBusiness = async () => {
    if (!businessToDelete) return;
      try {
        const session = await getSession();
        if (!session?.user?.accessToken) {
          throw new Error("No access token found. Please login again.");
        }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${businessToDelete.id}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to delete business: ${response.statusText}`);
        }

      setBusinesses(businesses.filter((b) => b.id !== businessToDelete.id));
        toast.success("Business deleted successfully");
      } catch (error) {
        console.error("Error deleting business:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete business");
    } finally {
      setShowDeleteConfirmDialog(false);
      setBusinessToDelete(null);
    }
  };

  const handleDialogSubmit = async (data: any) => {
    try {
      const session = await getSession();
      if (!session?.user?.accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      const payload = {
        name: data.name,
        username: data.username,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        phone_number: data.phone_number,
        email: data.email,
        average_wait_time: data.average_wait_time,
        has_advertisement: data.has_advertisement,
        is_advertisement_active: false,
        operating_hours: data.operating_hours,
        services: data.services.map((service: any) => ({
          name: service.name,
          duration: service.duration,
          price: service.price,
          id: service.id
        }))
      };

      if (editData) {
        // Update existing business
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${editData.id}`, {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to update business: ${response.statusText}`);
        }

        const updatedBusiness = await response.json();
        setBusinesses(businesses.map((b) => (b.id === editData.id ? updatedBusiness : b)));
        toast.success("Business updated successfully");
      } else {
        // Create new business
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to create business: ${response.statusText}`);
        }

        const newBusiness = await response.json();
        setBusinesses([...businesses, newBusiness]);
        toast.success("Business created successfully");
      }

      setBusinessDialogOpen(false);
    } catch (error) {
      console.error("Error submitting business:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit business");
    }
  };

  const businessColumns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "phone_number", headerName: "Phone", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "operating_hours",
      headerName: "Operating Hours",
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const hours = params.value as OperatingHour[];
        const todayDayOfWeek = new Date().getDay();
        
        // Find today's hours
        const todayHours = hours?.find((h: OperatingHour) => h.day_of_week === todayDayOfWeek);
        
        if (!todayHours || todayHours.is_closed) {
          return <Box sx={{ color: 'error.main' }}>Closed Today</Box>;
        }
        
        return (
          <Box>
            {todayHours.opening_time} - {todayHours.closing_time}
        </Box>
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params: GridRenderCellParams) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={selectedBusiness?.id === params.row.id ? "destructive" : "secondary"}
            onClick={() => {
              if (selectedBusiness?.id === params.row.id) {
                setSelectedBusiness(null);
              } else {
                setSelectedBusiness(params.row);
              }
            }}
          >
            {selectedBusiness?.id === params.row.id ? "Deselect" : "Select"}
          </Button>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row.id, params.row.name)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: { xs: 2, md: 6 }, px: { xs: 1, md: 3 } }}>
        <Box mb={4} sx={{ mt: 2 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: 24, md: 32 } }}>
            Business Management
          </Typography>
        </Box>
        <Box mb={6} p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} sx={{ fontSize: { xs: 18, md: 22 } }}>
            Loading businesses...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: { xs: 2, md: 6 }, px: { xs: 1, md: 3 } }}>
        <Box mb={4} sx={{ mt: 2 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: 24, md: 32 } }}>
            Business Management
          </Typography>
        </Box>
        <Box mb={6} p={3} border={1} borderColor="error.main" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="error" sx={{ fontSize: { xs: 18, md: 22 } }}>
            Error Loading Businesses
          </Typography>
          <Typography color="error">
            {error.message}
          </Typography>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: { xs: 2, md: 6 }, px: { xs: 1, md: 3 } }}>
      <Box mb={4} sx={{ mt: 2 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: 24, md: 32 } }}>
          Business Management
        </Typography>
      </Box>
      <Box mb={6} p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2} sx={{ fontSize: { xs: 18, md: 22 } }}>
          Businesses
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button onClick={handleAdd} className="min-w-[140px] font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Add Business
          </Button>
        </Box>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <DataGrid
            rows={businesses}
            columns={businessColumns}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
            }}
            disableRowSelectionOnClick
            sx={{ minWidth: 600, bgcolor: 'background.default', borderRadius: 2 }}
          />
        </Box>
      </Box>

      {selectedBusiness && (
        <>
          <Box p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2} sx={{ fontSize: { xs: 18, md: 22 } }}>
              Employees for {selectedBusiness.name}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: 18, md: 20 } }}>
                Employee Management
              </Typography>
              <Button 
                onClick={handleAddEmployee} 
                className="min-w-[140px] font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Employee
              </Button>
            </Box>
            {employeeLoading ? (
              <Box py={4} textAlign="center"><span>Loading employees...</span></Box>
            ) : employeeError ? (
              <Box py={4} textAlign="center" color="error.main"><span>{employeeError}</span></Box>
            ) : (
              <Box border={1} borderColor="divider" borderRadius={2} p={2} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                <DataGrid
                  rows={employees}
                  columns={employeeColumns}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                  }}
                  autoHeight
                  disableRowSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-cell': {
                      borderColor: 'divider',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'background.default',
                      borderColor: 'divider',
                    },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Add Employee Dialog */}
          <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editEmployeeId !== null ? 'Edit Employee' : 'Add New Employee'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEmployeeFormSubmit} className="space-y-6 py-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoComplete="off"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoComplete="off"
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoComplete="off"
                />
                <select
                  name="status"
                  value={newEmployee.status}
                  onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value as Employee['status'] })}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Available">Available</option>
                  <option value="In Service">In Service</option>
                  <option value="On Break">On Break</option>
                  <option value="Off">Off</option>
                </select>
                <div className="flex gap-4 justify-end mt-4">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white text-gray-700 py-3 px-6 text-base font-semibold hover:bg-gray-100 transition-colors"
                    onClick={() => setEmployeeDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#0B1120] text-white py-3 px-6 text-base font-semibold hover:bg-[#1a2233] transition-colors"
                  >
                    {editEmployeeId !== null ? 'Update Employee' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Work Schedule Manager Section */}
          <Box p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2} sx={{ fontSize: { xs: 18, md: 22 } }}>
              Work Schedules for {selectedBusiness.name}
            </Typography>
            <WorkScheduleManager shopId={selectedBusiness.id} />
          </Box>
        </>
      )}
      <BusinessDialog
        key={businessDialogOpen ? "open" : "closed"}
        open={businessDialogOpen}
        onClose={() => {
          setBusinessDialogOpen(false);
          setSelectedBusiness(null);
        }}
        onSubmit={handleDialogSubmit}
        initialData={selectedBusiness}
      />
      <DeleteConfirmationDialog
        open={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        onConfirm={confirmDeleteBusiness}
        itemName={businessToDelete?.name || ''}
        dialogTitle="Delete Business"
      />
      {employeeToDelete && (
        <DeleteConfirmationDialog
          open={showEmployeeDeleteConfirmDialog}
          onClose={() => setShowEmployeeDeleteConfirmDialog(false)}
          onConfirm={confirmDeleteEmployee}
          itemName={employeeToDelete.name}
          dialogTitle="Delete Employee"
        />
      )}
    </Box>
  );
} 