import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationSettings {
  id: string;
  user_id: string;
  appointment_reminder_enabled: boolean;
  appointment_reminder_hours: number;
  appointment_confirmation_enabled: boolean;
  appointment_cancelled_enabled: boolean;
  appointment_rescheduled_enabled: boolean;
  marketing_enabled: boolean;
  created_at: string;
  updated_at: string;
}

type SupabaseNotificationSettings = any;

export const useNotificationSettings = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('notification_settings' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default ones
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('notification_settings' as any)
          .insert({
            user_id: userId,
            appointment_reminder_enabled: true,
            appointment_reminder_hours: 24,
            appointment_confirmation_enabled: true,
            appointment_cancelled_enabled: true,
            appointment_rescheduled_enabled: true,
            marketing_enabled: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as unknown as NotificationSettings;
      }

      return data as unknown as NotificationSettings;
    },
    enabled: !!userId,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('notification_settings' as any)
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NotificationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', userId] });
      toast.success('Configurações de notificações atualizadas');
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
};
