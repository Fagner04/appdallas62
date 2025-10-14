import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  delete_notifications: false, // Mudado para false por padrão
  view_notifications: true,
});

export const useClientFeatures = () => {
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
    return getDefaultFeatures();
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('clientFeaturesChanged', { 
        detail: features 
      }));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  }, [features]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setFeatures(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Erro ao sincronizar configurações:', error);
        }
      }
    };

    const handleCustomChange = (e: CustomEvent) => {
      setFeatures(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('clientFeaturesChanged' as any, handleCustomChange as any);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clientFeaturesChanged' as any, handleCustomChange as any);
    };
  }, []);

  const toggleFeature = (featureId: string, featureTitle: string) => {
    setFeatures((prev) => {
      const newState = !prev[featureId];
      
      toast.success(
        `${featureTitle} ${newState ? 'habilitada' : 'desabilitada'} para clientes`
      );
      
      return {
        ...prev,
        [featureId]: newState,
      };
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
