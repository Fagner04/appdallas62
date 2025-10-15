import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RedeemReq = { code: string; appointment_id: string };

type RedeemResp = { success: true } | { success: false; error: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Partial<RedeemReq>;
    if (!body?.code || !body?.appointment_id) {
      return new Response(JSON.stringify({ success: false, error: 'Parâmetros inválidos' } satisfies RedeemResp), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const authHeader = req.headers.get('Authorization') ?? '';

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' } satisfies RedeemResp), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure customer ownership
    const { data: customer, error: custErr } = await admin
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (custErr) throw custErr;
    if (!customer) {
      return new Response(JSON.stringify({ success: false, error: 'Cliente não encontrado' } satisfies RedeemResp), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate coupon ownership and status
    const { data: coupon, error: couponErr } = await admin
      .from('loyalty_coupons')
      .select('id, expires_at, is_redeemed')
      .eq('code', body.code)
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (couponErr) throw couponErr;
    if (!coupon) {
      return new Response(JSON.stringify({ success: false, error: 'Cupom inválido' } satisfies RedeemResp), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (coupon.is_redeemed) {
      return new Response(JSON.stringify({ success: false, error: 'Cupom já utilizado' } satisfies RedeemResp), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: 'Cupom expirado' } satisfies RedeemResp), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Redeem coupon and link to appointment
    const { error: redeemErr } = await admin
      .from('loyalty_coupons')
      .update({ is_redeemed: true, redeemed_at: new Date().toISOString(), redeemed_appointment_id: body.appointment_id })
      .eq('id', coupon.id);

    if (redeemErr) throw redeemErr;

    return new Response(JSON.stringify({ success: true } satisfies RedeemResp), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('redeem-coupon error:', e?.message || e);
    return new Response(JSON.stringify({ success: false, error: 'Erro ao resgatar cupom' } satisfies RedeemResp), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});