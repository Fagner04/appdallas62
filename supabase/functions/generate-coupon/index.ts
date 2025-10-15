import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GenerateResponse = { success: true; code: string } | { success: false; error: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const authHeader = req.headers.get('Authorization') ?? '';

    // Client bound to the caller (to get auth user)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for privileged DB writes (bypasses RLS safely on backend)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' } satisfies GenerateResponse), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch customer and current points
    const { data: customer, error: customerError } = await admin
      .from('customers')
      .select('id, loyalty_points')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError) throw customerError;
    if (!customer) {
      return new Response(JSON.stringify({ success: false, error: 'Cliente não encontrado' } satisfies GenerateResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const points = customer.loyalty_points || 0;
    if (points < 10) {
      return new Response(JSON.stringify({ success: false, error: 'Pontos insuficientes' } satisfies GenerateResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique-ish code
    const code = 'CUPOM-' + crypto.randomUUID().slice(0, 8).toUpperCase();

    // Create coupon
    const { error: insertErr } = await admin
      .from('loyalty_coupons')
      .insert({
        customer_id: customer.id,
        code,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    if (insertErr) throw insertErr;

    // Deduct 10 points
    const { data: updatedCustomer, error: updateErr } = await admin
      .from('customers')
      .update({ loyalty_points: Math.max(0, points - 10) })
      .eq('id', customer.id)
      .select('loyalty_points')
      .single();
    if (updateErr) throw updateErr;

    // History
    const { error: historyErr } = await admin
      .from('loyalty_history')
      .insert({
        customer_id: customer.id,
        points_change: -10,
        points_balance: updatedCustomer.loyalty_points,
        action: 'coupon_generated',
        description: `Cupom de fidelidade gerado: ${code}`,
      });
    if (historyErr) throw historyErr;

    return new Response(JSON.stringify({ success: true, code } satisfies GenerateResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('generate-coupon error:', e?.message || e);
    return new Response(JSON.stringify({ success: false, error: 'Erro ao gerar cupom' } satisfies GenerateResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});