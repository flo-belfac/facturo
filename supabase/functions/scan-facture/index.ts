// Scan de facture par IA (OpenAI Vision).
// Sécurité : seul un UTILISATEUR CONNECTÉ peut appeler cette fonction
// (la clé anon publique ne suffit plus), et chaque utilisateur est limité
// à un nombre de scans par jour pour éviter d'épuiser les crédits OpenAI.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Nombre maximum de scans autorisés par utilisateur et par jour.
const DAILY_LIMIT = 30;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1) Vérifier que l'appelant est un utilisateur authentifié (pas la clé anon).
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return json({ error: "Connexion requise pour scanner une facture." }, 401);
    }

    // 2) Vérifier / incrémenter le quota quotidien via le service_role.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: allowed, error: quotaErr } = await adminClient.rpc("increment_scan_usage", {
      p_user: user.id,
      p_limit: DAILY_LIMIT,
    });
    if (quotaErr) {
      console.error("Quota error:", quotaErr);
      return json({ error: "Erreur de quota." }, 500);
    }
    if (allowed === false) {
      return json({ error: `Limite de ${DAILY_LIMIT} scans par jour atteinte. Réessayez demain.` }, 429);
    }

    // 3) Appel OpenAI Vision pour extraire les infos de la facture.
    const { image, mediaType } = await req.json();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${image}` } },
            { type: "text", text: `Analyse cette facture et extrait en JSON sans markdown :
{
  "fournisseur": "nom societe",
  "description": "description",
  "montant": nombre,
  "date_echeance": "YYYY-MM-DD ou null",
  "date_facture": "YYYY-MM-DD ou null",
  "iban": "IBAN ou null",
  "communication": "communication ou null"
}` },
          ],
        }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI error:", data.error);
      return json({ error: data.error.message }, 500);
    }

    const text = data.choices[0].message.content;
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return json(parsed);
  } catch (error) {
    console.error("Function error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
