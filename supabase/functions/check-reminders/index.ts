import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Checking for reminders to send...');

    const now = new Date();
    const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas no futuro

    // Buscar agendamentos que precisam de lembrete
    const { data: appointments, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select('id, customer_id, barber_id, date, time, service_id, customers(name, user_id, notifications_enabled), barbers(name), services(name)')
      .eq('status', 'scheduled')
      .gte('date', now.toISOString().split('T')[0])
      .lte('date', futureTime.toISOString().split('T')[0]);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    console.log(`Found ${appointments?.length || 0} appointments to check`);

    let notificationsSent = 0;

    for (const appointment of appointments || []) {
      // Combinar data e hora do agendamento
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
      const timeDiff = appointmentDateTime.getTime() - now.getTime();
      const hoursUntil = timeDiff / (1000 * 60 * 60);

      // Se está entre 0.9 e 1.1 horas (window de 12 minutos)
      if (hoursUntil >= 0.9 && hoursUntil <= 1.1) {
        const customer = appointment.customers as any;
        
        if (!customer?.user_id || !customer?.notifications_enabled) {
          console.log(`Skipping reminder for appointment ${appointment.id} - customer not configured`);
          continue;
        }

        // Verificar se já enviou notificação de lembrete para este agendamento
        const { data: existingNotification } = await supabaseClient
          .from('notifications')
          .select('id')
          .eq('related_id', appointment.id)
          .eq('type', 'reminder')
          .maybeSingle();

        if (existingNotification) {
          console.log(`Reminder already sent for appointment ${appointment.id}`);
          continue;
        }

        // Verificar configurações de notificação do usuário
        const { data: settings } = await supabaseClient
          .from('notification_settings')
          .select('*')
          .eq('user_id', customer.user_id)
          .maybeSingle();

        if (settings && !settings.appointment_reminder_enabled) {
          console.log(`Reminders disabled for user ${customer.user_id}`);
          continue;
        }

        // Enviar lembrete
        const barber = appointment.barbers as any;
        const service = appointment.services as any;
        
        const title = 'Lembrete de Agendamento';
        const message = `Olá ${customer.name}! Seu agendamento com ${barber?.name || 'barbeiro'} para ${service?.name || 'serviço'} é em 1 hora (${appointment.time}). Te esperamos!`;

        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: customer.user_id,
            title,
            message,
            type: 'reminder',
            related_id: appointment.id,
            is_read: false,
          });

        if (notificationError) {
          console.error(`Error sending reminder for appointment ${appointment.id}:`, notificationError);
        } else {
          console.log(`Reminder sent for appointment ${appointment.id}`);
          notificationsSent++;
        }
      }
    }

    console.log(`Reminders check completed. ${notificationsSent} notifications sent.`);

    return new Response(
      JSON.stringify({ success: true, notificationsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in check-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
