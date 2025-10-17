import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTodayBrasilia } from '@/lib/timezone';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string | null;
  description: string;
  transaction_date: string;
  created_at: string;
  created_by: string;
  appointment_id: string | null;
  barber_id: string | null;
}

export interface CreateTransactionData {
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  description: string;
  transaction_date?: string;
  appointment_id?: string;
  barber_id?: string;
}

export const useTransactions = (date?: string) => {
  const filterDate = date || getTodayBrasilia();
  
  return useQuery({
    queryKey: ['transactions', filterDate],
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
        .from('transactions')
        .select(`
          *,
          appointment:appointments(
            customer:customers(name),
            service:services(name)
          ),
          barber:barbers(name)
        `)
        .eq('barbershop_id', barbershop.id)
        .eq('transaction_date', filterDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
  });
};

export const useTransactionStats = (date?: string) => {
  const filterDate = date || getTodayBrasilia();
  
  return useQuery({
    queryKey: ['transaction-stats', filterDate],
    queryFn: async () => {
      // Buscar barbershop_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { income: 0, expenses: 0, balance: 0, incomeCount: 0, expenseCount: 0 };

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return { income: 0, expenses: 0, balance: 0, incomeCount: 0, expenseCount: 0 };

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('barbershop_id', barbershop.id)
        .eq('transaction_date', filterDate);

      if (error) throw error;

      const income = data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = data
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        income,
        expenses,
        balance: income - expenses,
        incomeCount: data.filter(t => t.type === 'income').length,
        expenseCount: data.filter(t => t.type === 'expense').length,
      };
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: CreateTransactionData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar barbershop_id do usuário
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) throw new Error('Barbearia não encontrada');

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          transaction_date: transaction.transaction_date || getTodayBrasilia(),
          created_by: user.id,
          barbershop_id: barbershop.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transação registrada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registrar transação');
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar transação');
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transação removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover transação');
    },
  });
};
