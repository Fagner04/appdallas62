import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTodayBrasilia, getBrasiliaDate } from '@/lib/timezone';

export interface Appointment {
  id: string;
  customer_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  customer: { name: string; phone?: string } | null;
  service: { name: string; duration: number; price: number } | null;
  barber: { id: string; name?: string } | null;
}

export interface CreateAppointmentData {
  customer_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  customer_id?: string;
  barber_id?: string;
  service_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

// Get all appointments with filters
export const useAppointments = (date?: string) => {
  return useQuery({
    queryKey: ['appointments', date],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(name, phone),
          service:services(name, duration, price),
          barber:barbers(id, name)
        `)
        .order('appointment_time', { ascending: true });

      if (date) {
        query = query.eq('appointment_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AppointmentWithDetails[];
    },
  });
};

// Get available time slots for a specific date and barber
export const useAvailableTimeSlots = (date: string, barberId: string, serviceDuration: number) => {
  return useQuery({
    queryKey: ['available-time-slots', date, barberId, serviceDuration],
    queryFn: async () => {
      // Fetch existing appointments for the barber on this date
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, service_id')
        .eq('barber_id', barberId)
        .eq('appointment_date', date)
        .neq('status', 'cancelled');

      if (appointmentsError) throw appointmentsError;

      // Fetch blocked times for the barber on this date
      const { data: blockedTimes, error: blockedError } = await supabase
        .from('blocked_times')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('blocked_date', date);

      if (blockedError) throw blockedError;

      // Fetch service durations for existing appointments
      const serviceIds = appointments?.map(apt => apt.service_id) || [];
      const { data: services } = await supabase
        .from('services')
        .select('id, duration')
        .in('id', serviceIds);

      // Define working hours (8:00 AM to 8:00 PM)
      const workStart = 8 * 60; // 8:00 AM in minutes
      const workEnd = 20 * 60;  // 8:00 PM in minutes
      const slotDuration = 30;  // 30 minutes per slot

      // Create all possible time slots
      const allSlots: string[] = [];
      for (let time = workStart; time < workEnd; time += slotDuration) {
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        allSlots.push(timeString);
      }

      // Helper function to convert time string to minutes
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // Get current time in Brasilia timezone
      const todayString = getTodayBrasilia();
      const isToday = date === todayString;
      const currentTimeInMinutes = isToday 
        ? (() => {
            const now = getBrasiliaDate();
            return now.getHours() * 60 + now.getMinutes();
          })()
        : 0;

      // Filter out occupied slots
      const availableSlots = allSlots.filter(slot => {
        const slotStart = timeToMinutes(slot);
        const slotEnd = slotStart + serviceDuration;

        // Se for hoje, não mostrar horários que já passaram
        if (isToday && slotStart <= currentTimeInMinutes) {
          return false;
        }

        // Check if slot overlaps with existing appointments
        const hasAppointmentConflict = appointments?.some(apt => {
          const aptStart = timeToMinutes(apt.appointment_time);
          const service = services?.find(s => s.id === apt.service_id);
          const aptEnd = aptStart + (service?.duration || 30);
          
          // Check if there's any overlap
          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        // Check if slot overlaps with blocked times
        const hasBlockedConflict = blockedTimes?.some(blocked => {
          const blockedStart = timeToMinutes(blocked.start_time);
          const blockedEnd = timeToMinutes(blocked.end_time);
          
          // Check if there's any overlap
          return (slotStart < blockedEnd && slotEnd > blockedStart);
        });

        return !hasAppointmentConflict && !hasBlockedConflict;
      });

      return availableSlots;
    },
    enabled: !!date && !!barberId && !!serviceDuration,
  });
};

// Create appointment
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-time-slots'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['customer-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    },
  });
};

// Update appointment
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentData }) => {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    },
  });
};

// Delete appointment
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Agendamento excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
    },
  });
};
