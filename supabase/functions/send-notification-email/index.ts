// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Email templates per notification type
const emailTemplates: Record<string, { subject: (title: string) => string; body: (body: string, metadata: Record<string, unknown>) => string }> = {
  new_message: {
    subject: () => 'You have a new message on Coda-Vault',
    body: (body) => `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">Coda-Vault</h1>
        </div>
        <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a4a;">
          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">New Message</h2>
          <p style="color: #a0a0b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${body}</p>
          <a href="https://www.songpitchhub.com" style="display: inline-block; background: #C9A84C; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Message</a>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 24px;">You're receiving this because you have message notifications enabled. <a href="https://www.songpitchhub.com" style="color: #C9A84C;">Manage preferences</a></p>
      </div>`,
  },
  new_opportunity: {
    subject: (title) => `New opportunity: ${title}`,
    body: (body) => `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">Coda-Vault</h1>
        </div>
        <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a4a;">
          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">New Opportunity</h2>
          <p style="color: #a0a0b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${body}</p>
          <a href="https://www.songpitchhub.com" style="display: inline-block; background: #C9A84C; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Opportunity</a>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 24px;">You're receiving this because you have opportunity notifications enabled. <a href="https://www.songpitchhub.com" style="color: #C9A84C;">Manage preferences</a></p>
      </div>`,
  },
  submission_received: {
    subject: (title) => `New submission: ${title}`,
    body: (body) => `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">Coda-Vault</h1>
        </div>
        <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a4a;">
          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">New Submission</h2>
          <p style="color: #a0a0b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${body}</p>
          <a href="https://www.songpitchhub.com" style="display: inline-block; background: #C9A84C; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Review Submissions</a>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 24px;">You're receiving this because you have submission notifications enabled. <a href="https://www.songpitchhub.com" style="color: #C9A84C;">Manage preferences</a></p>
      </div>`,
  },
  submission_shortlisted: {
    subject: () => 'Your submission was shortlisted!',
    body: (body) => `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">Coda-Vault</h1>
        </div>
        <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a4a;">
          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">Congratulations! 🎉</h2>
          <p style="color: #a0a0b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${body}</p>
          <a href="https://www.songpitchhub.com" style="display: inline-block; background: #C9A84C; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Details</a>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 24px;">You're receiving this because you have submission notifications enabled. <a href="https://www.songpitchhub.com" style="color: #C9A84C;">Manage preferences</a></p>
      </div>`,
  },
  submission_rejected: {
    subject: () => 'Submission update on Coda-Vault',
    body: (body) => `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">Coda-Vault</h1>
        </div>
        <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a4a;">
          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">Submission Update</h2>
          <p style="color: #a0a0b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${body}</p>
          <a href="https://www.songpitchhub.com" style="display: inline-block; background: #C9A84C; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Opportunities</a>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 24px;">You're receiving this because you have submission notifications enabled. <a href="https://www.songpitchhub.com" style="color: #C9A84C;">Manage preferences</a></p>
      </div>`,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!resendApiKey) {
      // Email service not configured — skip silently (notifications still work in-app)
      return new Response(JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY not configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { userId, type, title, body, metadata } = await req.json();

    if (!userId || !type) {
      return new Response(JSON.stringify({ error: 'Missing userId or type.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile to check email preferences and get email
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, first_name, email_preferences')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ skipped: true, reason: 'User profile not found' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has this notification type enabled
    const prefs = profile.email_preferences || {};
    if (prefs[type] === false) {
      return new Response(JSON.stringify({ skipped: true, reason: 'User disabled this notification type' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
    if (authError || !authUser?.user?.email) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Could not resolve user email' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userEmail = authUser.user.email;
    const template = emailTemplates[type];
    if (!template) {
      return new Response(JSON.stringify({ skipped: true, reason: `No template for type: ${type}` }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Coda-Vault <manadeau@coda-vault.com>',
        to: [userEmail],
        subject: template.subject(title),
        html: template.body(body, metadata || {}),
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      console.error('Resend error:', emailResult);
      return new Response(JSON.stringify({ error: 'Email send failed', details: emailResult }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
