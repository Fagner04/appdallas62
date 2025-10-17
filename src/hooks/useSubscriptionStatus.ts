import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  daysLeftInTrial: number;
  needsSubscription: boolean;
}

export const useSubscriptionStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!user?.id) {
        return {
          hasActiveSubscription: false,
          isInTrial: false,
          trialEndsAt: null,
          daysLeftInTrial: 0,
          needsSubscription: true,
        };
      }

      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .maybeSingle();

      if (subscription) {
        return {
          hasActiveSubscription: true,
          isInTrial: false,
          trialEndsAt: null,
          daysLeftInTrial: 0,
          needsSubscription: false,
        };
      }

      // Check trial period (7 days from account creation)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.created_at) {
        return {
          hasActiveSubscription: false,
          isInTrial: false,
          trialEndsAt: null,
          daysLeftInTrial: 0,
          needsSubscription: true,
        };
      }

      const createdAt = new Date(authUser.created_at);
      const trialEndsAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const isInTrial = daysLeft > 0;

      return {
        hasActiveSubscription: false,
        isInTrial,
        trialEndsAt,
        daysLeftInTrial: Math.max(0, daysLeft),
        needsSubscription: !isInTrial,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
