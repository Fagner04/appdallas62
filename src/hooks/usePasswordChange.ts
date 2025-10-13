import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(6, 'Nova senha deve ter no mínimo 6 caracteres')
    .max(100, 'Nova senha muito longa'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type PasswordChangeData = z.infer<typeof passwordSchema>;

export const usePasswordChange = () => {
  const [isLoading, setIsLoading] = useState(false);

  const changePassword = async (data: PasswordChangeData) => {
    setIsLoading(true);

    try {
      // Validar os dados
      const validatedData = passwordSchema.parse(data);

      // Verificar se a senha atual está correta tentando fazer re-autenticação
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('Usuário não encontrado');
        return { success: false };
      }

      // Tentar fazer login com a senha atual para validar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: validatedData.currentPassword,
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return { success: false };
      }

      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: validatedData.newPassword,
      });

      if (updateError) {
        toast.error('Erro ao alterar senha: ' + updateError.message);
        return { success: false };
      }

      toast.success('Senha alterada com sucesso!');
      return { success: true };

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error('Erro ao alterar senha');
      }
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    changePassword,
    isLoading,
  };
};
