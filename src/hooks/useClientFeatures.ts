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

const STORAGE_KEY = 'client_features_settings';

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
  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['client-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'client_online_booking',
          'client_show_prices', 
          'client_cancel_appointments',
          'client_view_history',
          'client_view_blocked_times',
          'client_delete_notifications',
          'client_view_notifications'
        ]);
      
      if (error) {
        console.error('Erro ao carregar configurações:', error);
        // Fallback para localStorage se houver erro
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            return JSON.parse(saved);
          }
        } catch (e) {
          console.error('Erro ao carregar do localStorage:', e);
        }
        return getDefaultFeatures();
      }
      
      // Converter array de settings para objeto
      const settings: Record<string, boolean> = {};
      data?.forEach(setting => {
        const key = setting.key.replace('client_', '');
        settings[key] = setting.value === true || setting.value === 'true';
      });
      
      // Preencher com valores padrão para chaves não encontradas
      const defaults = getDefaultFeatures();
      return { ...defaults, ...settings };
    },
  });

  const features = dbSettings || getDefaultFeatures();

  // Mutation para atualizar configurações
  const updateFeature = useMutation({
    mutationFn: async ({ featureId, newValue }: { featureId: string; newValue: boolean }) => {
      const dbKey = `client_${featureId}`;
      
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key: dbKey, 
          value: newValue 
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-features'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao salvar configuração');
    },
  });

  const toggleFeature = (featureId: string, featureTitle: string) => {
    const newState = !features[featureId];
    
    updateFeature.mutate({ featureId, newValue: newState }, {
      onSuccess: () => {
        toast.success(
          `${featureTitle} ${newState ? 'habilitada' : 'desabilitada'} para clientes`
        );
      },
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
