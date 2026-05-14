const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, mediaType } = await req.json()
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${image}` } },
            { type: 'text', text: `Analyse cette facture et extrait ces informations en JSON uniquement sans markdown :
{
  "fournisseur": "nom societe",
  "description": "description courte",
  "montant": nombre en euros sans symbole,
  "date_echeance": "YYYY-MM-DD ou null",
  "date_facture": "YYYY-MM-DD ou null",
  "iban": "IBAN ou null",
  "communication": "communication ou null"
}
Reponds UNIQUEMENT avec le JSON.` }
          ]
        }]
      })
    })

    const data = await response.json()
    const text = data.choices[0].message.content
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})