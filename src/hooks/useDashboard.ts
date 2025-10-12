import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get today's appointments count
      const { count: appointmentsToday } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today);

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get today's revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
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
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(name),
          service:services(name)
        `)
        .eq('appointment_date', today)
        .order('appointment_time');

      if (error) throw error;
      return data;
    },
  });
};
