import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlockedTime {
  id: string;
  barber_id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlockedTimeData {
  barber_id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_by: string;
}

export const useBlockedTimes = (barberId?: string, date?: string) => {
  return useQuery({
    queryKey: ['blocked-times', barberId, date],
    queryFn: async () => {
      let query = supabase
        .from('blocked_times')
        .select('*')
        .order('blocked_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (barberId) {
        query = query.eq('barber_id', barberId);
      }

      if (date) {
        query = query.eq('blocked_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlockedTime[];
    },
    enabled: !!barberId || !!date,
  });
};

export const useCreateBlockedTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBlockedTimeData) => {
      const { data: blockedTime, error } = await supabase
        .from('blocked_times')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return blockedTime;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-times'] });
      queryClient.invalidateQueries({ queryKey: ['available-time-slots'] });
      toast.success('Horário bloqueado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao bloquear horário:', error);
      toast.error('Erro ao bloquear horário');
    },
  });
};

export const useDeleteBlockedTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-times'] });
      queryClient.invalidateQueries({ queryKey: ['available-time-slots'] });
      toast.success('Horário liberado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao liberar horário:', error);
      toast.error('Erro ao liberar horário');
    },
  });
};
