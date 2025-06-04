"use client";

import React, { useState, useEffect } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { getSession } from "next-auth/react";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface Business {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  email: string;
  opening_time: string;
  closing_time: string;
  average_wait_time: number;
  has_advertisement: boolean;
  advertisement_image_url?: string;
  advertisement_start_date?: string;
  advertisement_end_date?: string;
  is_advertisement_active: boolean;
  estimated_wait_time: number;
  is_open: boolean;
  formatted_hours: string;
  owner_id: number;
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

function ServiceList({ selectedBusiness, services, onAdd, onEdit, onDelete, onDialogSubmit }: {
  selectedBusiness: Business | null,
  services: Service[],
  onAdd: () => void,
  onEdit: (service: Service) => void,
  onDelete: (id: number) => void,
  onDialogSubmit: (data: any) => void,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Service | null>(null);

  if (!selectedBusiness) return null;

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
    onAdd();
  };

  const handleEdit = (data: Service) => {
    setEditData(data);
    setDialogOpen(true);
    onEdit(data);
  };

  const handleDelete = (id: number) => {
    onDelete(id);
  };

  const handleDialogSubmit = (data: any) => {
    onDialogSubmit(data);
    setDialogOpen(false);
  };

  const serviceColumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
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
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box mt={2} sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: 18, md: 20 } }}>
          Services
        </Typography>
        <Button onClick={handleAdd} sx={{ minWidth: 140, fontWeight: 600 }}>
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
      <ServiceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleDialogSubmit} initialData={editData} />
    </Box>
  );
}

// BusinessDialog for add/edit business
function BusinessDialog({ open, onClose, onSubmit, initialData }: any) {
  const schema = yup.object().shape({
    name: yup.string().required("Name is required"),
    address: yup.string().required("Address is required"),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    zip_code: yup.string().required("ZIP code is required"),
    phone_number: yup.string().required("Phone number is required"),
    email: yup.string().email().required("Email is required"),
    opening_time: yup.string().required("Opening time is required"),
    closing_time: yup.string().required("Closing time is required"),
    average_wait_time: yup.number().typeError("Average wait time must be a number").required("Average wait time is required"),
  });
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      phone_number: "",
      email: "",
      opening_time: "",
      closing_time: "",
      average_wait_time: "",
    },
    resolver: yupResolver(schema),
  });
  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => { reset(initialData || {}); }, [open, initialData, reset]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Business" : "Add Business"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Controller name="name" control={control} render={({ field }) => (
              <TextField {...field} label="Name" error={!!errors.name} helperText={typeof errors.name?.message === 'string' ? errors.name?.message : ''} fullWidth />
            )} />
            <Controller name="address" control={control} render={({ field }) => (
              <TextField {...field} label="Address" error={!!errors.address} helperText={typeof errors.address?.message === 'string' ? errors.address?.message : ''} fullWidth />
            )} />
            <Box display="flex" gap={2}>
              <Controller name="city" control={control} render={({ field }) => (
                <TextField {...field} label="City" error={!!errors.city} helperText={typeof errors.city?.message === 'string' ? errors.city?.message : ''} fullWidth />
              )} />
              <Controller name="state" control={control} render={({ field }) => (
                <TextField {...field} label="State" error={!!errors.state} helperText={typeof errors.state?.message === 'string' ? errors.state?.message : ''} fullWidth />
              )} />
            </Box>
            <Box display="flex" gap={2}>
              <Controller name="zip_code" control={control} render={({ field }) => (
                <TextField {...field} label="ZIP Code" error={!!errors.zip_code} helperText={typeof errors.zip_code?.message === 'string' ? errors.zip_code?.message : ''} fullWidth />
              )} />
              <Controller name="phone_number" control={control} render={({ field }) => (
                <TextField {...field} label="Phone Number" error={!!errors.phone_number} helperText={typeof errors.phone_number?.message === 'string' ? errors.phone_number?.message : ''} fullWidth />
              )} />
            </Box>
            <Controller name="email" control={control} render={({ field }) => (
              <TextField {...field} label="Email" error={!!errors.email} helperText={typeof errors.email?.message === 'string' ? errors.email?.message : ''} fullWidth />
            )} />
            <Box display="flex" gap={2}>
              <Controller name="opening_time" control={control} render={({ field }) => (
                <TextField {...field} label="Opening Time" type="time" error={!!errors.opening_time} helperText={typeof errors.opening_time?.message === 'string' ? errors.opening_time?.message : ''} fullWidth InputLabelProps={{ shrink: true }} />
              )} />
              <Controller name="closing_time" control={control} render={({ field }) => (
                <TextField {...field} label="Closing Time" type="time" error={!!errors.closing_time} helperText={typeof errors.closing_time?.message === 'string' ? errors.closing_time?.message : ''} fullWidth InputLabelProps={{ shrink: true }} />
              )} />
            </Box>
            <Controller name="average_wait_time" control={control} render={({ field }) => (
              <TextField {...field} label="Average Wait Time (min)" type="number" error={!!errors.average_wait_time} helperText={typeof errors.average_wait_time?.message === 'string' ? errors.average_wait_time?.message : ''} fullWidth />
            )} />
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
              <Button type="submit">{initialData ? "Update" : "Add"}</Button>
            </Box>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ServiceDialog for add/edit service
function ServiceDialog({ open, onClose, onSubmit, initialData }: any) {
  const schema = yup.object().shape({
    name: yup.string().required("Service name is required"),
    duration: yup.number().typeError("Duration must be a number").required("Duration is required"),
    price: yup.number().typeError("Price must be a number").required("Price is required"),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: "",
      duration: "",
      price: "",
    },
    resolver: yupResolver(schema),
  });

  React.useEffect(() => { reset(initialData || {}); }, [open, initialData, reset]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {initialData ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Service Name
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="name"
                  placeholder="e.g., Haircut, Manicure"
                  className="w-full"
                />
              )}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="duration"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Duration (minutes)
            </label>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="duration"
                  type="number"
                  placeholder="e.g., 30"
                  min="1"
                  className="w-full"
                  onChange={(e) => field.onChange(e.target.value.replace(/^0+/, ""))}
                />
              )}
            />
            {errors.duration && (
              <p className="text-sm text-red-500">{errors.duration.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the estimated duration in minutes
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="price"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Price ($)
            </label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="price"
                  type="number"
                  placeholder="e.g., 25"
                  min="0"
                  step="0.01"
                  className="w-full"
                  onChange={(e) => field.onChange(e.target.value.replace(/^0+/, ""))}
                />
              )}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit">{initialData ? "Update" : "Add"}</Button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessManagementPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Business | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  // Store all services by business id
  const [allServices, setAllServices] = useState<{ [businessId: number]: Service[] }>({
    1: [
      { id: 1, name: "Classic Haircut", price: 25, duration: 30 },
      { id: 2, name: "Beard Trim", price: 15, duration: 15 },
      { id: 3, name: "Shave", price: 20, duration: 20 },
    ],
    2: [
      { id: 1, name: "Premium Cut", price: 30, duration: 40 },
      { id: 2, name: "Hot Towel Shave", price: 22, duration: 25 },
    ],
  });

  // Get services for selected business
  const services = selectedBusiness ? allServices[selectedBusiness.id] || [] : [];

  // 1. Employee state, loading, error
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

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
      setEmployees(await refreshed.json());
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Failed to save employee');
      toast.error(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setEmployeeLoading(false);
    }
  };

  // 4. Delete employee
  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setEmployeeLoading(true);
    setEmployeeError(null);
    try {
      const session = await getSession();
      if (!session?.user?.accessToken) throw new Error('No access token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness?.id}/barbers/${id}`, {
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
      setEmployees(await refreshed.json());
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Failed to delete employee');
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee');
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Add this after the allServices state in BusinessManagementPage
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);

  // Add Employee form state
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    status: ''
  });

  // 1. Add state for editing employee
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);

  // 2. Update handleAddEmployee to reset edit state
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
    { field: 'id', headerName: 'ID', width: 70 },
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
            <IconButton size="small" onClick={() => handleDeleteEmployee(params.row.id)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Service handlers
  const handleServiceAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleServiceEdit = (service: Service) => {
    setEditData(service);
    setDialogOpen(true);
  };

  const handleServiceDelete = async (id: number) => {
    if (!selectedBusiness) return;
    
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const session = await getSession();
        if (!session?.user?.accessToken) {
          throw new Error("No access token found. Please login again.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/services/${id}`,
          {
            method: "DELETE",
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to delete service: ${response.statusText}`);
        }

        // Refresh services after deletion
        const servicesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/services`,
          {
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!servicesResponse.ok) {
          throw new Error("Failed to refresh services");
        }

        const updatedServices = await servicesResponse.json();
        setAllServices(prev => ({
          ...prev,
          [selectedBusiness.id]: updatedServices
        }));

        toast.success("Service deleted successfully");
      } catch (error) {
        console.error("Error deleting service:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete service");
      }
    }
  };

  const handleServiceDialogSubmit = async (data: any) => {
    if (!selectedBusiness) return;

    try {
      const session = await getSession();
      if (!session?.user?.accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      const payload = {
        name: data.name,
        duration: Number(data.duration),
        price: Number(data.price)
      };

      if (data.id) {
        // Update existing service
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/services/${data.id}`,
          {
            method: "PUT",
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to update service: ${response.statusText}`);
        }
      } else {
        // Create new service
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/services/`,
          {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to create service: ${response.statusText}`);
        }
      }

      // Refresh services after create/update
      const servicesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/services`,
        {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!servicesResponse.ok) {
        throw new Error("Failed to refresh services");
      }

      const updatedServices = await servicesResponse.json();
      setAllServices(prev => ({
        ...prev,
        [selectedBusiness.id]: updatedServices
      }));

      toast.success(data.id ? "Service updated successfully" : "Service added successfully");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error submitting service:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit service");
    }
  };

  // Fetch services when a business is selected
  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedBusiness) return;

      try {
        const session = await getSession();
        if (!session?.user?.accessToken) {
          throw new Error("No access token found. Please login again.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/services`,
          {
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to fetch services: ${response.statusText}`);
        }

        const services = await response.json();
        setAllServices(prev => ({
          ...prev,
          [selectedBusiness.id]: services
        }));
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error(error instanceof Error ? error.message : "Failed to fetch services");
      }
    };

    fetchServices();
  }, [selectedBusiness]);

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (data: Business) => {
    setEditData(data);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this business?")) {
      try {
        const session = await getSession();
        if (!session?.user?.accessToken) {
          throw new Error("No access token found. Please login again.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${id}`, {
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

        setBusinesses(businesses.filter((b) => b.id !== id));
        toast.success("Business deleted successfully");
      } catch (error) {
        console.error("Error deleting business:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete business");
      }
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
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        phone_number: data.phone_number,
        email: data.email,
        average_wait_time: parseInt(data.average_wait_time),
        has_advertisement: false,
        is_advertisement_active: false,
        is_open: true,
        opening_time: data.opening_time,
        closing_time: data.closing_time
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/`, {
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
      setDialogOpen(false);
    } catch (error) {
      console.error("Error submitting business:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit business");
    }
  };

  const businessColumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", width: 200 },
    {
      field: "addressFull",
      headerName: "Address",
      width: 300,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row || {};
        return `${row.address || ''}, ${row.city || ''}, ${row.state || ''}, ${row.zip_code || ''}`;
      },
    },
    { field: "phone_number", headerName: "Phone", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "opening_time", headerName: "Opening Time", width: 120 },
    { field: "closing_time", headerName: "Closing Time", width: 120 },
    { 
      field: "average_wait_time", 
      headerName: "Avg Wait (min)", 
      width: 120,
      valueFormatter: (params: { value: number }) => `${params.value} min`
    },
    {
      field: "is_open",
      headerName: "Status",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            color: params.value ? 'success.main' : 'error.main',
            fontWeight: 'medium'
          }}
        >
          {params.value ? 'Open' : 'Closed'}
        </Box>
      )
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
            <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  // --- Work Schedules CRUD Integration ---
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [workSchedulesLoading, setWorkSchedulesLoading] = useState(false);
  const [workSchedulesError, setWorkSchedulesError] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<WorkSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    barber_id: '',
    start_date: '', // ISO string for datetime-local
    end_date: '',   // ISO string for datetime-local
    repeat_frequency: 'none',
  });

  // Fetch all schedules for all employees of the selected business
  const fetchAllWorkSchedules = async (shopId: number, employees: Employee[], accessToken: string) => {
    const schedulePromises = employees.map(async (emp) => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/${emp.id}/schedules/`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((s: any) => ({
        ...s,
        barber_name: emp.name,
        shop_id: shopId,
      }));
    });
    const all = await Promise.all(schedulePromises);
    return all.flat();
  };

  useEffect(() => {
    if (!selectedBusiness || employees.length === 0) return;
    const fetchSchedules = async () => {
      setWorkSchedulesLoading(true);
      setWorkSchedulesError(null);
      try {
        const session = await getSession();
        if (!session?.user?.accessToken) throw new Error('No access token');
        const schedules = await fetchAllWorkSchedules(selectedBusiness.id, employees, session.user.accessToken);
        setWorkSchedules(schedules);
      } catch (err) {
        setWorkSchedulesError(err instanceof Error ? err.message : 'Failed to fetch schedules');
      } finally {
        setWorkSchedulesLoading(false);
      }
    };
    fetchSchedules();
  }, [selectedBusiness, employees]);

  const handleAddSchedule = () => {
    setEditSchedule(null);
    setScheduleForm({
      barber_id: '',
      start_date: '',
      end_date: '',
      repeat_frequency: 'none',
    });
    setScheduleDialogOpen(true);
  };

  const handleEditSchedule = (row: WorkSchedule) => {
    setEditSchedule(row);
    setScheduleForm({
      barber_id: String(row.barber_id),
      start_date: row.start_date.slice(0, 16), // 'YYYY-MM-DDTHH:mm'
      end_date: row.end_date.slice(0, 16),
      repeat_frequency: row.repeat_frequency,
    });
    setScheduleDialogOpen(true);
  };

  const handleDeleteSchedule = async (row: WorkSchedule) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      const session = await getSession();
      if (!session?.user?.accessToken) throw new Error('No access token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/barbers/${row.barber_id}/schedules/${row.id}/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Schedule deleted');
      // Refresh
      const schedules = await fetchAllWorkSchedules(selectedBusiness.id, employees, session.user.accessToken);
      setWorkSchedules(schedules);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete schedule');
    }
  };

  const handleScheduleFormSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.barber_id || !scheduleForm.start_date || !scheduleForm.end_date) {
      toast.error('All fields are required');
      return;
    }
    try {
      const session = await getSession();
      if (!session?.user?.accessToken) throw new Error('No access token');
      const isEdit = !!editSchedule;
      const url = `${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${selectedBusiness.id}/barbers/${scheduleForm.barber_id}/schedules/${isEdit ? editSchedule?.id + '/' : ''}`;
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        barber_id: Number(scheduleForm.barber_id),
        start_date: new Date(scheduleForm.start_date).toISOString(),
        end_date: new Date(scheduleForm.end_date).toISOString(),
        repeat_frequency: scheduleForm.repeat_frequency,
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to ${isEdit ? 'update' : 'create'} schedule`);
      }
      toast.success(isEdit ? 'Schedule updated' : 'Schedule created');
      // Refresh
      const schedules = await fetchAllWorkSchedules(selectedBusiness.id, employees, session.user.accessToken);
      setWorkSchedules(schedules);
      setScheduleDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save schedule');
    }
  };

  const scheduleColumns: GridColDef[] = [
    { field: 'barber_name', headerName: 'Employee Name', width: 180 },
    { field: 'start_date', headerName: 'Start Date/Time', width: 180, valueFormatter: ({ value }) => new Date(value).toLocaleString() },
    { field: 'end_date', headerName: 'End Date/Time', width: 180, valueFormatter: ({ value }) => new Date(value).toLocaleString() },
    { field: 'repeat_frequency', headerName: 'Repeat', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEditSchedule(params.row)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDeleteSchedule(params.row)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </Box>
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
          <Button onClick={handleAdd} sx={{ minWidth: 140, fontWeight: 600 }}>
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
              Services for {selectedBusiness.name}
            </Typography>
            <ServiceList
              selectedBusiness={selectedBusiness}
              services={services}
              onAdd={handleServiceAdd}
              onEdit={handleServiceEdit}
              onDelete={handleServiceDelete}
              onDialogSubmit={handleServiceDialogSubmit}
            />
          </Box>

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

          {/* Step 4: Work Schedules Section */}
          {selectedBusiness && (
            <Box p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
              <Typography variant="h6" fontWeight={600} mb={2} sx={{ fontSize: { xs: 18, md: 22 } }}>
                Work Schedules for {selectedBusiness.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: 18, md: 20 } }}>
                  Work Schedules Management
                </Typography>
                <Button className="min-w-[140px] font-semibold" onClick={handleAddSchedule}>
                  <Plus className="h-4 w-4 mr-2" /> Add Schedule
                </Button>
              </Box>
              <Box border={1} borderColor="divider" borderRadius={2} p={2} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                {workSchedulesLoading ? (
                  <Typography>Loading schedules...</Typography>
                ) : workSchedulesError ? (
                  <Typography color="error">{workSchedulesError}</Typography>
                ) : (
                  <DataGrid
                    rows={workSchedules}
                    columns={scheduleColumns}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 5 } },
                    }}
                    autoHeight
                    disableRowSelectionOnClick
                    sx={{
                      minWidth: 600,
                      bgcolor: 'background.default',
                      borderRadius: 2,
                      '& .MuiDataGrid-cell': {
                        borderColor: 'divider',
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'background.default',
                        borderColor: 'divider',
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
        </>
      )}
      <BusinessDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleDialogSubmit} initialData={editData} />
      {/* Add/Edit Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editSchedule ? 'Edit Work Hours' : 'Add Work Hours'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleFormSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <select
                value={scheduleForm.barber_id}
                onChange={e => setScheduleForm(f => ({ ...f, barber_id: e.target.value }))}
                required
                className="w-full rounded border px-3 py-2"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date/Time</label>
              <input
                type="datetime-local"
                value={scheduleForm.start_date}
                onChange={e => setScheduleForm(f => ({ ...f, start_date: e.target.value }))}
                required
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date/Time</label>
              <input
                type="datetime-local"
                value={scheduleForm.end_date}
                onChange={e => setScheduleForm(f => ({ ...f, end_date: e.target.value }))}
                required
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Repeat</label>
              <select
                value={scheduleForm.repeat_frequency}
                onChange={e => setScheduleForm(f => ({ ...f, repeat_frequency: e.target.value }))}
                required
                className="w-full rounded border px-3 py-2"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekly_no_weekends">Weekly (No Weekends)</option>
              </select>
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white text-gray-700 py-3 px-6 text-base font-semibold hover:bg-gray-100 transition-colors"
                onClick={() => setScheduleDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#0B1120] text-white py-3 px-6 text-base font-semibold hover:bg-[#1a2233] transition-colors"
              >
                {editSchedule ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 