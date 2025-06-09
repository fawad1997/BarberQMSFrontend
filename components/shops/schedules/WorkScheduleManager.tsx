import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Collapse,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';
import { getSession } from 'next-auth/react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { getShops } from '@/lib/services/shopService';

interface WorkSchedule {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  breaks: ScheduleBreak[];
  barber_id: number;
  day_of_week: number[];
  effective_start_date: string;
  effective_end_date: string;
}

interface ScheduleBreak {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface EmployeeSchedule {
  id: number;
  barber_id: number;
  barber_name: string;
  schedule_id: number;
  effective_start_date: string;
  effective_end_date: string;
}

interface ScheduleOverride {
  id: number;
  barber_id: number;
  barber_name: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface WorkScheduleManagerProps {
  shopId: number;
}

interface ScheduleForm {
  name: string;
  day_of_week: number[];
  start_time: string;
  end_time: string;
  effective_start_date: string;
  effective_end_date: string;
  breaks: { break_start: string; break_end: string }[];
}

const WorkScheduleManager: React.FC<WorkScheduleManagerProps> = ({ shopId }) => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openBreakModal, setOpenBreakModal] = useState(false);
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openOverrideModal, setOpenOverrideModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [selectedBreak, setSelectedBreak] = useState<ScheduleBreak | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);

  // Form states
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    name: '',
    day_of_week: [],
    start_time: '',
    end_time: '',
    effective_start_date: '',
    effective_end_date: '',
    breaks: [],
  });

  const [breakForm, setBreakForm] = useState({
    name: '',
    start_time: '',
    end_time: '',
    is_active: true,
  });

  const [assignmentForm, setAssignmentForm] = useState({
    barber_id: '',
    effective_start_date: null as Date | null,
    effective_end_date: null as Date | null,
  });

  const [overrideForm, setOverrideForm] = useState({
    barber_id: '',
    shop_id: shopId,
    start_date: null as Date | null,
    end_date: null as Date | null,
    repeat_frequency: '' as string | null,
  });

  // Add state for barbers
  const [barbers, setBarbers] = useState<{ id: number; name?: string; full_name?: string }[]>([]);

  // Add state for selected employee and their schedules
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [employeeSchedules, setEmployeeSchedules] = useState<{ employee_id: number; work_schedule_id: number }[]>([]);

  // Add state for schedule overrides
  const [overrides, setOverrides] = useState<any[]>([]);

  const [overrideFilters, setOverrideFilters] = useState({
    barber_id: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
  });

  const [selectedOverride, setSelectedOverride] = useState<any | null>(null);
  const [editOverrideForm, setEditOverrideForm] = useState({
    barber_id: '',
    shop_id: shopId,
    start_date: null as Date | null,
    end_date: null as Date | null,
    repeat_frequency: '' as string | null,
  });
  const [openEditOverrideModal, setOpenEditOverrideModal] = useState(false);

  const [allShops, setAllShops] = useState<any[]>([]);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'start_time', headerName: 'Start Time', width: 130 },
    { field: 'end_time', headerName: 'End Time', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => handleEditSchedule(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDeleteSchedule(params.row.id)}>
            <DeleteIcon />
          </IconButton>
          <IconButton
            onClick={() => handleExpandSchedule(params.row.id)}
            sx={{
              transition: 'transform 0.2s',
              transform: expandedSchedule === params.row.id ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
          <IconButton onClick={async () => await handleOpenAssignmentModal(params.row)}>
            <PersonAddIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const breakColumns: GridColDef[] = [
    { field: 'break_start', headerName: 'Break Start', width: 130 },
    { field: 'break_end', headerName: 'Break End', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: any) => (
        <Box>
          <IconButton onClick={() => handleEditBreak(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDeleteBreak(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const employeeScheduleColumns = [
    { field: 'employee_id', headerName: 'Employee ID', width: 150 },
    { field: 'work_schedule_id', headerName: 'Work Schedule ID', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: any) => (
        <Button
          color="error"
          size="small"
          onClick={() => handleRemoveEmployeeSchedule(params.row.employee_id, params.row.work_schedule_id)}
        >
          Remove
        </Button>
      ),
    },
  ];

  useEffect(() => {
    fetchSchedules();
    fetchBarbers();
    fetchOverrides();
    // Fetch all shops for name lookup
    const fetchAllShops = async () => {
      try {
        const shops = await getShops();
        setAllShops(shops);
      } catch (e) {
        setAllShops([]);
      }
    };
    fetchAllShops();
  }, []);

  const fetchSchedules = async () => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/work-schedules/${shopId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarbers = async () => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-owners/shops/${shopId}/barbers/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBarbers(data);
      }
    } catch (error) {
      console.error('Error fetching barbers:', error);
    }
  };

  const fetchOverrides = async () => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const params: URLSearchParams = new URLSearchParams();
      params.append('shop_id', shopId.toString());
      if (overrideFilters.barber_id) params.append('barber_id', overrideFilters.barber_id);
      if (overrideFilters.start_date) params.append('start_date', overrideFilters.start_date.toISOString());
      if (overrideFilters.end_date) params.append('end_date', overrideFilters.end_date.toISOString());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/overrides?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error('Error fetching overrides:', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;

      const payload = {
        name: scheduleForm.name,
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        effective_start_date: scheduleForm.effective_start_date,
        effective_end_date: scheduleForm.effective_end_date,
        shop_id: shopId,
        breaks: scheduleForm.breaks,
      };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/work-schedules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setOpenScheduleModal(false);
        fetchSchedules();
      } else {
        const error = await response.json();
        console.error('Error creating schedule:', error);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleCreateBreak = async () => {
    if (!selectedSchedule) return;
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/work-schedules/${selectedSchedule.id}/breaks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          break_start: breakForm.start_time,
          break_end: breakForm.end_time,
        }),
      });
      if (response.ok) {
        setOpenBreakModal(false);
        fetchSchedules();
      } else {
        const error = await response.json();
        console.error('Error creating break:', error);
      }
    } catch (error) {
      console.error('Error creating break:', error);
    }
  };

  const handleAssignSchedule = async () => {
    if (!selectedSchedule) return;
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/employee-schedules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: assignmentForm.barber_id,
          work_schedule_id: selectedSchedule.id,
        }),
      });
      if (response.ok) {
        setOpenAssignmentModal(false);
        fetchSchedules();
      } else {
        const error = await response.json();
        console.error('Error assigning schedule:', error);
      }
    } catch (error) {
      console.error('Error assigning schedule:', error);
    }
  };

  const handleCreateOverride = async () => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          barber_id: overrideForm.barber_id,
          shop_id: shopId,
          start_date: overrideForm.start_date ? overrideForm.start_date.toISOString() : null,
          end_date: overrideForm.end_date ? overrideForm.end_date.toISOString() : null,
          repeat_frequency: overrideForm.repeat_frequency === '' ? null : overrideForm.repeat_frequency,
        }),
      });
      if (response.ok) {
        setOpenOverrideModal(false);
        fetchSchedules();
        fetchOverrides();
      } else {
        const error = await response.json();
        console.error('Error creating override:', error);
      }
    } catch (error) {
      console.error('Error creating override:', error);
    }
  };

  const handleEditSchedule = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setScheduleForm({
      name: schedule.name,
      day_of_week: schedule.day_of_week || [],
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      effective_start_date: schedule.effective_start_date || '',
      effective_end_date: schedule.effective_end_date || '',
      breaks: schedule.breaks.map(b => ({ break_start: b.start_time, break_end: b.end_time })),
    });
    setOpenScheduleModal(true);
  };

  const handleEditBreak = (break_: ScheduleBreak) => {
    setSelectedBreak(break_);
    setBreakForm({
      name: break_.name,
      start_time: break_.start_time,
      end_time: break_.end_time,
      is_active: break_.is_active,
    });
    setOpenBreakModal(true);
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/work-schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        fetchSchedules();
      } else {
        const error = await response.json();
        console.error('Error deleting schedule:', error);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleDeleteBreak = async (id: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/breaks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        fetchSchedules();
      } else {
        const error = await response.json();
        console.error('Error deleting break:', error);
      }
    } catch (error) {
      console.error('Error deleting break:', error);
    }
  };

  const fetchScheduleBreaks = async (scheduleId: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/work-schedules/${scheduleId}/breaks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const breaks = await response.json();
        return breaks;
      }
    } catch (error) {
      console.error('Error fetching schedule breaks:', error);
    }
    return [];
  };

  const handleExpandSchedule = (id: number) => {
    setExpandedSchedule(expandedSchedule === id ? null : id);
  };

  const handleUpdateSchedule = async (scheduleId: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const payload = {
        name: scheduleForm.name,
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        effective_start_date: scheduleForm.effective_start_date,
        effective_end_date: scheduleForm.effective_end_date,
      };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/work-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setOpenScheduleModal(false);
        fetchSchedules();
      } else {
        const error = await response.json();
        console.error('Error updating schedule:', error);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleUpdateBreak = async (breakId: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/breaks/${breakId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          break_start: breakForm.start_time,
          break_end: breakForm.end_time,
        }),
      });
      if (response.ok) {
        setOpenBreakModal(false);
        fetchSchedules();
      } else {
        const error = await response.json();
        console.error('Error updating break:', error);
      }
    } catch (error) {
      console.error('Error updating break:', error);
    }
  };

  // Add a function to open the assignment modal and fetch employees
  const handleOpenAssignmentModal = async (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    await fetchBarbers();
    setOpenAssignmentModal(true);
  };

  const fetchEmployeeSchedules = async (employeeId: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/employee-schedules/${employeeId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEmployeeSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching employee schedules:', error);
    }
  };

  const handleRemoveEmployeeSchedule = async (employeeId: number, scheduleId: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/employee-schedules/${employeeId}/${scheduleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        fetchEmployeeSchedules(employeeId); // Refresh the table
      } else {
        const error = await response.json();
        console.error('Error removing employee schedule:', error);
      }
    } catch (error) {
      console.error('Error removing employee schedule:', error);
    }
  };

  const handleEditOverride = (override: any) => {
    setSelectedOverride(override);
    setEditOverrideForm({
      barber_id: override.barber_id,
      shop_id: override.shop_id,
      start_date: override.start_date ? new Date(override.start_date) : null,
      end_date: override.end_date ? new Date(override.end_date) : null,
      repeat_frequency: override.repeat_frequency ?? '',
    });
    setOpenEditOverrideModal(true);
  };

  const handleUpdateOverride = async () => {
    if (!selectedOverride) return;
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/overrides/${selectedOverride.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            barber_id: editOverrideForm.barber_id,
            shop_id: shopId,
            start_date: editOverrideForm.start_date ? editOverrideForm.start_date.toISOString() : null,
            end_date: editOverrideForm.end_date ? editOverrideForm.end_date.toISOString() : null,
            repeat_frequency: editOverrideForm.repeat_frequency === '' ? null : editOverrideForm.repeat_frequency,
          }),
        }
      );
      if (response.ok) {
        setOpenEditOverrideModal(false);
        fetchOverrides();
      } else {
        const error = await response.json();
        console.error('Error updating override:', error);
      }
    } catch (error) {
      console.error('Error updating override:', error);
    }
  };

  const handleDeleteOverride = async (overrideId: number) => {
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/overrides/${overrideId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        fetchOverrides(); // Refresh the table
      } else {
        const error = await response.json();
        console.error('Error deleting override:', error);
      }
    } catch (error) {
      console.error('Error deleting override:', error);
    }
  };

  return (
    <Box>
      {/* Work Schedules Section */}
      <Box p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2} sx={{ fontSize: { xs: 18, md: 22 } }}>
            Work Schedules
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedSchedule(null);
              setScheduleForm({
                name: '',
                day_of_week: [],
                start_time: '',
                end_time: '',
                effective_start_date: '',
                effective_end_date: '',
                breaks: [],
              });
              setOpenScheduleModal(true);
            }}
            sx={{ minWidth: 140, fontWeight: 600 }}
          >
            Add Schedule
          </Button>
        </Box>
        <DataGrid
          rows={schedules}
          columns={columns}
          loading={loading}
          autoHeight
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.default', borderRadius: 2 }}
        />
        {schedules.map((schedule) => (
          <Collapse
            key={schedule.id}
            in={expandedSchedule === schedule.id}
            sx={{ mt: 2 }}
          >
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Breaks for {schedule.name}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedSchedule(schedule);
                    setSelectedBreak(null);
                    setBreakForm({
                      name: '',
                      start_time: '',
                      end_time: '',
                      is_active: true,
                    });
                    setOpenBreakModal(true);
                  }}
                >
                  Add Break
                </Button>
              </Box>
              <DataGrid
                rows={schedule.breaks}
                columns={breakColumns}
                autoHeight
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 5, page: 0 },
                  },
                }}
                pageSizeOptions={[5]}
                disableRowSelectionOnClick
                sx={{ bgcolor: 'background.default', borderRadius: 2 }}
              />
            </Box>
          </Collapse>
        ))}
      </Box>

      {/* Employee Schedules Section */}
      <Box p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2} sx={{ fontSize: { xs: 18, md: 22 } }}>
          Employee Schedules
        </Typography>
        <DataGrid
          rows={barbers.map((barber) => ({
            id: barber.id,
            name: barber.full_name || barber.name,
          }))}
          columns={[
            { field: 'name', headerName: 'Employee Name', flex: 1 },
            {
              field: 'showSchedule',
              headerName: 'View Schedule',
              width: 180,
              renderCell: (params: any) => {
                const isShown = selectedEmployee === params.row.id;
                return (
                  <Button
                    size="small"
                    onClick={() => {
                      if (isShown) {
                        setSelectedEmployee(null);
                      } else {
                        setSelectedEmployee(params.row.id);
                        fetchEmployeeSchedules(params.row.id);
                      }
                    }}
                  >
                    {isShown ? 'Hide Schedule' : 'Show Schedule'}
                  </Button>
                );
              },
            },
          ]}
          autoHeight
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.default', borderRadius: 2 }}
        />
        {selectedEmployee && (
          <Box mt={2}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Employee Schedules
            </Typography>
            <DataGrid
              rows={employeeSchedules.map((s, idx) => ({
                id: idx,
                ...s,
                employee_name: barbers.find(b => b.id === s.employee_id)?.full_name ||
                  barbers.find(b => b.id === s.employee_id)?.name ||
                  s.employee_id,
                work_schedule_name: schedules.find(ws => ws.id === s.work_schedule_id)?.name || s.work_schedule_id,
              }))}
              columns={[
                { field: 'employee_name', headerName: 'Employee Name', width: 200 },
                { field: 'work_schedule_name', headerName: 'Work Schedule Name', width: 200 },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 120,
                  renderCell: (params: any) => (
                    <Button
                      color="error"
                      size="small"
                      onClick={() => handleRemoveEmployeeSchedule(params.row.employee_id, params.row.work_schedule_id)}
                    >
                      Remove
                    </Button>
                  ),
                },
              ]}
              autoHeight
              pageSizeOptions={[5]}
              disableRowSelectionOnClick
              sx={{ bgcolor: 'background.default', borderRadius: 2 }}
            />
          </Box>
        )}
      </Box>

      {/* Schedule Overrides Section */}
      <Box p={3} border={1} borderColor="divider" borderRadius={2} sx={{ bgcolor: 'background.paper', boxShadow: 1, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: 18, md: 22 } }}>
            Schedule Overrides
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenOverrideModal(true)}
            sx={{ minWidth: 180, fontWeight: 600 }}
          >
            Create Schedule Override
          </Button>
        </Box>
        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl>
            <InputLabel>Employee</InputLabel>
            <Select
              value={overrideFilters.barber_id}
              onChange={e => setOverrideFilters(f => ({ ...f, barber_id: e.target.value }))}
              style={{ minWidth: 120 }}
            >
              <MenuItem value="">All</MenuItem>
              {barbers.map(barber => (
                <MenuItem key={barber.id} value={barber.id}>{barber.full_name || barber.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={overrideFilters.start_date}
              onChange={date => setOverrideFilters(f => ({ ...f, start_date: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={overrideFilters.end_date}
              onChange={date => setOverrideFilters(f => ({ ...f, end_date: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
          <Button variant="outlined" onClick={fetchOverrides} sx={{ fontWeight: 600 }}>
            Apply Filters
          </Button>
        </Box>
        <DataGrid
          rows={overrides.map((o, idx) => {
            const barber = barbers.find(b => b.id === o.barber_id);
            const employee_name = barber?.full_name || barber?.name || o.barber_id;
            const shop = allShops.find(s => s.id === o.shop_id);
            const business_name = shop?.name || o.shop_id;
            return {
              id: idx,
              ...o,
              employee_name,
              business_name,
            };
          })}
          columns={[
            { field: 'employee_name', headerName: 'Employee Name', width: 180 },
            { field: 'business_name', headerName: 'Business Name', width: 180 },
            { field: 'start_date', headerName: 'Start Date', width: 200 },
            { field: 'end_date', headerName: 'End Date', width: 200 },
            { field: 'repeat_frequency', headerName: 'Repeat Frequency', width: 180 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 120,
              renderCell: (params: any) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEditOverride(params.row)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteOverride(params.row.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]}
          autoHeight
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.default', borderRadius: 2 }}
        />
      </Box>

      {/* Schedule Modal */}
      <Dialog open={openScheduleModal} onClose={() => setOpenScheduleModal(false)}>
        <DialogTitle>
          {selectedSchedule ? 'Edit Schedule' : 'Create Schedule'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={scheduleForm.name}
            onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Day(s) of Week</InputLabel>
            <Select
              multiple
              value={scheduleForm.day_of_week}
              onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value as number[] })}
              renderValue={(selected) => (selected as number[]).map(i => DAYS_OF_WEEK[i]).join(', ')}
            >
              {DAYS_OF_WEEK.map((day, idx) => (
                <MenuItem key={idx} value={idx}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Effective Start Date"
              value={scheduleForm.effective_start_date ? new Date(scheduleForm.effective_start_date) : null}
              onChange={(date) => setScheduleForm({ ...scheduleForm, effective_start_date: date ? format(date, 'yyyy-MM-dd') : '' })}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
            <DatePicker
              label="Effective End Date"
              value={scheduleForm.effective_end_date ? new Date(scheduleForm.effective_end_date) : null}
              onChange={(date) => setScheduleForm({ ...scheduleForm, effective_end_date: date ? format(date, 'yyyy-MM-dd') : '' })}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="Start Time"
              value={scheduleForm.start_time ? parse(scheduleForm.start_time, 'HH:mm:ss.SSS', new Date()) : null}
              onChange={(newValue) => {
                setScheduleForm({
                  ...scheduleForm,
                  start_time: newValue ? format(newValue, 'HH:mm:ss.SSS') : '',
                });
              }}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
            <TimePicker
              label="End Time"
              value={scheduleForm.end_time ? parse(scheduleForm.end_time, 'HH:mm:ss.SSS', new Date()) : null}
              onChange={(newValue) => {
                setScheduleForm({
                  ...scheduleForm,
                  end_time: newValue ? format(newValue, 'HH:mm:ss.SSS') : '',
                });
              }}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
          </LocalizationProvider>
          <Box mt={2}>
            <Typography variant="subtitle1">Breaks</Typography>
            {scheduleForm.breaks.map((brk, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={2} mb={1}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Break Start"
                    value={brk.break_start ? parse(brk.break_start, 'HH:mm:ss.SSS', new Date()) : null}
                    onChange={(newValue) => {
                      const newBreaks = [...scheduleForm.breaks];
                      newBreaks[idx].break_start = newValue ? format(newValue, 'HH:mm:ss.SSS') : '';
                      setScheduleForm({ ...scheduleForm, breaks: newBreaks });
                    }}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <TimePicker
                    label="Break End"
                    value={brk.break_end ? parse(brk.break_end, 'HH:mm:ss.SSS', new Date()) : null}
                    onChange={(newValue) => {
                      const newBreaks = [...scheduleForm.breaks];
                      newBreaks[idx].break_end = newValue ? format(newValue, 'HH:mm:ss.SSS') : '';
                      setScheduleForm({ ...scheduleForm, breaks: newBreaks });
                    }}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </LocalizationProvider>
                <IconButton onClick={() => {
                  setScheduleForm({
                    ...scheduleForm,
                    breaks: scheduleForm.breaks.filter((_, i) => i !== idx),
                  });
                }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setScheduleForm({
                ...scheduleForm,
                breaks: [...scheduleForm.breaks, { break_start: '', break_end: '' }],
              })}
              sx={{ mt: 1 }}
            >
              Add Break
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScheduleModal(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedSchedule) {
                handleUpdateSchedule(selectedSchedule.id);
              } else {
                handleCreateSchedule();
              }
            }}
            variant="contained"
          >
            {selectedSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Break Modal */}
      <Dialog open={openBreakModal} onClose={() => setOpenBreakModal(false)}>
        <DialogTitle>
          {selectedBreak ? 'Edit Break' : 'Create Break'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={breakForm.name}
            onChange={(e) => setBreakForm({ ...breakForm, name: e.target.value })}
            margin="normal"
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="Start Time"
              value={breakForm.start_time ? parse(breakForm.start_time, 'HH:mm', new Date()) : null}
              onChange={(newValue) => {
                if (newValue) {
                  setBreakForm({
                    ...breakForm,
                    start_time: format(newValue, 'HH:mm'),
                  });
                }
              }}
            />
            <TimePicker
              label="End Time"
              value={breakForm.end_time ? parse(breakForm.end_time, 'HH:mm', new Date()) : null}
              onChange={(newValue) => {
                if (newValue) {
                  setBreakForm({
                    ...breakForm,
                    end_time: format(newValue, 'HH:mm'),
                  });
                }
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBreakModal(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedBreak) {
                handleUpdateBreak(selectedBreak.id);
              } else {
                handleCreateBreak();
              }
            }}
            variant="contained"
          >
            {selectedBreak ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={openAssignmentModal} onClose={() => setOpenAssignmentModal(false)}>
        <DialogTitle>Assign Schedule to Barber</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Barber</InputLabel>
            <Select
              value={assignmentForm.barber_id}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, barber_id: e.target.value })}
            >
              {barbers.map((barber) => (
                <MenuItem key={barber.id} value={barber.id}>{barber.full_name || barber.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={assignmentForm.effective_start_date}
              onChange={(newValue: Date | null) => {
                setAssignmentForm({
                  ...assignmentForm,
                  effective_start_date: newValue,
                });
              }}
            />
            <DatePicker
              label="End Date"
              value={assignmentForm.effective_end_date}
              onChange={(newValue: Date | null) => {
                setAssignmentForm({
                  ...assignmentForm,
                  effective_end_date: newValue,
                });
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignmentModal(false)}>Cancel</Button>
          <Button onClick={handleAssignSchedule} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Override Modal */}
      <Dialog open={openOverrideModal} onClose={() => setOpenOverrideModal(false)}>
        <DialogTitle>Create Schedule Override</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Barber</InputLabel>
            <Select
              value={overrideForm.barber_id}
              onChange={(e) => setOverrideForm({ ...overrideForm, barber_id: e.target.value })}
            >
              {barbers.map((barber) => (
                <MenuItem key={barber.id} value={barber.id}>{barber.full_name || barber.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Date"
              value={overrideForm.start_date}
              onChange={(newValue) => setOverrideForm({ ...overrideForm, start_date: newValue })}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
            <DateTimePicker
              label="End Date"
              value={overrideForm.end_date}
              onChange={(newValue) => setOverrideForm({ ...overrideForm, end_date: newValue })}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
          </LocalizationProvider>
          {/* Repeat Frequency Dropdown */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Repeat Frequency</InputLabel>
            <Select
              value={overrideForm.repeat_frequency ?? ''}
              label="Repeat Frequency"
              onChange={(e) => setOverrideForm({ ...overrideForm, repeat_frequency: e.target.value as string })}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
              <MenuItem value="">None</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOverrideModal(false)}>Cancel</Button>
          <Button onClick={handleCreateOverride} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Override Modal */}
      <Dialog open={openEditOverrideModal} onClose={() => setOpenEditOverrideModal(false)}>
        <DialogTitle>Edit Schedule Override</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Barber</InputLabel>
            <Select
              value={editOverrideForm.barber_id}
              onChange={(e) => setEditOverrideForm({ ...editOverrideForm, barber_id: e.target.value })}
            >
              {barbers.map((barber) => (
                <MenuItem key={barber.id} value={barber.id}>{barber.full_name || barber.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Date"
              value={editOverrideForm.start_date}
              onChange={(newValue) => setEditOverrideForm({ ...editOverrideForm, start_date: newValue })}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
            <DateTimePicker
              label="End Date"
              value={editOverrideForm.end_date}
              onChange={(newValue) => setEditOverrideForm({ ...editOverrideForm, end_date: newValue })}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
          </LocalizationProvider>
          {/* Repeat Frequency Dropdown */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Repeat Frequency</InputLabel>
            <Select
              value={editOverrideForm.repeat_frequency ?? ''}
              label="Repeat Frequency"
              onChange={(e) => setEditOverrideForm({ ...editOverrideForm, repeat_frequency: e.target.value as string })}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
              <MenuItem value="">None</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditOverrideModal(false)}>Cancel</Button>
          <Button onClick={handleUpdateOverride} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkScheduleManager; 