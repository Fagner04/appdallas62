import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTodayBrasilia } from '@/lib/timezone';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { appointmentsToday: 0, totalCustomers: 0, revenue: 0 };

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return { appointmentsToday: 0, totalCustomers: 0, revenue: 0 };

      const today = getTodayBrasilia();

      // Get today's appointments count
      const { count: appointmentsToday } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('barbershop_id', barbershop.id)
        .eq('appointment_date', today);

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('barbershop_id', barbershop.id);

      // Get today's revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('barbershop_id', barbershop.id)
        .eq('type', 'income')
        .eq('transaction_date', today);

      const revenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return {
        appointmentsToday: appointmentsToday || 0,
        totalCustomers: totalCustomers || 0,
        revenue,
      };
    },
  });
};

export const useTodayAppointments = () => {
  return useQuery({
    queryKey: ['today-appointments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const today = getTodayBrasilia();

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(name),
          service:services(name)
        `)
        .eq('barbershop_id', barbershop.id)
        .eq('appointment_date', today)
        .order('appointment_time');

      if (error) throw error;
      return data;
    },
  });
};
