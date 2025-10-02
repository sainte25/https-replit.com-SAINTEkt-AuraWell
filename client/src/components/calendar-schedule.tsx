import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type CalendarView = "week" | "month";

const sampleAppointments = [
  {
    id: "1",
    title: "Therapy Session",
    provider: "Dr. Sarah Chen",
    datetime: "2024-12-28T15:00:00Z",
    notes: "Weekly therapy session"
  },
  {
    id: "2",
    title: "Wellness Check-in",
    provider: "Alex Thompson (CHW)",
    datetime: "2024-12-26T10:00:00Z", 
    notes: "Monthly wellness check-in"
  }
];

export default function CalendarSchedule() {
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    provider: "",
    datetime: "",
    notes: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments"],
    select: (data) => data?.length ? data : sampleAppointments
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      closeAppointmentDialog();
      toast({
        title: "Appointment Created",
        description: "Your appointment has been scheduled.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Create Appointment",
        description: "Unable to create appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      closeAppointmentDialog();
      toast({
        title: "Appointment Updated",
        description: "Your appointment has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Update Appointment",
        description: "Unable to update appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/appointments/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Deleted",
        description: "Your appointment has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Delete Appointment",
        description: "Unable to delete appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openAppointmentDialog = (appointment?: any) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setAppointmentForm({
        title: appointment.title,
        provider: appointment.provider,
        datetime: new Date(appointment.datetime).toISOString().slice(0, 16),
        notes: appointment.notes || ""
      });
    } else {
      setEditingAppointment(null);
      setAppointmentForm({
        title: "",
        provider: "",
        datetime: "",
        notes: ""
      });
    }
    setAppointmentDialogOpen(true);
  };

  const closeAppointmentDialog = () => {
    setAppointmentDialogOpen(false);
    setEditingAppointment(null);
    setAppointmentForm({
      title: "",
      provider: "",
      datetime: "",
      notes: ""
    });
  };

  const saveAppointment = () => {
    if (!appointmentForm.title || !appointmentForm.provider || !appointmentForm.datetime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const appointmentData = {
      ...appointmentForm,
      datetime: new Date(appointmentForm.datetime).toISOString()
    };

    if (editingAppointment) {
      updateAppointmentMutation.mutate({ 
        id: editingAppointment.id, 
        data: appointmentData 
      });
    } else {
      createAppointmentMutation.mutate(appointmentData);
    }
  };

  const deleteAppointment = (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const isToday = date.toDateString() === new Date().toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (calendarView === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h2 className="text-title-1" style={{ color: 'var(--text-primary)' }}>Your Schedule</h2>
        <p className="text-callout" style={{ color: 'var(--text-tertiary)' }}>Appointments and wellness reminders</p>
      </div>

      {/* Calendar View Toggle */}
      <div className="glass-card p-2 rounded-2xl">
        <div className="flex">
          {["week", "month"].map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view as CalendarView)}
              className="flex-1 py-4 px-4 rounded-xl text-callout font-medium transition-all duration-300"
              style={calendarView === view ? {
                background: 'var(--glass-medium)',
                boxShadow: 'var(--glow-warm)',
                color: 'var(--text-primary)'
              } : {
                color: 'var(--text-tertiary)'
              }}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Calendar View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="glass-card p-3 rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h3 className="text-title-2" style={{ color: 'var(--text-primary)' }}>
            {calendarView === 'week' ? formatWeekRange(currentDate) : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => navigateDate('next')}
            className="glass-card p-3 rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 text-center text-caption mb-2" style={{ color: 'var(--text-secondary)' }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() - currentDate.getDay() + i);
            const isToday = date.toDateString() === new Date().toDateString();
            const hasAppointment = appointments.some((apt: any) => 
              new Date(apt.datetime).toDateString() === date.toDateString()
            );
            
            return (
              <div 
                key={i}
                className={`h-20 glass-card rounded-2xl p-2 text-center transition-all duration-300 ${
                  isToday ? 'border-2' : ''
                }`}
                style={isToday ? { borderColor: 'var(--rich-coral)' } : {}}
              >
                <div className={`text-callout ${isToday ? 'font-semibold' : ''}`} style={{
                  color: isToday ? 'var(--rich-coral)' : 'var(--text-tertiary)'
                }}>
                  {date.getDate()}
                </div>
                {hasAppointment && (
                  <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{ backgroundColor: 'var(--rich-coral)' }}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title-2" style={{ color: 'var(--text-primary)' }}>Upcoming</h3>
          <button
            onClick={() => openAppointmentDialog()}
            className="sunset-button px-4 py-2 rounded-2xl text-callout font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {appointments.map((appointment: any) => (
          <div key={appointment.id} className="glass-elevated p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-headline" style={{ color: 'var(--text-primary)' }}>{appointment.title}</h4>
                <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>{appointment.provider}</p>
                <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{formatDateTime(appointment.datetime)}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openAppointmentDialog(appointment)}
                  className="glass-card p-3 rounded-2xl transition-all duration-300 hover:scale-105"
                  style={{ color: 'var(--rich-coral)' }}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteAppointment(appointment.id)}
                  className="glass-card p-3 rounded-2xl transition-all duration-300 hover:scale-105"
                  style={{ color: 'var(--warm-peach)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reminder Notification */}
      <div className="glass-card p-6 rounded-3xl border" style={{ borderColor: 'var(--border-medium)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--rich-coral)' }}></div>
          <div className="flex-1">
            <p className="font-medium text-headline" style={{ color: 'var(--text-primary)' }}>Reminder</p>
            <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>You have a therapy session in 30 minutes</p>
          </div>
          <button className="text-callout font-medium px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 glass-card" 
                  style={{ color: 'var(--rich-coral)' }}>
            Dismiss
          </button>
        </div>
      </div>

      {/* Appointment Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="glassmorphic border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? "Edit Appointment" : "New Appointment"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Title *</label>
              <Input
                placeholder="Appointment title"
                value={appointmentForm.title}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-2">Provider *</label>
              <Input
                placeholder="Healthcare provider"
                value={appointmentForm.provider}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-2">Date & Time *</label>
              <Input
                type="datetime-local"
                value={appointmentForm.datetime}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, datetime: e.target.value }))}
                className="w-full bg-white/10 border-white/20 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-2">Notes</label>
              <Textarea
                placeholder="Additional notes..."
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-white/10 border-white/20 text-white placeholder-white/50"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={saveAppointment}
                disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/80"
              >
                {(createAppointmentMutation.isPending || updateAppointmentMutation.isPending) 
                  ? "Saving..." 
                  : editingAppointment 
                    ? "Update Appointment" 
                    : "Create Appointment"
                }
              </Button>
              <Button
                onClick={closeAppointmentDialog}
                variant="ghost"
                className="text-white/70 hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
