// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight (so your React app is allowed to talk to it)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the audio file sent from React
    const formData = await req.formData()
    const audioFile = formData.get('audio') as Blob

    if (!audioFile) {
      throw new Error('No audio file provided')
    }

    // @ts-ignore
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    console.log("Audio received, sending to Whisper...")

    // 2. Send Audio to OpenAI Whisper (Speech-to-Text)
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile, 'voice-memo.webm')
    whisperFormData.append('model', 'whisper-1')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAiKey}` },
      body: whisperFormData,
    })

    const whisperData = await whisperResponse.json()
    if (whisperData.error) throw new Error(`Whisper Error: ${whisperData.error.message}`)
    
    const transcribedText = whisperData.text
    console.log("Transcription successful:", transcribedText)

    // 3. Send Text to GPT to extract the legal splits (Text-to-JSON)
    const systemPrompt = `
      You are an expert music industry split sheet calculator.
      Read the user's transcription of a collaboration.
      Extract every contributor and classify them into the correct ownership category:

      COMPOSITION (Publishing): Songwriters, composers, lyricists, topliners, co-writers — anyone who created the musical work (melody, lyrics, arrangement).
      MASTER (Recording): Producers, recording engineers, featured artists, mix engineers, session musicians with points — anyone involved in creating the specific sound recording.

      If a person contributes to BOTH composition and master, list them in BOTH categories with appropriate percentages.
      Each category MUST total exactly 100% independently.
      If percentages are not explicitly stated, divide evenly among contributors in that category.
      If no contributors are mentioned for a category, return an empty array for it.

      You MUST respond ONLY with a JSON object in this exact format:
      {
        "composition": [
          { "name": "Sarah", "role": "Songwriter", "percentage": 50 },
          { "name": "Mike", "role": "Lyricist", "percentage": 50 }
        ],
        "master": [
          { "name": "John Doe", "role": "Producer", "percentage": 100 }
        ]
      }
    `

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and smart enough for this
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcribedText }
        ]
      }),
    })

    const gptData = await gptResponse.json()
    if (gptData.error) throw new Error(`GPT Error: ${gptData.error.message}`)

    // Parse the JSON string that GPT returned
    const finalResult = JSON.parse(gptData.choices[0].message.content)

    // 4. Send the perfect math back to React!
    return new Response(
      JSON.stringify({
        transcription: transcribedText,
        composition: finalResult.composition || [],
        master: finalResult.master || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("Error processing splits:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})