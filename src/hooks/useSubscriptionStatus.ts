import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  daysLeftInTrial: number;
  needsSubscription: boolean;
  subscriptionEndsAt: Date | null;
  daysLeftInSubscription: number;
  planName: string | null;
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
          subscriptionEndsAt: null,
          daysLeftInSubscription: 0,
          planName: null,
        };
      }

      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .maybeSingle();

      if (subscription) {
        const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
        const now = new Date();
        const daysLeftInSubscription = endDate 
          ? Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          : 0;

        return {
          hasActiveSubscription: true,
          isInTrial: false,
          trialEndsAt: null,
          daysLeftInTrial: 0,
          needsSubscription: false,
          subscriptionEndsAt: endDate,
          daysLeftInSubscription: Math.max(0, daysLeftInSubscription),
          planName: subscription.plan?.name || null,
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
          subscriptionEndsAt: null,
          daysLeftInSubscription: 0,
          planName: null,
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
        subscriptionEndsAt: null,
        daysLeftInSubscription: 0,
        planName: null,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
