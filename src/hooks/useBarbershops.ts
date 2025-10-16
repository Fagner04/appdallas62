import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Barbershop {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBarbershopData {
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const useBarbershops = () => {
  return useQuery({
    queryKey: ['barbershops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbershops')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return data as Barbershop[];
    },
  });
};

export const useBarbershopBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['barbershop', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('barbershops')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as Barbershop;
    },
    enabled: !!slug,
  });
};

export const useMyBarbershop = () => {
  return useQuery({
    queryKey: ['my-barbershop'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('barbershops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      return data as Barbershop;
    },
  });
};

export const useCreateBarbershop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBarbershopData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: barbershop, error } = await supabase
        .from('barbershops')
        .insert([{ ...data, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return barbershop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershops'] });
      queryClient.invalidateQueries({ queryKey: ['my-barbershop'] });
      toast.success('Barbearia cadastrada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar barbearia:', error);
      if (error.message?.includes('duplicate key')) {
        toast.error('Este slug já está em uso. Escolha outro nome.');
      } else {
        toast.error('Erro ao cadastrar barbearia');
      }
    },
  });
};
