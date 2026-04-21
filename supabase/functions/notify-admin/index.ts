// Supabase Edge Function: notify-admin
// Receives Supabase Database Webhook payloads and sends admin alert emails via Resend.
//
// Deploy: supabase functions deploy notify-admin
//
// In Supabase Dashboard → Database → Webhooks → Create webhook:
//   Events: INSERT on user_profiles, submissions, opportunities
//   URL: https://zjbsmxgccmtatrbjlvep.supabase.co/functions/v1/notify-admin
//   Header: Authorization: Bearer <SUPABASE_ANON_KEY>

const ADMIN_EMAIL = 'manadeau@coda-vault.com';

const DARK  = '#1a1a2e';
const GOLD  = '#C9A84C';
const LIGHT = '#e2e8f0';
const MUTED = '#94a3b8';

function emailHtml(subject: string, lines: string[]): string {
  const rows = lines.map(l =>
    `<tr><td style="padding:6px 0;color:${MUTED};font-size:14px;line-height:1.6;">${l}</td></tr>`
  ).join('');
  return `
    <div style="background:${DARK};padding:32px;font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:auto;border-radius:12px;">
      <div style="margin-bottom:22px;">
        <span style="color:${GOLD};font-size:18px;font-weight:800;letter-spacing:0.3px;">Coda-Vault</span>
        <span style="color:${MUTED};font-size:13px;margin-left:10px;">Admin Alert</span>
      </div>
      <h2 style="color:${LIGHT};font-size:16px;font-weight:700;margin:0 0 18px;">${subject}</h2>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <div style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);color:#4A4640;font-size:11px;">
        Coda-Vault automatic monitoring — manadeau@coda-vault.com
      </div>
    </div>`;
}

async function sendAdminEmail(subject: string, lines: string[]): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.warn('[notify-admin] RESEND_API_KEY not set — skipping email');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Coda-Vault <${ADMIN_EMAIL}>`,
      to:   [ADMIN_EMAIL],
      subject,
      html: emailHtml(subject, lines),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[notify-admin] Resend error:', res.status, body);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validate that the request comes from Supabase Database Webhooks
  // (configured with Authorization: Bearer <SUPABASE_ANON_KEY> in the webhook header)
  const expectedToken = Deno.env.get('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!expectedToken || token !== expectedToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: { type: string; table: string; record: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { type, table, record } = payload;
  if (type !== 'INSERT') {
    return new Response(JSON.stringify({ skipped: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });

  if (table === 'user_profiles') {
    const name    = (record.full_name   as string) ?? 'Unknown';
    const type_   = (record.account_type as string) ?? 'unknown';
    await sendAdminEmail('🎉 New signup on Coda-Vault', [
      `<strong style="color:#e2e8f0;">Name:</strong> ${name}`,
      `<strong style="color:#e2e8f0;">Account type:</strong> ${type_}`,
      `<strong style="color:#e2e8f0;">Time:</strong> ${ts}`,
    ]);

  } else if (table === 'submissions') {
    const songTitle = (record.song_title as string) ?? '—';
    const oppId     = (record.opportunity_id as string) ?? '—';
    await sendAdminEmail('📬 New pitch submission on Coda-Vault', [
      `<strong style="color:#e2e8f0;">Song:</strong> ${songTitle}`,
      `<strong style="color:#e2e8f0;">Opportunity ID:</strong> ${oppId}`,
      `<strong style="color:#e2e8f0;">Time:</strong> ${ts}`,
    ]);

  } else if (table === 'opportunities') {
    const title   = (record.title        as string) ?? '—';
    const company = (record.company_name as string) ?? '—';
    await sendAdminEmail('📋 New brief posted on Coda-Vault', [
      `<strong style="color:#e2e8f0;">Brief:</strong> ${title}`,
      `<strong style="color:#e2e8f0;">Company:</strong> ${company}`,
      `<strong style="color:#e2e8f0;">Time:</strong> ${ts}`,
    ]);

  } else {
    console.log(`[notify-admin] No handler for table="${table}" — ignoring`);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
