// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      throw new Error('No image file provided')
    }

    // @ts-ignore
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OpenAI API key is missing from Supabase secrets')
    }

    console.log("📸 Image received, converting to base64 using heavy-duty encoder...")

    // 1. Convert the image safely, no matter how big it is!
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = encodeBase64(arrayBuffer)
    const mimeType = imageFile.type || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    console.log("🤖 Sending to OpenAI Vision...")

    // 2. Instruct the AI Lawyer
    const systemPrompt = `
      You are an expert music industry split sheet calculator.
      Read the handwritten notes, screenshot, or text in the provided image.
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

    // 3. Send the Image to GPT-4o
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: "text", text: "Extract the exact music splits from this image." },
              { type: "image_url", image_url: { url: dataUrl } }
            ] 
          }
        ]
      }),
    })

    const gptData = await gptResponse.json()
    if (gptData.error) throw new Error(`GPT Error: ${gptData.error.message}`)

    // 4. Send the perfect math back to React!
    const finalResult = JSON.parse(gptData.choices[0].message.content)

    return new Response(
      JSON.stringify({
        composition: finalResult.composition || [],
        master: finalResult.master || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("Error processing image splits:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})