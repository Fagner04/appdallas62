import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLoyaltyCoupons = () => {
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['loyalty-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const redeemCoupon = useMutation({
    mutationFn: async (couponId: string) => {
      const { error } = await supabase
        .from('loyalty_coupons')
        .update({ 
          is_redeemed: true, 
          redeemed_at: new Date().toISOString() 
        })
        .eq('id', couponId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
      toast.success('Cupom resgatado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao resgatar cupom');
    },
  });

  return {
    coupons,
    isLoading,
    redeemCoupon,
  };
};

export const useLoyaltyHistory = (customerId?: string) => {
  return useQuery({
    queryKey: ['loyalty-history', customerId],
    queryFn: async () => {
      let query = supabase
        .from('loyalty_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
};

export const useLoyaltyStats = () => {
  const { data: stats } = useQuery({
    queryKey: ['loyalty-stats'],
    queryFn: async () => {
      // Buscar todos os cupons
      const { data: allCoupons } = await supabase
        .from('loyalty_coupons')
        .select('*');

      // Buscar clientes com pontos
      const { data: customersWithPoints } = await supabase
        .from('customers')
        .select('id, loyalty_points')
        .gt('loyalty_points', 0);

      const totalCoupons = allCoupons?.length || 0;
      const redeemedCoupons = allCoupons?.filter(c => c.is_redeemed).length || 0;
      const loyalCustomers = customersWithPoints?.length || 0;
      const conversionRate = totalCoupons > 0 
        ? Math.round((redeemedCoupons / totalCoupons) * 100) 
        : 0;

      return {
        totalCoupons,
        redeemedCoupons,
        loyalCustomers,
        conversionRate,
      };
    },
  });

  return { stats };
};

export const useCustomerLoyalty = (customerId: string) => {
  return useQuery({
    queryKey: ['customer-loyalty', customerId],
    queryFn: async () => {
      const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      const { data: coupons } = await supabase
        .from('loyalty_coupons')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_redeemed', false);

      const { data: history } = await supabase
        .from('loyalty_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        points: customer?.loyalty_points || 0,
        availableCoupons: coupons || [],
        history: history || [],
      };
    },
    enabled: !!customerId,
  });
};
