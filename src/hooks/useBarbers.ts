import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Barber {
  id: string;
  user_id?: string;
  name: string;
  specialty?: string;
  commission_rate?: number;
  rating?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBarberData {
  name: string;
  specialty?: string;
  commission_rate?: number;
  rating?: number;
}

export interface UpdateBarberData {
  name?: string;
  specialty?: string;
  commission_rate?: number;
  rating?: number;
  is_active?: boolean;
}

export const useBarbers = () => {
  return useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return data as Barber[];
    },
  });
};

export const useAllBarbers = () => {
  return useQuery({
    queryKey: ['all-barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .order('created_at');

      if (error) throw error;
      return data as Barber[];
    },
  });
};

export const useCreateBarber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBarberData) => {
      const { data: barber, error } = await supabase
        .from('barbers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return barber;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['all-barbers'] });
      toast.success('Barbeiro cadastrado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao cadastrar barbeiro:', error);
      toast.error('Erro ao cadastrar barbeiro');
    },
  });
};

export const useUpdateBarber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBarberData }) => {
      const { data: barber, error } = await supabase
        .from('barbers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return barber;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['all-barbers'] });
      toast.success('Barbeiro atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar barbeiro:', error);
      toast.error('Erro ao atualizar barbeiro');
    },
  });
};

export const useDeleteBarber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      queryClient.invalidateQueries({ queryKey: ['all-barbers'] });
      toast.success('Barbeiro excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir barbeiro:', error);
      toast.error('Erro ao excluir barbeiro');
    },
  });
};
