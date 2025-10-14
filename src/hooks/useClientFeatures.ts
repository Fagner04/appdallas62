import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ClientFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
}

const getDefaultFeatures = (): Record<string, boolean> => ({
  online_booking: true,
  show_prices: true,
  cancel_appointments: false,
  view_history: true,
  view_blocked_times: true,
  delete_notifications: false,
  view_notifications: true,
});

export const useClientFeatures = () => {
  const queryClient = useQueryClient();

  // Buscar configurações do banco de dados
  const { data: dbFeatures, isLoading } = useQuery({
    queryKey: ['client-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .like('key', 'client_%');

      if (error) throw error;

      const features: Record<string, boolean> = getDefaultFeatures();
      
      data?.forEach((setting) => {
        const key = setting.key.replace('client_', '');
        features[key] = setting.value === true || setting.value === 'true';
      });

      return features;
    },
  });

  const features = dbFeatures || getDefaultFeatures();

  // Mutation para atualizar configuração no banco
  const updateFeature = useMutation({
    mutationFn: async ({ featureId, value }: { featureId: string; value: boolean }) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: `client_${featureId}`,
          value: value as any,
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-features'] });
    },
  });

  const toggleFeature = (featureId: string, featureTitle: string) => {
    const currentValue = features[featureId] ?? true;
    const newValue = !currentValue;
    
    updateFeature.mutate({ featureId, value: newValue }, {
      onSuccess: () => {
        toast.success(
          `${featureTitle} ${newValue ? 'habilitada' : 'desabilitada'} para clientes`
        );
      },
      onError: () => {
        toast.error('Erro ao atualizar configuração');
      }
    });
  };

  const isFeatureEnabled = (featureId: string): boolean => {
    return features[featureId] ?? true;
  };

  return {
    features,
    isLoading,
    toggleFeature,
    isFeatureEnabled,
  };
};
