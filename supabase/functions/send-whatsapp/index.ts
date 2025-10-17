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
      .select('whatsapp_enabled, whatsapp_phone')
      .eq('user_id', userId)
      .single();

    if (!settings?.whatsapp_enabled || !settings?.whatsapp_phone) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp not enabled for this user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Twilio credentials not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send WhatsApp message via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const formData = new URLSearchParams();
    formData.append('From', twilioWhatsAppNumber);
    formData.append('To', `whatsapp:${to}`);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message', details: twilioData }),
        { status: twilioResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp message sent successfully:', twilioData.sid);

    return new Response(
      JSON.stringify({ success: true, sid: twilioData.sid }),
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
