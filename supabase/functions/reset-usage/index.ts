// Supabase Edge Function: reset-usage
// Resets monthly and weekly usage counters.
// Schedule via Supabase Cron:
//   - Monthly reset: "0 0 1 * *"  (midnight on the 1st of every month)
//   - Weekly reset:  "0 0 * * 1"  (midnight every Monday)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const body = await req.json().catch(() => ({}));
  const type = body?.type ?? 'monthly'; // 'monthly' | 'weekly'

  if (type === 'monthly') {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        contacts_this_month:            0,
        opportunities_this_month:       0,
        contract_revisions_this_month:  0,
        monthly_reset_date:             new Date().toISOString().slice(0, 10),
      })
      .neq('subscription_tier', 'admin'); // never reset admin counters

    if (error) {
      console.error('[reset-usage] Monthly reset error:', error);
      return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: corsHeaders });
    }
    console.log('[reset-usage] Monthly counters reset ✓');
  }

  if (type === 'weekly') {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        uploads_this_week:   0,
        uploads_week_reset:  new Date().toISOString().slice(0, 10),
      })
      .neq('subscription_tier', 'admin');

    if (error) {
      console.error('[reset-usage] Weekly reset error:', error);
      return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: corsHeaders });
    }
    console.log('[reset-usage] Weekly counters reset ✓');
  }

  return new Response(JSON.stringify({ ok: true, type }), { headers: corsHeaders });
});
