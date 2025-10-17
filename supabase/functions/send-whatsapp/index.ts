import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  to: string;
  message: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, userId }: WhatsAppRequest = await req.json();

    console.log('Sending WhatsApp message to:', to);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check if user has WhatsApp enabled
    const { data: settings } = await supabaseClient
      .from('notification_settings')
      .select('whatsapp_enabled, whatsapp_phone, whatsapp_token, whatsapp_phone_id')
      .eq('user_id', userId)
      .single();

    if (!settings?.whatsapp_enabled || !settings?.whatsapp_token || !settings?.whatsapp_phone_id) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp not configured for this user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove + and any non-digit characters)
    const formattedPhone = to.replace(/\D/g, '');

    // Send WhatsApp message via WhatsApp Business Cloud API
    const whatsappUrl = `https://graph.facebook.com/v18.0/${settings.whatsapp_phone_id}/messages`;
    
    const whatsappResponse = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.whatsapp_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      }),
    });

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message', details: whatsappData }),
        { status: whatsappResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp message sent successfully:', whatsappData.messages?.[0]?.id);

    return new Response(
      JSON.stringify({ success: true, messageId: whatsappData.messages?.[0]?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-whatsapp function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
