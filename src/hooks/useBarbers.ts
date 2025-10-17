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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('barbershop_id', barbershop.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('barbershop_id', barbershop.id)
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
      // Get the user's barbershop first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: barbershop, error: barbershopError } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (barbershopError || !barbershop) {
        throw new Error('Barbearia não encontrada. Cadastre sua barbearia primeiro.');
      }

      const { data: barber, error } = await supabase
        .from('barbers')
        .insert([{ ...data, barbershop_id: barbershop.id }])
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
    onError: (error: any) => {
      console.error('Erro ao cadastrar barbeiro:', error);
      toast.error(error.message || 'Erro ao cadastrar barbeiro');
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

// Hook para clientes visualizarem barbeiros da sua barbearia
export const useClientBarbers = () => {
  return useQuery({
    queryKey: ['client-barbers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

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

      // Buscar barbeiros ativos da barbearia do cliente
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('barbershop_id', customer.barbershop_id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar barbeiros:', error);
        throw error;
      }

      return data as Barber[];
    },
  });
};
