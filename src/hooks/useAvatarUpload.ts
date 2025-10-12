import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const useAvatarUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return null;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return null;
      }

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profiles table
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      
      toast.success('Foto de perfil atualizada com sucesso!');
      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao atualizar foto de perfil');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setUploading(true);

      // Get current avatar URL from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        // Extract file path from URL
        const filePath = profile.avatar_url.split('/avatars/')[1];
        
        if (filePath) {
          // Delete from storage
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([filePath]);

          if (deleteError) throw deleteError;
        }
      }

      // Update profiles table
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      
      toast.success('Foto de perfil removida com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover foto de perfil');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, deleteAvatar, uploading };
};
