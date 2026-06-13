import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Construit la charge utile d'un QR de paiement SEPA au standard EPC069-12
// (lu par la plupart des apps bancaires européennes pour pré-remplir un virement).
function buildEpcPayload({ fournisseur, iban, montant, communication }) {
  const name = (fournisseur || "Beneficiaire").slice(0, 70);
  const cleanIban = String(iban || "").replace(/\s+/g, "").toUpperCase();
  const amount = Number(montant) || 0;
  const comm = String(communication || "").slice(0, 140);
  return [
    "BCD",                       // service tag
    "002",                       // version (BIC optionnel)
    "1",                         // jeu de caracteres : UTF-8
    "SCT",                       // SEPA Credit Transfer
    "",                          // BIC (optionnel)
    name,                        // beneficiaire
    cleanIban,                   // IBAN
    `EUR${amount.toFixed(2)}`,   // montant
    "",                          // code purpose (optionnel)
    "",                          // reference structuree (optionnel)
    comm,                        // communication libre
  ].join("\n");
}

function ibanValide(iban) {
  return String(iban || "").replace(/\s+/g, "").length >= 15;
}

export default function SepaQR({ facture }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);
  const hasIban = ibanValide(facture && facture.iban);
  const amount = Number(facture && facture.montant) || 0;

  useEffect(() => {
    if (!hasIban || amount <= 0) return;
    let alive = true;
    QRCode.toDataURL(buildEpcPayload(facture), {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0b0f0c", light: "#ffffff" },
    })
      .then((u) => { if (alive) { setUrl(u); setError(false); } })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facture && facture.iban, facture && facture.montant, facture && facture.fournisseur, facture && facture.communication]);

  if (!hasIban || amount <= 0) return null;

  return (
    <div style={{ textAlign: "center", marginTop: 18, marginBottom: 6 }}>
      <div style={{ fontSize: 12, color: "#8a8070", marginBottom: 12 }}>
        Scannez ce code avec votre app bancaire pour payer
      </div>
      {url ? (
        <img
          src={url}
          alt="QR de paiement SEPA"
          style={{ width: 200, height: 200, borderRadius: 14, background: "#fff", padding: 12, display: "inline-block" }}
        />
      ) : error ? (
        <div style={{ color: "#FC8181", fontSize: 13 }}>QR indisponible</div>
      ) : (
        <div style={{ color: "#8a8070", fontSize: 13 }}>Generation du QR...</div>
      )}
      <div style={{ fontSize: 11, color: "#4a7a5a", marginTop: 10 }}>
        Compatible avec la plupart des apps bancaires (norme QR SEPA / EPC)
      </div>
    </div>
  );
}
