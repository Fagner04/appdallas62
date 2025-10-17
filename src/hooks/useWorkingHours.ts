import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkingHours {
  id: string;
  day_of_week: number; // 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
  is_open: boolean;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkingHoursData {
  day_of_week: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

export const useWorkingHours = () => {
  return useQuery({
    queryKey: ['working-hours'],
    queryFn: async () => {
      // Buscar barbershop_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const { data, error } = await supabase
        .from('working_hours' as any)
        .select('*')
        .eq('barbershop_id', barbershop.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return (data as unknown) as WorkingHours[];
    },
  });
};

export const useUpdateWorkingHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workingHours: UpdateWorkingHoursData[]) => {
      // Buscar barbershop_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) throw new Error('Barbearia não encontrada');

      // Atualizar ou inserir cada horário
      const promises = workingHours.map(async (hours) => {
        const { data: existing } = await supabase
          .from('working_hours' as any)
          .select('id')
          .eq('day_of_week', hours.day_of_week)
          .eq('barbershop_id', barbershop.id)
          .maybeSingle();

        if (existing) {
          return supabase
            .from('working_hours' as any)
            .update({
              is_open: hours.is_open,
              start_time: hours.start_time,
              end_time: hours.end_time,
              updated_at: new Date().toISOString(),
            })
            .eq('id', (existing as any).id);
        } else {
          return supabase
            .from('working_hours' as any)
            .insert([{
              ...hours,
              barbershop_id: barbershop.id
            }]);
        }
      });

      const results = await Promise.all(promises);
      const hasError = results.some(r => r.error);
      if (hasError) throw new Error('Erro ao salvar horários');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours'] });
      queryClient.invalidateQueries({ queryKey: ['available-time-slots'] });
      toast.success('Horários de funcionamento salvos com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar horários:', error);
      toast.error('Erro ao salvar horários de funcionamento');
    },
  });
};

// Hook para clientes visualizarem horários de funcionamento da sua barbearia
export const useClientWorkingHours = () => {
  return useQuery({
    queryKey: ['client-working-hours'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar a barbearia do cliente
      const { data: customer } = await supabase
        .from('customers')
        .select('barbershop_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer?.barbershop_id) {
        console.log('Cliente sem barbearia associada');
        return [];
      }

      const { data, error } = await supabase
        .from('working_hours' as any)
        .select('*')
        .eq('barbershop_id', customer.barbershop_id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return (data as unknown) as WorkingHours[];
    },
  });
};
