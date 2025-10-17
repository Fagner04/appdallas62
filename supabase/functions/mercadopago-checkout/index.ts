import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId, planName, price, interval } = await req.json();
    
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    // Create preference
    const preference = {
      items: [
        {
          title: planName,
          description: `Assinatura ${interval === 'monthly' ? 'Mensal' : 'Anual'} - Sistema de Gestão para Barbearias`,
          quantity: 1,
          unit_price: parseFloat(price),
          currency_id: 'BRL',
        }
      ],
      back_urls: {
        success: `${req.headers.get('origin')}/planos?status=success`,
        failure: `${req.headers.get('origin')}/planos?status=failure`,
        pending: `${req.headers.get('origin')}/planos?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `https://qeevcauhornyqrfeevwc.supabase.co/functions/v1/mercadopago-webhook`,
      metadata: {
        plan_id: planId,
        interval: interval,
      },
    };

    console.log('Creating Mercado Pago preference:', preference);

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Mercado Pago API error:', errorData);
      throw new Error(`Mercado Pago API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Preference created successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        checkoutUrl: data.init_point,
        preferenceId: data.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating checkout:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
