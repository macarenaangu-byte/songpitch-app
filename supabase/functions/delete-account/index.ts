// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

type SupabaseTableError = {
  code?: string;
  message?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment configuration.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized request.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ignoreMissingTable = (error: SupabaseTableError | null) => {
      if (!error) return;
      if (error.code === '42P01') return;
      throw new Error(error.message || 'Database operation failed.');
    };

    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileId = profile?.id;

    if (profileId) {
      const { data: songs } = await adminClient
        .from('songs')
        .select('audio_url')
        .eq('composer_id', profileId);

      const pathsToDelete: string[] = [];
      for (const song of songs || []) {
        if (!song?.audio_url || typeof song.audio_url !== 'string') continue;
        const marker = '/song-files/';
        const idx = song.audio_url.indexOf(marker);
        if (idx === -1) continue;
        const path = song.audio_url.slice(idx + marker.length);
        if (path) pathsToDelete.push(path);
      }

      if (pathsToDelete.length > 0) {
        const { error: storageDeleteError } = await adminClient.storage.from('song-files').remove(pathsToDelete);
        ignoreMissingTable(storageDeleteError as SupabaseTableError | null);
      }

      const { data: opps } = await adminClient
        .from('opportunities')
        .select('id')
        .eq('creator_id', profileId);

      const oppIds = (opps || []).map((o: { id: string }) => o.id);
      if (oppIds.length > 0) {
        const { error: responsesByOppError } = await adminClient
          .from('responses')
          .delete()
          .in('opportunity_id', oppIds);
        ignoreMissingTable(responsesByOppError as SupabaseTableError | null);
      }

      const { error: responsesByComposerError } = await adminClient
        .from('responses')
        .delete()
        .eq('composer_id', profileId);
      ignoreMissingTable(responsesByComposerError as SupabaseTableError | null);

      const { error: messagesError } = await adminClient
        .from('messages')
        .delete()
        .eq('sender_id', profileId);
      ignoreMissingTable(messagesError as SupabaseTableError | null);

      const { error: notificationsError } = await adminClient
        .from('notifications')
        .delete()
        .eq('user_id', profileId);
      ignoreMissingTable(notificationsError as SupabaseTableError | null);

      const { error: conversationsAsUser1Error } = await adminClient
        .from('conversations')
        .delete()
        .eq('user1_id', profileId);
      ignoreMissingTable(conversationsAsUser1Error as SupabaseTableError | null);

      const { error: conversationsAsUser2Error } = await adminClient
        .from('conversations')
        .delete()
        .eq('user2_id', profileId);
      ignoreMissingTable(conversationsAsUser2Error as SupabaseTableError | null);

      const { error: songsError } = await adminClient
        .from('songs')
        .delete()
        .eq('composer_id', profileId);
      ignoreMissingTable(songsError as SupabaseTableError | null);

      const { error: opportunitiesError } = await adminClient
        .from('opportunities')
        .delete()
        .eq('creator_id', profileId);
      ignoreMissingTable(opportunitiesError as SupabaseTableError | null);

      const { error: composersError } = await adminClient
        .from('composers')
        .delete()
        .eq('user_profile_id', profileId);
      ignoreMissingTable(composersError as SupabaseTableError | null);

      const { error: profileError } = await adminClient
        .from('user_profiles')
        .delete()
        .eq('id', profileId);
      ignoreMissingTable(profileError as SupabaseTableError | null);
    }

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      throw new Error(authDeleteError.message || 'Failed to delete auth user.');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
