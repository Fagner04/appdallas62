import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationTemplate {
  id: string;
  type: string;
  title: string;
  description: string | null;
  message: string;
  icon: string;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useNotificationTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NotificationTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_system'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('notification_templates')
        .insert({
          ...template,
          created_by: user?.id,
          is_system: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar template');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<NotificationTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update(template)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar template');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Template excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir template');
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
