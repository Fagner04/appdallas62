import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Received webhook:', body);

    // Mercado Pago sends different types of notifications
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Get payment details
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to fetch payment: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', payment);

      // Get preference to access metadata
      if (payment.additional_info?.items?.[0]?.id) {
        const preferenceId = payment.additional_info.items[0].id;
        
        const preferenceResponse = await fetch(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (preferenceResponse.ok) {
          const preference = await preferenceResponse.json();
          const metadata = preference.metadata;

          if (payment.status === 'approved') {
            // Create or update subscription
            const startDate = new Date();
            const endDate = new Date();
            
            if (metadata.interval === 'monthly') {
              endDate.setMonth(endDate.getMonth() + 1);
            } else if (metadata.interval === 'yearly') {
              endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // Get user from payer email
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', payment.payer.email)
              .single();

            if (profiles) {
              // Create or update subscription
              const { error: subError } = await supabase
                .from('subscriptions')
                .upsert({
                  user_id: profiles.id,
                  plan_id: metadata.plan_id,
                  status: 'active',
                  start_date: startDate.toISOString(),
                  end_date: endDate.toISOString(),
                  payment_method: 'mercadopago',
                  payment_reference: payment.id.toString(),
                });

              if (subError) {
                console.error('Error creating subscription:', subError);
              }

              // Create payment record
              const { error: payError } = await supabase
                .from('subscription_payments')
                .insert({
                  subscription_id: metadata.plan_id,
                  amount: payment.transaction_amount,
                  status: 'paid',
                  payment_method: 'mercadopago',
                  payment_reference: payment.id.toString(),
                  paid_at: new Date(payment.date_approved).toISOString(),
                  payment_data: payment,
                });

              if (payError) {
                console.error('Error creating payment record:', payError);
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
