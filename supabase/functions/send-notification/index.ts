import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, message, type, related_id }: NotificationRequest = await req.json();

    console.log('Sending notification:', { user_id, title, type });

    // Verificar se o usuário tem notification_settings
    const { data: settings } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    // Verificar se o tipo de notificação está habilitado
    if (settings) {
      const shouldSend = 
        (type === 'confirmation' && settings.appointment_confirmation_enabled) ||
        (type === 'reminder' && settings.appointment_reminder_enabled) ||
        (type === 'cancelled' && settings.appointment_cancelled_enabled) ||
        (type === 'rescheduled' && settings.appointment_rescheduled_enabled) ||
        (type === 'promotion' && settings.marketing_enabled) ||
        (type === 'system');

      if (!shouldSend) {
        console.log('Notification type disabled for user:', type);
        return new Response(
          JSON.stringify({ message: 'Notification type disabled for user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Verificar se o cliente tem notificações habilitadas
    const { data: customer } = await supabaseClient
      .from('customers')
      .select('notifications_enabled')
      .eq('user_id', user_id)
      .maybeSingle();

    if (customer && !customer.notifications_enabled) {
      console.log('Customer has notifications disabled');
      return new Response(
        JSON.stringify({ error: 'Cliente não aceita notificações' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Inserir notificação
    const { data, error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        related_id,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting notification:', error);
      throw error;
    }

    console.log('Notification sent successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
