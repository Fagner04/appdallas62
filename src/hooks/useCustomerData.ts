import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useCustomerProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get profile with avatar_url
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      // Get customer data
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Se não existe perfil, criar automaticamente
      if (!data && user?.id) {
        const { data: newProfile, error: insertError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: user.name || user.email?.split('@')[0] || 'Cliente',
            email: user.email || '',
            phone: '',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar perfil automático:', insertError);
          throw insertError;
        }
        
        return { ...newProfile, avatar_url: profile?.avatar_url };
      }
      
      return { ...data, avatar_url: profile?.avatar_url };
    },
    enabled: !!user?.id,
    retry: 1,
  });
};

export const useUpdateCustomerProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: customer, error } = await supabase
        .from('customers')
        .update({
          name: data.name.trim(),
          phone: data.phone.trim(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      toast.success('Dados atualizados com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados');
    },
  });
};

export const useCustomerAppointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('customer-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['customer-appointments', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['customer-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // First get customer record
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer) return [];

      // Then get appointments
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name, price, duration),
          barber:barbers(id)
        `)
        .eq('customer_id', customer.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useUpcomingAppointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('upcoming-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['upcoming-appointments', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['upcoming-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name, price, duration),
          barber:barbers(id),
          loyalty_coupons!loyalty_coupons_redeemed_appointment_id_fkey(id, code, is_redeemed)
        `)
        .eq('customer_id', customer.id)
        .gte('appointment_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};
