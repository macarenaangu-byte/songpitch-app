import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { existingPitch, song, opportunity, tone, composerName } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    console.log('[pitch-helper] received request, isPolishMode:', !!(existingPitch?.trim().length > 10));
    console.log('[pitch-helper] ANTHROPIC_API_KEY present:', !!apiKey);

    if (!apiKey) {
      console.error('[pitch-helper] ANTHROPIC_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isPolishMode = existingPitch && existingPitch.trim().length > 10;

    const songDescription = [
      song?.title ? `"${song.title}"` : null,
      song?.genre || null,
      song?.mood ? `${song.mood} feel` : null,
      song?.bpm ? `${song.bpm} BPM` : null,
      song?.key ? `key of ${song.key}` : null,
      song?.is_one_stop ? 'One-Stop cleared (master + publishing)' : song?.licensing_status || null,
    ].filter(Boolean).join(', ');

    const oppContext = [
      opportunity?.title ? `Opportunity: "${opportunity.title}"` : null,
      opportunity?.description ? `Brief: ${opportunity.description}` : null,
      opportunity?.genres?.length ? `Target genres: ${opportunity.genres.join(', ')}` : null,
      opportunity?.moods?.length ? `Target moods: ${opportunity.moods.join(', ')}` : null,
    ].filter(Boolean).join('\n');

    const systemPrompt = `You are an expert music industry pitch writer with 15+ years placing songs with major labels, sync agencies, and A&R executives. You know exactly what gets a response and what gets deleted.

WHAT A&Rs RESPOND TO:
- Pitches under 80 words — tight, confident, specific
- A concrete sonic description in the first sentence (not "unique" or "amazing" — actual sounds, references, production style)
- One or two specific artist/song comparisons only if they're accurate and relevant
- Clear licensing status upfront — A&Rs need to know if it's clearable
- A direct connection between THIS song and THIS specific brief — not generic
- Confidence without desperation

WHAT KILLS A PITCH:
- Vague adjectives: "powerful", "emotional", "unique", "perfect fit"
- Life story or background before the song is even described
- More than 4 sentences
- Asking if they received it or following up in the same message
- Overselling ("this will be a hit")

TONE GUIDE:
- professional: Direct, no filler. Lead with the song's commercial angle. End with licensing status.
- personal: Warm but still concise. One sentence on personal connection, then straight to the song.
- story: Start with the sonic world of the track — put them inside the feeling first, then facts.

METADATA IMPROVEMENT:
When suggesting genre/mood improvements, be specific. "Alt-R&B" beats "R&B". "Euphoric" beats "Happy". "Melancholic indie pop" beats "Indie". Think about what a music supervisor would search for.

IMPORTANT: Always respond with ONLY a valid JSON object. No markdown, no backticks, no explanation. Just: { "pitch": "...", "metadata_note": "..." }`;

    const userMessage = isPolishMode
      ? `Polish and improve this pitch. Keep the composer's voice but make it sharper, more specific, and more professional. Under 80 words.\n\nComposer: ${composerName || 'the composer'}\nSong: ${songDescription}\n${oppContext}\n\nTheir current draft:\n"${existingPitch}"\n\nReturn JSON only: { "pitch": "improved version", "metadata_note": "one specific suggestion to improve the song metadata tags" }`
      : `Write a ${tone || 'professional'} pitch under 80 words.\n\nComposer: ${composerName || 'the composer'}\nSong: ${songDescription}\n${oppContext}\n\nReturn JSON only: { "pitch": "the pitch text", "metadata_note": "one specific suggestion to improve the song metadata tags" }`;

    console.log('[pitch-helper] calling Anthropic API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    console.log('[pitch-helper] Anthropic response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[pitch-helper] Anthropic API error:', response.status, errText);
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text || '';
    console.log('[pitch-helper] Claude response length:', content.length);

    // Parse JSON from Claude's response — strip any markdown wrappers
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[pitch-helper] Could not find JSON in response:', content);
      throw new Error('Could not parse AI response');
    }
    const parsed = JSON.parse(jsonMatch[0]);

    console.log('[pitch-helper] success, returning pitch');
    return new Response(JSON.stringify({
      pitch: parsed.pitch || '',
      metadata_note: parsed.metadata_note || '',
      mode: isPolishMode ? 'polish' : 'generate',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[pitch-helper] caught error:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
