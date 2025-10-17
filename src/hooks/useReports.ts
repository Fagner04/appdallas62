import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { getBrasiliaDate, formatBrasiliaDate } from '@/lib/timezone';

type Period = 'week' | 'month' | 'quarter' | 'year';

const getDateRange = (period: Period) => {
  const now = getBrasiliaDate();
  
  switch (period) {
    case 'week':
      return {
        start: formatBrasiliaDate(startOfWeek(now), 'yyyy-MM-dd'),
        end: formatBrasiliaDate(endOfWeek(now), 'yyyy-MM-dd'),
      };
    case 'month':
      return {
        start: formatBrasiliaDate(startOfMonth(now), 'yyyy-MM-dd'),
        end: formatBrasiliaDate(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'quarter':
      return {
        start: formatBrasiliaDate(startOfQuarter(now), 'yyyy-MM-dd'),
        end: formatBrasiliaDate(endOfQuarter(now), 'yyyy-MM-dd'),
      };
    case 'year':
      return {
        start: formatBrasiliaDate(startOfYear(now), 'yyyy-MM-dd'),
        end: formatBrasiliaDate(endOfYear(now), 'yyyy-MM-dd'),
      };
  }
};

export const useReportStats = (period: Period) => {
  return useQuery({
    queryKey: ['report-stats', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { revenue: 0, totalAppointments: 0, averageTicket: 0, occupancyRate: 0 };

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return { revenue: 0, totalAppointments: 0, averageTicket: 0, occupancyRate: 0 };

      const { start, end } = getDateRange(period);

      // Get total revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('barbershop_id', barbershop.id)
        .eq('type', 'income')
        .gte('transaction_date', start)
        .lte('transaction_date', end);

      const revenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get total appointments
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('barbershop_id', barbershop.id)
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .in('status', ['completed', 'confirmed']);

      // Calculate average ticket
      const averageTicket = totalAppointments ? revenue / totalAppointments : 0;

      // Calculate occupancy rate (appointments vs available slots)
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time')
        .eq('barbershop_id', barbershop.id)
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .in('status', ['completed', 'confirmed']);

      // Estimate: 9 working hours * 60 min / 30 min avg = ~18 slots per day
      const daysInPeriod = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const estimatedSlots = daysInPeriod * 18;
      const occupancyRate = appointments ? (appointments.length / estimatedSlots) * 100 : 0;

      return {
        revenue,
        totalAppointments: totalAppointments || 0,
        averageTicket,
        occupancyRate,
      };
    },
  });
};

export const useTopServices = (period: Period) => {
  return useQuery({
    queryKey: ['top-services', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const { start, end } = getDateRange(period);

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          service_id,
          service:services(name, price)
        `)
        .eq('barbershop_id', barbershop.id)
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .in('status', ['completed', 'confirmed']);

      if (!appointments) return [];

      // Group by service
      const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
      
      appointments.forEach((apt) => {
        if (apt.service) {
          const serviceName = apt.service.name;
          const price = Number(apt.service.price);
          
          if (serviceMap.has(serviceName)) {
            const existing = serviceMap.get(serviceName)!;
            existing.count += 1;
            existing.revenue += price;
          } else {
            serviceMap.set(serviceName, {
              name: serviceName,
              count: 1,
              revenue: price,
            });
          }
        }
      });

      const services = Array.from(serviceMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      const totalCount = services.reduce((sum, s) => sum + s.count, 0);

      return services.map((service) => ({
        name: service.name,
        count: service.count,
        revenue: service.revenue,
        percentage: totalCount > 0 ? Math.round((service.count / totalCount) * 100) : 0,
      }));
    },
  });
};

export const useTopClients = (period: Period) => {
  return useQuery({
    queryKey: ['top-clients', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const { start, end } = getDateRange(period);

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          customer_id,
          customer:customers(name),
          service:services(price)
        `)
        .eq('barbershop_id', barbershop.id)
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .in('status', ['completed', 'confirmed']);

      if (!appointments) return [];

      // Group by customer
      const customerMap = new Map<string, { name: string; visits: number; spent: number }>();
      
      appointments.forEach((apt) => {
        if (apt.customer && apt.service) {
          const customerId = apt.customer_id;
          const customerName = apt.customer.name;
          const price = Number(apt.service.price);
          
          if (customerMap.has(customerId)) {
            const existing = customerMap.get(customerId)!;
            existing.visits += 1;
            existing.spent += price;
          } else {
            customerMap.set(customerId, {
              name: customerName,
              visits: 1,
              spent: price,
            });
          }
        }
      });

      return Array.from(customerMap.values())
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 4);
    },
  });
};

export const useHourlyDistribution = (period: Period) => {
  return useQuery({
    queryKey: ['hourly-distribution', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!barbershop) return [];

      const { start, end } = getDateRange(period);

      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('barbershop_id', barbershop.id)
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .in('status', ['completed', 'confirmed']);

      if (!appointments) return [];

      // Initialize hours from 9 to 17
      const hours = [9, 10, 11, 12, 14, 15, 16, 17];
      const distribution = hours.map(hour => ({ hour, count: 0 }));

      // Count appointments per hour
      appointments.forEach((apt) => {
        const hour = parseInt(apt.appointment_time.split(':')[0]);
        const index = distribution.findIndex(d => d.hour === hour);
        if (index !== -1) {
          distribution[index].count += 1;
        }
      });

      // Calculate percentages
      const maxCount = Math.max(...distribution.map(d => d.count), 1);
      
      return distribution.map(d => ({
        hour: `${d.hour.toString().padStart(2, '0')}h`,
        percentage: Math.round((d.count / maxCount) * 100),
      }));
    },
  });
};
