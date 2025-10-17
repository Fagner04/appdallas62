import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  is_active: boolean;
  barbershop_id: string | null;
}

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      // Buscar o barbershop_id do usuário logado (owner, barber ou customer)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let barbershopId: string | null = null;

      // Tenta como proprietário
      const { data: ownedBarbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedBarbershop) {
        barbershopId = ownedBarbershop.id;
      } else {
        // Tenta como barbeiro
        const { data: barber } = await supabase
          .from('barbers')
          .select('barbershop_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (barber?.barbershop_id) {
          barbershopId = barber.barbershop_id;
        } else {
          // Tenta como cliente
          const { data: customer } = await supabase
            .from('customers')
            .select('barbershop_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (customer?.barbershop_id) {
            barbershopId = customer.barbershop_id;
          }
        }
      }

      if (!barbershopId) {
        // Sem barbearia associada – retornar vazio para não quebrar a UI
        return [] as Service[];
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Service[];
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'is_active' | 'barbershop_id'>) => {
      // Buscar o barbershop_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) throw new Error('Barbearia não encontrada');

      const { data, error } = await supabase
        .from('services')
        .insert([{ ...service, barbershop_id: barbershop.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço adicionado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar serviço');
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...service }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(service)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar serviço');
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover serviço');
    },
  });
};

// Hook para clientes visualizarem serviços da sua barbearia
export const useClientServices = () => {
  return useQuery({
    queryKey: ['client-services'],
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

      // Buscar serviços ativos da barbearia do cliente
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', customer.barbershop_id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar serviços:', error);
        throw error;
      }

      return data as Service[];
    },
  });
};
