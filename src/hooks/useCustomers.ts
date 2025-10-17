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

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      console.log('Customers loaded:', data);
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

      if (!barbershopId) throw new Error('Barbearia não encontrada');

      let userId: string | undefined;

      // Se createAccount for true, criar conta no Supabase Auth
      if (data.createAccount && data.email && data.password) {
        // Verificar se já existe um usuário com esse email
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, user_id, barbershop_id')
          .eq('email', data.email)
          .maybeSingle();

        // Se já existe um cliente com user_id e na mesma barbearia, bloquear
        if (existingCustomer?.user_id && existingCustomer?.barbershop_id === barbershopId) {
          throw new Error('Já existe uma conta para este email nesta barbearia');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name,
              phone: data.phone,
              barbershop_id: barbershopId, // CRÍTICO: Passar barbershop_id no metadata
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) {
          if (authError.message.includes('rate_limit') || authError.message.includes('rate limit')) {
            throw new Error('Muitas tentativas. Aguarde alguns segundos antes de tentar novamente.');
          }
          throw new Error(`Erro ao criar conta: ${authError.message}`);
        }

        userId = authData.user?.id;

        if (!userId) {
          throw new Error('Erro ao criar conta: ID do usuário não retornado');
        }

        // Aguardar mais tempo para o trigger processar (1.5 segundos)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // O trigger agora cria o registro com barbershop_id correto
        // Tentar até 3 vezes buscar o registro criado pelo trigger
        let finalCustomer = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (data) {
            finalCustomer = data;
            // Se barbershop_id ainda não estiver definido, atualizar
            if (!data.barbershop_id) {
              const { data: updated, error: updateErr } = await supabase
                .from('customers')
                .update({
                  name: data.name,
                  phone: data.phone,
                  email: data.email,
                  notes: data.notes,
                  barbershop_id: barbershopId,
                })
                .eq('id', data.id)
                .select()
                .single();
              
              if (!updateErr && updated) {
                finalCustomer = updated;
              }
            }
            break;
          }
          
          // Aguardar mais 500ms antes de tentar novamente
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (finalCustomer) {
          return finalCustomer;
        }

        // Se chegou aqui, algo deu errado - informar claramente
        throw new Error('O registro do cliente foi criado mas não pôde ser localizado. Por favor, recarregue a página.');
      }

      // Criar o registro do cliente
      const customerData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        user_id: userId,
        barbershop_id: barbershopId,
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
