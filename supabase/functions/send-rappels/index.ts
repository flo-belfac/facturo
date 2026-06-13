// Edge Function : envoi des rappels de paiement par email.
// Déclenchée chaque matin par une tâche planifiée (voir migration cron).
// Cherche les factures dont la date de rappel == aujourd'hui (non payées),
// envoie un email au propriétaire via Resend, puis marque le rappel comme envoyé.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

function emailHtml(facture: Record<string, unknown>) {
  const fournisseur = String(facture.fournisseur ?? "votre facture");
  const montant = fmtEur(Number(facture.montant) || 0);
  const echeance = fmtDate((facture.date as string) ?? null);
  const iban = facture.iban ? String(facture.iban) : null;
  const comm = facture.communication ? String(facture.communication) : null;

  return `<!doctype html><html><body style="margin:0;background:#080D0A;font-family:Arial,Helvetica,sans-serif;color:#F5F0E8;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:rgba(0,255,136,0.03);border:1px solid rgba(0,255,136,0.15);border-radius:16px;padding:28px">
    <div style="font-size:22px;font-weight:bold;letter-spacing:2px;color:#00FF88;margin-bottom:4px">Factura</div>
    <div style="font-size:13px;color:#8a8070;margin-bottom:24px">Rappel de paiement</div>
    <div style="font-size:18px;font-weight:bold;margin-bottom:6px">${fournisseur}</div>
    <div style="font-size:32px;font-weight:bold;color:#00FF88;margin:8px 0">${montant}</div>
    <div style="font-size:14px;color:#FC8181;margin-bottom:20px">Échéance : ${echeance}</div>
    ${iban ? `<div style="font-size:13px;color:#8a8070;margin-bottom:4px">IBAN : <span style="color:#F5F0E8">${iban}</span></div>` : ""}
    ${comm ? `<div style="font-size:13px;color:#8a8070;margin-bottom:4px">Communication : <span style="color:#F5F0E8">${comm}</span></div>` : ""}
    <div style="margin-top:24px;font-size:12px;color:#4a7a5a">Cet email vous est envoyé automatiquement par Factura parce que vous avez programmé un rappel pour cette facture.</div>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Protection : seul un appel portant le bon secret est accepté (la tâche cron le fournit).
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RAPPELS_FROM_EMAIL") || "Factura <onboarding@resend.dev>";
    if (!resendKey) throw new Error("RESEND_API_KEY manquant");

    const today = new Date().toISOString().split("T")[0];

    const { data: rows, error } = await supabase.from("factures").select("id, user_id, data");
    if (error) throw error;

    // Factures dont le rappel tombe aujourd'hui, non payées, pas déjà notifiées aujourd'hui.
    const dues = (rows || []).filter((r) => {
      const d = (r.data || {}) as Record<string, unknown>;
      return d.rappel === today && d.statut !== "payee" && d.rappel_envoye !== today;
    });

    let sent = 0;
    const results: unknown[] = [];

    for (const r of dues) {
      const d = (r.data || {}) as Record<string, unknown>;

      // Email du propriétaire de la facture
      const { data: u } = await supabase.auth.admin.getUserById(r.user_id as string);
      const email = u?.user?.email;
      if (!email) {
        results.push({ id: r.id, skipped: "aucun email" });
        continue;
      }

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: `Rappel : ${d.fournisseur ?? "facture"} — ${fmtEur(Number(d.montant) || 0)} à payer`,
          html: emailHtml(d),
        }),
      });

      if (resp.ok) {
        sent++;
        // Marque comme envoyé pour éviter un doublon le même jour
        await supabase.from("factures").update({ data: { ...d, rappel_envoye: today } }).eq("id", r.id);
        results.push({ id: r.id, to: email, ok: true });
      } else {
        const errText = await resp.text();
        results.push({ id: r.id, to: email, ok: false, error: errText });
      }
    }

    return new Response(JSON.stringify({ today, due: dues.length, sent, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
