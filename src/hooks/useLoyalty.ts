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

export const useCustomerLoyalty = (userId: string) => {
  return useQuery({
    queryKey: ['customer-loyalty', userId],
    queryFn: async () => {
      // Buscar customer_id do user_id
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, loyalty_points')
        .eq('user_id', userId)
        .maybeSingle();

      if (!customerData) {
        return {
          points: 0,
          availableCoupons: [],
          history: [],
        };
      }

      const { data: coupons } = await supabase
        .from('loyalty_coupons')
        .select('*')
        .eq('customer_id', customerData.id)
        .eq('is_redeemed', false)
        .order('created_at', { ascending: false });

      const { data: history } = await supabase
        .from('loyalty_history')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        points: customerData?.loyalty_points || 0,
        availableCoupons: coupons || [],
        history: history || [],
      };
    },
    enabled: !!userId,
  });
};

export const useUpdateCustomerPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, points, action }: { 
      customerId: string; 
      points: number;
      action: 'add' | 'remove' | 'set';
    }) => {
      const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

      if (!customer) throw new Error('Cliente não encontrado');

      let newPoints = 0;
      let pointsChange = 0;
      
      if (action === 'set') {
        newPoints = points;
        pointsChange = points - (customer.loyalty_points || 0);
      } else if (action === 'add') {
        newPoints = (customer.loyalty_points || 0) + points;
        pointsChange = points;
      } else {
        newPoints = Math.max(0, (customer.loyalty_points || 0) - points);
        pointsChange = -points;
      }

      const { error } = await supabase
        .from('customers')
        .update({ loyalty_points: newPoints })
        .eq('id', customerId);

      if (error) throw error;

      // Registra no histórico
      await supabase
        .from('loyalty_history')
        .insert({
          customer_id: customerId,
          points_change: pointsChange,
          points_balance: newPoints,
          action: action === 'add' ? 'earned' : action === 'remove' ? 'removed' : 'adjusted',
          description: `Pontos ajustados manualmente pelo administrador`,
        });

      return { newPoints };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
      toast.success('Pontos atualizados com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar pontos');
    },
  });
};
