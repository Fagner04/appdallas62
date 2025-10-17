import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
  loyalty_coupons?: { id: string; code: string; is_redeemed: boolean }[];
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
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['appointments', date] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, queryClient]);

  return useQuery({
    queryKey: ['appointments', date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Try to get barbershop_id (as owner or as barber)
      let barbershopId: string | null = null;

      // First try as owner
      const { data: ownedBarbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedBarbershop) {
        barbershopId = ownedBarbershop.id;
      } else {
        // If not owner, try as barber
        const { data: barber } = await supabase
          .from('barbers')
          .select('barbershop_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (barber?.barbershop_id) {
          barbershopId = barber.barbershop_id;
        }
      }

      if (!barbershopId) return [];

      let query = supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(name, phone),
          service:services(name, duration, price),
          barber:barbers(id, name),
          loyalty_coupons!loyalty_coupons_redeemed_appointment_id_fkey(id, code, is_redeemed)
        `)
        .eq('barbershop_id', barbershopId)
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

      // Fetch barber's barbershop to get working hours
      const { data: barber } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('id', barberId)
        .single();

      if (!barber?.barbershop_id) {
        console.warn('Barber has no barbershop');
        return [];
      }

      // Fetch working hours for the day of week
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      
      const { data: workingHours, error: hoursError } = await supabase
        .from('working_hours' as any)
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('barbershop_id', barber.barbershop_id)
        .maybeSingle();

      if (hoursError) {
        console.error('Error fetching working hours:', hoursError);
      }

      // Se não há horários configurados, retornar vazio
      if (!workingHours) {
        console.warn('No working hours configured for day:', dayOfWeek);
        return [];
      }

      // Se o dia está fechado, retornar vazio
      if (!(workingHours as any).is_open) {
        return [];
      }

      // Usar horários configurados
      const [startHour, startMin] = (workingHours as any).start_time.split(':').map(Number);
      const [endHour, endMin] = (workingHours as any).end_time.split(':').map(Number);
      const workStart = startHour * 60 + startMin;
      const workEnd = endHour * 60 + endMin;

      // Fetch service durations for existing appointments
      const serviceIds = appointments?.map(apt => apt.service_id) || [];
      const { data: services } = await supabase
        .from('services')
        .select('id, duration')
        .in('id', serviceIds);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let barbershopId: string | null = null;

      // Primeiro tentar buscar como dono da barbearia
      const { data: ownedBarbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedBarbershop) {
        barbershopId = ownedBarbershop.id;
      } else {
        // Se não for dono, buscar como cliente
        const { data: customer } = await supabase
          .from('customers')
          .select('barbershop_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (customer?.barbershop_id) {
          barbershopId = customer.barbershop_id;
        } else {
          throw new Error('Barbearia não encontrada. Você não está associado a nenhuma barbearia.');
        }
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{ ...data, barbershop_id: barbershopId }])
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao criar agendamento:', error);
        throw error;
      }

      // Create notification for admin about new appointment
      const { data: customerData } = await supabase
        .from('customers')
        .select('name')
        .eq('id', data.customer_id)
        .maybeSingle();

      // Buscar admins e barbers da tabela user_roles
      const { data: admins, error: adminsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .or('role.eq.admin,role.eq.barber');

      console.log('Admins found:', admins, 'Error:', adminsError);

      // Se não encontrar na user_roles, buscar todos os barbeiros ativos
      let notificationUsers: { user_id: string }[] = admins || [];
      
      if (!notificationUsers.length && barbershopId) {
        const { data: barbers } = await supabase
          .from('barbers')
          .select('user_id')
          .eq('barbershop_id', barbershopId)
          .eq('is_active', true)
          .not('user_id', 'is', null);
        
        notificationUsers = barbers?.filter(b => b.user_id).map(b => ({ user_id: b.user_id! })) || [];
        console.log('Barbers found:', notificationUsers);
      }

      if (notificationUsers.length > 0 && customerData) {
        const notifications = notificationUsers.map(user => ({
          user_id: user.user_id,
          title: 'Novo Agendamento',
          message: `${customerData.name} criou um novo agendamento`,
          type: 'booking',
          related_id: appointment.id,
        }));

        console.log('Creating notifications:', notifications);
        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) console.error('Error creating notifications:', notifError);
      } else {
        console.warn('No admin/barber users found to notify');
      }

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-time-slots'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['customer-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error?.message || 'Erro ao criar agendamento');
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
        .select('*, customer:customers(name)')
        .single();

      if (error) throw error;

      // Verificar quem está fazendo a edição
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      let editorName = 'Um usuário';
      let isAdminEdit = false;

      if (currentUser) {
        // Verificar se o usuário atual é admin ou barber
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();

        if (userRole && (userRole.role === 'admin' || userRole.role === 'barber')) {
          isAdminEdit = true;
          // Buscar nome do barbeiro se for barber
          const { data: barberData } = await supabase
            .from('barbers')
            .select('name')
            .eq('user_id', currentUser.id)
            .single();
          
          editorName = barberData?.name || 'Administrador';
        } else {
          // É um cliente, usar o nome do cliente do agendamento
          const customerName = (appointment as any).customer?.name || 'Um cliente';
          editorName = customerName;
        }
      }

      // Notificar admins/barbeiros apenas quando cliente edita
      if (!isAdminEdit) {
        // Notificar admins/barbeiros quando cliente edita
        const { data: admins } = await supabase
          .from('user_roles')
          .select('user_id')
          .or('role.eq.admin,role.eq.barber');

        let notificationUsers: { user_id: string }[] = admins || [];
        
        if (!notificationUsers.length) {
          const { data: barbers } = await supabase
            .from('barbers')
            .select('user_id')
            .eq('is_active', true)
            .not('user_id', 'is', null);
          
          notificationUsers = barbers?.filter(b => b.user_id).map(b => ({ user_id: b.user_id! })) || [];
        }

        if (notificationUsers.length > 0 && appointment) {
          const actionType = data.status === 'cancelled' ? 'cancelou' : 'editou';
          
          const notifications = notificationUsers.map(user => ({
            user_id: user.user_id,
            title: data.status === 'cancelled' ? 'Agendamento Cancelado' : 'Agendamento Editado',
            message: `${editorName} ${actionType} um agendamento`,
            type: data.status === 'cancelled' ? 'cancellation' : 'update',
            related_id: id,
          }));

          await supabase.from('notifications').insert(notifications);
        }
      }

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
