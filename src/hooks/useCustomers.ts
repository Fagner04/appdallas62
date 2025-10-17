import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  loyalty_points?: number;
  notifications_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createAccount?: boolean;
  password?: string;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  notifications_enabled?: boolean;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('barbershop_id', barbershop.id)
        .order('name');

      if (error) throw error;
      return data as Customer[];
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      // Buscar barbershop_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) throw new Error('Barbearia não encontrada');

      let userId: string | undefined;

      // Se createAccount for true, criar conta no Supabase Auth
      if (data.createAccount && data.email && data.password) {
        // Verificar se já existe um cliente com esse email
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, user_id')
          .eq('email', data.email)
          .eq('barbershop_id', barbershop.id)
          .maybeSingle();

        if (existingCustomer?.user_id) {
          throw new Error('Já existe uma conta para este email');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name,
              phone: data.phone,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) {
          // Melhor tratamento de erros de rate limit
          if (authError.message.includes('rate_limit') || authError.message.includes('rate limit')) {
            throw new Error('Muitas tentativas. Aguarde alguns segundos antes de tentar novamente.');
          }
          throw new Error(`Erro ao criar conta: ${authError.message}`);
        }

        userId = authData.user?.id;

        if (!userId) {
          throw new Error('Erro ao criar conta: ID do usuário não retornado');
        }

        // Se já existe um cliente sem user_id, atualizar com o novo user_id
        if (existingCustomer && !existingCustomer.user_id) {
          const { data: updatedCustomer, error: updateError } = await supabase
            .from('customers')
            .update({
              user_id: userId,
              name: data.name,
              phone: data.phone,
            })
            .eq('id', existingCustomer.id)
            .select()
            .single();

          if (updateError) throw updateError;
          return updatedCustomer;
        }
      }

      // Criar o registro do cliente
      const customerData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        user_id: userId,
        barbershop_id: barbershop.id,
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        // Tratar erro de duplicação
        if (error.code === '23505') {
          throw new Error('Cliente já cadastrado');
        }
        throw error;
      }
      return customer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      if (variables.createAccount) {
        toast.success('Cliente e conta de acesso cadastrados com sucesso!');
      } else {
        toast.success('Cliente cadastrado com sucesso!');
      }
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error(error?.message || 'Erro ao cadastrar cliente');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerData }) => {
      const { data: customer, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    },
  });
};
