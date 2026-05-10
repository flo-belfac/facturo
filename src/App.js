import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "factures-v2";

const statusColors = {
  impayée:        { bg: "rgba(252,129,129,0.15)", text: "#FC8181", dot: "#FC8181" },
  "plan paiement":{ bg: "rgba(99,179,237,0.15)",  text: "#63B3ED", dot: "#63B3ED" },
  payée:          { bg: "rgba(104,211,145,0.15)",  text: "#68D391", dot: "#68D391" },
};

const fmt = (a) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(a || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

const RAPPEL_PRESETS = [
  { label: "Jour J", days: 0 },
  { label: "3 jours avant", days: 3 },
  { label: "7 jours avant", days: 7 },
  { label: "15 jours avant", days: 15 },
  { label: "1 mois avant", days: 30 },
];

function computeRappelDate(dueDate, daysBefore) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  d.setDate(d.getDate() - daysBefore);
  return d.toISOString().split("T")[0];
}

export default function App() {
  const [factures, setFactures] = useState([]);
  const [view, setView] = useState("list");
  const [tab, setTab] = useState("infos");
  const [selected, setSelected] = useState(null);
  const [dossierFilter, setDossierFilter] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [form, setForm] = useState({ fournisseur: "", description: "", montant: "", date: "", iban: "", communication: "" });
  const [sourceModal, setSourceModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [plan, setPlan] = useState({ nb: 3, montant: "", dates: [] });
  const [rappelModal, setRappelModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(null);
  const fileRef = useRef();
  const cameraRef = useRef();
  const annexeFileRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r?.value) setFactures(JSON.parse(r.value));
      } catch {}
    })();
  }, []);

  const save = (data) => {
    setFactures(data);
    window.storage.set(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  };

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewImg(ev.target.result);
      setScanResult(null);
      setForm({ fournisseur: "", description: "", montant: "", date: "", iban: "", communication: "" });
      setSourceModal(false);
      setView("scan");
    };
    reader.readAsDataURL(file);
  };

  const handleAnnexeFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const annexe = { id: Date.now(), type: "image", name: file.name, data: ev.target.result, addedAt: new Date().toISOString() };
      const updated = factures.map(f => f.id === selected.id ? { ...f, annexes: [...(f.annexes || []), annexe] } : f);
      save(updated);
      setSelected(prev => ({ ...prev, annexes: [...(prev.annexes || []), annexe] }));
      showToast("Annexe ajoutée ✓");
    };
    reader.readAsDataURL(file);
  };

  const scanFacture = async () => {
    if (!previewImg) return;
    setScanning(true);
    try {
      const base64 = previewImg.split(",")[1];
      const mediaType = previewImg.split(";")[0].split(":")[1];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: `Analyse cette facture et extrait ces informations en JSON uniquement (sans markdown) :
{
  "fournisseur": "nom société/service",
  "description": "description courte",
  "montant": nombre en euros sans symbole,
  "date_echeance": "YYYY-MM-DD ou null",
  "date_facture": "YYYY-MM-DD ou null",
  "iban": "IBAN du bénéficiaire ou null",
  "communication": "communication structurée ou référence de paiement ou null"
}
Réponds UNIQUEMENT avec le JSON.` }
            ]
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setScanResult(parsed);
      setForm({
        fournisseur: parsed.fournisseur || "",
        description: parsed.description || "",
        montant: parsed.montant?.toString() || "",
        date: parsed.date_echeance || parsed.date_facture || "",
        iban: parsed.iban || "",
        communication: parsed.communication || "",
      });
    } catch {
      showToast("Erreur scan — remplissez manuellement", "err");
    }
    setScanning(false);
  };

  const ajouterFacture = () => {
    const f = {
      id: Date.now(),
      fournisseur: form.fournisseur || "Fournisseur inconnu",
      description: form.description || "",
      montant: parseFloat(form.montant) || 0,
      date: form.date || null,
      iban: form.iban || null,
      communication: form.communication || null,
      statut: "impayée",
      planPaiement: null,
      rappel: null,
      rappelJours: null,
      annexes: [],
      image: previewImg,
      createdAt: new Date().toISOString(),
    };
    save([f, ...factures]);
    setView("list");
    setPreviewImg(null);
    setScanResult(null);
    showToast(`Facture ${f.fournisseur} ajoutée ✓`);
  };

  const updateFacture = (id, updates) => {
    const updated = factures.map(f => f.id === id ? { ...f, ...updates } : f);
    save(updated);
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }));
  };

  const supprimerFacture = (id) => {
    save(factures.filter(f => f.id !== id));
    setView("list");
    showToast("Facture supprimée");
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => showToast("Copie non supportée", "err"));
  };

  const openPlanModal = () => {
    const nb = 3;
    const montantPart = ((selected?.montant || 0) / nb).toFixed(2);
    const dates = Array.from({ length: nb }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i + 1);
      return d.toISOString().split("T")[0];
    });
    setPlan({ nb, montant: montantPart, dates });
    setPlanModal(true);
  };

  const savePlan = () => {
    const planData = plan.dates.map((d, i) => ({ date: d, montant: parseFloat(plan.montant), payé: false, numero: i + 1 }));
    const annexe = { id: Date.now(), type: "plan", name: `Plan ${plan.nb}x paiements`, data: planData, addedAt: new Date().toISOString() };
    const f = factures.find(x => x.id === selected.id);
    updateFacture(selected.id, { statut: "plan paiement", planPaiement: planData, annexes: [...(f?.annexes || []), annexe] });
    setPlanModal(false);
    showToast("Plan de paiement créé ✓");
  };

  const dossiers = [...new Set(factures.map(f => f.fournisseur))].map(name => ({
    name,
    factures: factures.filter(f => f.fournisseur === name),
    total: factures.filter(f => f.fournisseur === name && f.statut !== "payée").reduce((s, f) => s + f.montant, 0),
  }));

  const listeAffichée = dossierFilter ? factures.filter(f => f.fournisseur === dossierFilter) : factures;
  const totalImpayé = factures.filter(f => f.statut !== "payée").reduce((s, f) => s + f.montant, 0);
  const urgentes = factures.filter(f => { const d = daysUntil(f.date); return f.statut !== "payée" && d !== null && d <= 7; });
  const currentFacture = selected ? (factures.find(x => x.id === selected.id) || selected) : null;

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:4px}
        @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes tin{from{transform:translateY(70px);opacity:0}to{transform:translateY(0);opacity:1}}
        .hov:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.4)!important}
        .btn:hover{filter:brightness(1.12)}
        input,select{outline:none}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.4}
      `}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {(view !== "list" || dossierFilter) && (
            <button style={S.backBtn} onClick={() => {
              if (dossierFilter) { setDossierFilter(null); return; }
              setView("list"); setSelected(null); setTab("infos");
            }}>←</button>
          )}
          <div>
            <div style={S.logo}>🧾 Facturo</div>
            {view === "list" && !dossierFilter && <div style={S.sub}>Gestion de factures intelligente</div>}
            {dossierFilter && <div style={S.sub}>📁 {dossierFilter}</div>}
          </div>
        </div>
        {view === "list" && (
          <button style={S.addBtn} className="btn" onClick={() => setSourceModal(true)}>+ Ajouter</button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}} />
      <input ref={annexeFileRef} type="file" accept="image/*,application/pdf" onChange={handleAnnexeFile} style={{display:"none"}} />

      {toast && (
        <div style={{...S.toast,background:toast.type==="err"?"#C53030":"#276749",animation:"tin .3s ease"}}>
          {toast.msg}
        </div>
      )}

      <div style={S.content}>

        {/* ── LIST ── */}
        {view === "list" && (
          <div style={{animation:"up .3s ease"}}>
            <div style={S.statsRow}>
              <div style={S.stat}><div style={S.statL}>À payer</div><div style={S.statV}>{fmt(totalImpayé)}</div></div>
              <div style={S.stat}><div style={S.statL}>Factures</div><div style={S.statV}>{factures.length}</div></div>
              <div style={{...S.stat,...(urgentes.length>0?{background:"rgba(252,129,129,.1)",borderColor:"rgba(252,129,129,.3)"}:{})}}>
                <div style={S.statL}>Urgentes</div>
                <div style={{...S.statV,color:urgentes.length>0?"#FC8181":undefined}}>{urgentes.length}</div>
              </div>
            </div>

            {dossiers.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={S.secLabel}>📁 Dossiers fournisseurs</div>
                <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
                  {dossiers.map(d => (
                    <button key={d.name} style={S.chip} className="btn" onClick={() => setDossierFilter(d.name)}>
                      <span style={{fontWeight:700,fontSize:13,color:"#E2E8F0"}}>{d.name}</span>
                      <span style={{fontSize:11,color:"#8888AA",marginTop:2}}>{d.factures.length} facture{d.factures.length>1?"s":""}</span>
                      {d.total > 0 && <span style={{fontSize:12,color:"#FC8181",marginTop:1}}>{fmt(d.total)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={S.secLabel}>Toutes les factures</div>

            {listeAffichée.length === 0 ? (
              <div style={S.empty}>
                <div style={{fontSize:52,marginBottom:14}}>🧾</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:8}}>Aucune facture</div>
                <div style={{color:"#6B7280",fontSize:14,marginBottom:24}}>Appuie sur "+ Ajouter" pour commencer</div>
                <button style={{...S.addBtn,padding:"12px 28px"}} className="btn" onClick={() => setSourceModal(true)}>📷 Scanner une facture</button>
              </div>
            ) : (
              listeAffichée.map(f => {
                const days = daysUntil(f.date);
                const urgent = days !== null && days <= 7 && f.statut !== "payée";
                return (
                  <div key={f.id} style={{...S.card,borderLeft:`3px solid ${urgent?"#FC8181":statusColors[f.statut]?.dot}`,opacity:f.statut==="payée"?.6:1}}
                    className="hov" onClick={() => { setSelected(f); setTab("infos"); setView("detail"); }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,textDecoration:f.statut==="payée"?"line-through":"none"}}>{f.fournisseur}</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#A78BFA"}}>{fmt(f.montant)}</div>
                    </div>
                    {f.description && <div style={{fontSize:13,color:"#8888AA",marginBottom:8}}>{f.description}</div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                      <span style={{...S.badge,...statusColors[f.statut]}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:statusColors[f.statut]?.dot,display:"inline-block",marginRight:5}}/>
                        {f.statut}
                      </span>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        {f.annexes?.length > 0 && <span style={{fontSize:11,color:"#8888AA"}}>📎 {f.annexes.length}</span>}
                        {f.rappel && <span style={{fontSize:13,color:"#F6AD55"}}>🔔</span>}
                        {f.date && <span style={{fontSize:12,color:urgent?"#FC8181":"#8888AA"}}>{urgent?"⚠ ":""}{fmtDate(f.date)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── SCAN ── */}
        {view === "scan" && (
          <div style={{animation:"up .3s ease"}}>
            <div style={S.pageTitle}>Nouvelle facture</div>

            {previewImg && (
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:12,marginBottom:16}}>
                <img src={previewImg} alt="" style={{width:"100%",borderRadius:10,maxHeight:200,objectFit:"contain"}} />
                {!scanResult && !scanning && (
                  <button style={{...S.addBtn,width:"100%",marginTop:12}} className="btn" onClick={scanFacture}>✨ Scanner avec l'IA</button>
                )}
                {scanning && <div style={{textAlign:"center",color:"#A78BFA",padding:"12px 0",animation:"pulse 1.2s infinite"}}>🔍 Analyse en cours…</div>}
                {scanResult && <div style={{textAlign:"center",color:"#68D391",padding:"8px 0",fontSize:13}}>✓ Infos extraites — vérifiez ci-dessous</div>}
              </div>
            )}

            {[
              {k:"fournisseur",l:"Fournisseur / Société",p:"EDF, Orange, Proximus…"},
              {k:"description",l:"Description",p:"Facture électricité, abonnement…"},
            ].map(({k,l,p}) => (
              <div key={k} style={S.fg}>
                <label style={S.lbl}>{l}</label>
                <input style={S.inp} placeholder={p} value={form[k]} onChange={e => setForm(v=>({...v,[k]:e.target.value}))} />
              </div>
            ))}

            <div style={{display:"flex",gap:12}}>
              <div style={{...S.fg,flex:1}}>
                <label style={S.lbl}>Montant (€)</label>
                <input style={S.inp} type="number" placeholder="0.00" value={form.montant} onChange={e=>setForm(v=>({...v,montant:e.target.value}))} />
              </div>
              <div style={{...S.fg,flex:1}}>
                <label style={S.lbl}>Date d'échéance</label>
                <input style={S.inp} type="date" value={form.date} onChange={e=>setForm(v=>({...v,date:e.target.value}))} />
              </div>
            </div>

            <div style={S.fg}>
              <label style={S.lbl}>IBAN bénéficiaire</label>
              <input style={S.inp} placeholder="BE XX XXXX XXXX XXXX" value={form.iban} onChange={e=>setForm(v=>({...v,iban:e.target.value}))} />
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Communication / Référence</label>
              <input style={S.inp} placeholder="+++123/456/789+++" value={form.communication} onChange={e=>setForm(v=>({...v,communication:e.target.value}))} />
            </div>

            <button style={{...S.addBtn,width:"100%",padding:14,marginTop:4}} className="btn" onClick={ajouterFacture}>💾 Enregistrer</button>
            <button style={{...S.ghostBtn,width:"100%",marginTop:10}} className="btn" onClick={() => setSourceModal(true)}>📷 Changer de photo</button>
          </div>
        )}

        {/* ── DETAIL ── */}
        {view === "detail" && currentFacture && (() => {
          const f = currentFacture;
          const days = daysUntil(f.date);
          const urgent = days !== null && days <= 7 && f.statut !== "payée";
          return (
            <div style={{animation:"up .3s ease"}}>
              <div style={{...S.card,marginBottom:14}}>
                {f.image && <img src={f.image} alt="" style={{width:"100%",borderRadius:10,maxHeight:140,objectFit:"contain",marginBottom:12,background:"#111"}} />}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,textDecoration:f.statut==="payée"?"line-through":"none"}}>{f.fournisseur}</div>
                    {f.description && <div style={{color:"#8888AA",fontSize:13,marginTop:2}}>{f.description}</div>}
                  </div>
                  <span style={{...S.badge,...statusColors[f.statut],fontSize:12,flexShrink:0,marginLeft:8}}>{f.statut}</span>
                </div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:34,color:"#A78BFA",margin:"8px 0 6px"}}>{fmt(f.montant)}</div>
                {f.date && (
                  <div style={{color:urgent?"#FC8181":"#8888AA",fontSize:13}}>
                    📅 {fmtDate(f.date)} {days!==null?`(${days===0?"Aujourd'hui":days<0?`En retard de ${Math.abs(days)}j`:`J-${days}`})`:""}
                  </div>
                )}
              </div>

              {/* TABS */}
              <div style={S.tabs}>
                {[["infos","ℹ️ Infos"],["virement","💳 Virement"],["annexes","📎 Annexes"]].map(([id,lbl]) => (
                  <button key={id} style={{...S.tabBtn,borderBottom:tab===id?"2px solid #A78BFA":"2px solid transparent",color:tab===id?"#A78BFA":"#8888AA"}}
                    onClick={() => setTab(id)}>{lbl}</button>
                ))}
              </div>

              {/* TAB INFOS */}
              {tab === "infos" && (
                <div>
                  <div style={S.block}>
                    <div style={S.blockTitle}>🔔 Rappel de paiement</div>
                    {f.rappel ? (
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(246,173,85,.1)",border:"1px solid rgba(246,173,85,.25)",borderRadius:11,padding:"12px 14px"}}>
                        <div>
                          <div style={{color:"#F6AD55",fontSize:14,fontWeight:500}}>Rappel le {fmtDate(f.rappel)}</div>
                          {f.rappelJours > 0 && <div style={{color:"#8888AA",fontSize:12,marginTop:2}}>{f.rappelJours} jours avant l'échéance</div>}
                        </div>
                        <button style={{background:"transparent",border:"none",color:"#FC8181",fontSize:18,cursor:"pointer"}}
                          onClick={() => updateFacture(f.id,{rappel:null,rappelJours:null})}>✕</button>
                      </div>
                    ) : (
                      <button style={{...S.ghostBtn,width:"100%"}} className="btn" onClick={() => setRappelModal(true)}>+ Définir un rappel</button>
                    )}
                  </div>

                  {f.statut !== "payée" && (
                    <div style={S.block}>
                      <div style={S.blockTitle}>💳 Plan de paiement</div>
                      {f.planPaiement ? (
                        f.planPaiement.map((p,i) => (
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,.06)",fontSize:14}}>
                            <div><span>Versement {p.numero}</span><span style={{color:"#A78BFA",fontWeight:700,marginLeft:10}}>{fmt(p.montant)}</span></div>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{color:"#8888AA",fontSize:12}}>{fmtDate(p.date)}</span>
                              <input type="checkbox" checked={p.payé} style={{width:18,height:18,accentColor:"#68D391",cursor:"pointer"}}
                                onChange={() => {
                                  const up = f.planPaiement.map((x,j)=>j===i?{...x,payé:!x.payé}:x);
                                  updateFacture(f.id,{planPaiement:up,statut:up.every(x=>x.payé)?"payée":"plan paiement"});
                                }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <button style={{...S.ghostBtn,width:"100%"}} className="btn" onClick={openPlanModal}>Créer un plan de paiement</button>
                      )}
                    </div>
                  )}

                  <div style={{display:"flex",gap:10,marginTop:8}}>
                    {f.statut !== "payée" ? (
                      <button style={{...S.addBtn,flex:1,padding:13}} className="btn" onClick={() => { updateFacture(f.id,{statut:"payée"}); showToast("Facture payée ✓"); }}>
                        ✅ Marquer payée
                      </button>
                    ) : (
                      <button style={{...S.ghostBtn,flex:1,padding:13}} className="btn" onClick={() => updateFacture(f.id,{statut:"impayée"})}>
                        ↩ Remettre impayée
                      </button>
                    )}
                    <button style={{...S.ghostBtn,flex:1,padding:13,color:"#FC8181",borderColor:"rgba(252,129,129,.25)"}} className="btn" onClick={() => supprimerFacture(f.id)}>
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              )}

              {/* TAB VIREMENT */}
              {tab === "virement" && (
                <div style={{...S.block,background:"rgba(167,139,250,.07)",border:"1px solid rgba(167,139,250,.2)",borderRadius:14,padding:"16px 16px 10px"}}>
                  <div style={{...S.blockTitle,marginBottom:4}}>💳 Infos pour le virement bancaire</div>
                  <div style={{fontSize:12,color:"#8888AA",marginBottom:16}}>Appuie sur "Copier" puis colle dans ton app bancaire</div>

                  {[
                    {label:"Bénéficiaire", value:f.fournisseur, k:"ben"},
                    {label:"Montant", value:fmt(f.montant), k:"amt"},
                    {label:"IBAN", value:f.iban, k:"iban"},
                    {label:"Communication", value:f.communication, k:"comm"},
                  ].filter(x=>x.value).map(({label,value,k}) => (
                    <div key={k} style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:"#8888AA",textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>{label}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:10,padding:"11px 13px"}}>
                        <span style={{fontSize:14,color:"#E2E8F0",fontWeight:500,wordBreak:"break-all",flex:1}}>{value}</span>
                        <button className="btn" style={{background:copied===k?"rgba(104,211,145,.2)":"rgba(167,139,250,.2)",border:"none",color:copied===k?"#68D391":"#A78BFA",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",marginLeft:10,flexShrink:0,transition:"all .2s"}}
                          onClick={() => copyToClipboard(k==="amt"?String(f.montant):value, k)}>
                          {copied===k?"✓ Copié":"Copier"}
                        </button>
                      </div>
                    </div>
                  ))}

                  {!f.iban && !f.communication && (
                    <div style={{color:"#8888AA",fontSize:13,padding:"10px 0",textAlign:"center"}}>Aucun IBAN ni communication enregistré.</div>
                  )}

                  <button style={{...S.addBtn,width:"100%",marginTop:6}} className="btn"
                    onClick={() => {
                      const lines = [`Bénéficiaire: ${f.fournisseur}`,`Montant: ${fmt(f.montant)}`,f.iban?`IBAN: ${f.iban}`:"",f.communication?`Communication: ${f.communication}`:""].filter(Boolean).join("\n");
                      copyToClipboard(lines,"all");
                      showToast("Toutes les infos copiées ✓");
                    }}>
                    📋 Tout copier d'un coup
                  </button>
                </div>
              )}

              {/* TAB ANNEXES */}
              {tab === "annexes" && (
                <div>
                  <div style={{display:"flex",gap:10,marginBottom:16}}>
                    <button style={{...S.addBtn,flex:1,padding:12,fontSize:13}} className="btn" onClick={() => annexeFileRef.current.click()}>
                      📷 Photo / Document
                    </button>
                    <button style={{...S.ghostBtn,flex:1,padding:12,fontSize:13}} className="btn"
                      onClick={() => {
                        const note = window.prompt("Remarque ou note :");
                        if (note?.trim()) {
                          const a = {id:Date.now(),type:"note",name:"Note",data:note.trim(),addedAt:new Date().toISOString()};
                          updateFacture(f.id,{annexes:[...(f.annexes||[]),a]});
                          showToast("Note ajoutée ✓");
                        }
                      }}>
                      📝 Ajouter une note
                    </button>
                  </div>

                  {(!f.annexes || f.annexes.length===0) ? (
                    <div style={{textAlign:"center",padding:"36px 20px",color:"#6B7280"}}>
                      <div style={{fontSize:40,marginBottom:10}}>📎</div>
                      <div>Aucune annexe</div>
                      <div style={{fontSize:12,marginTop:6}}>Documents, notes, plan de paiement…</div>
                    </div>
                  ) : (
                    f.annexes.map((a,i) => (
                      <div key={a.id} style={{...S.card,marginBottom:10,padding:"13px"}}>
                        {a.type==="image" && (
                          <div>
                            <img src={a.data} alt={a.name} style={{width:"100%",borderRadius:8,maxHeight:160,objectFit:"contain",background:"#111",marginBottom:8}} />
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:12,color:"#8888AA"}}>{a.name}</span>
                              <button style={{background:"transparent",border:"none",color:"#FC8181",cursor:"pointer"}}
                                onClick={() => updateFacture(f.id,{annexes:f.annexes.filter((_,j)=>j!==i)})}>✕</button>
                            </div>
                          </div>
                        )}
                        {a.type==="note" && (
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontSize:11,color:"#8888AA",marginBottom:4}}>📝 {fmtDate(a.addedAt)}</div>
                              <div style={{fontSize:14,color:"#E2E8F0"}}>{a.data}</div>
                            </div>
                            <button style={{background:"transparent",border:"none",color:"#FC8181",cursor:"pointer",marginLeft:10}}
                              onClick={() => updateFacture(f.id,{annexes:f.annexes.filter((_,j)=>j!==i)})}>✕</button>
                          </div>
                        )}
                        {a.type==="plan" && (
                          <div>
                            <div style={{fontSize:11,color:"#63B3ED",marginBottom:8}}>💳 PLAN PAIEMENT · {fmtDate(a.addedAt)}</div>
                            {a.data.map((p,j) => (
                              <div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                                <span>Versement {p.numero} — {fmt(p.montant)}</span>
                                <span style={{color:"#8888AA"}}>{fmtDate(p.date)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* NAV */}
      {view === "list" && !dossierFilter && (
        <div style={S.nav}>
          <button style={{...S.navBtn,color:"#A78BFA"}}>🏠<br/><span style={{fontSize:10}}>Accueil</span></button>
          <button style={S.navBtn} onClick={() => showToast(`${factures.filter(f=>f.statut!=="payée").length} factures · ${fmt(totalImpayé)} à payer`)}>
            📊<br/><span style={{fontSize:10}}>Résumé</span>
          </button>
          <button style={S.navBtn} onClick={() => {
            const r=factures.filter(f=>f.rappel).length;
            showToast(r>0?`${r} rappel(s) actif(s)`:"Aucun rappel défini");
          }}>🔔<br/><span style={{fontSize:10}}>Rappels</span></button>
        </div>
      )}

      {/* MODAL SOURCE */}
      {sourceModal && (
        <div style={S.overlay} onClick={() => setSourceModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>Ajouter une facture</div>
            <div style={{color:"#8888AA",fontSize:13,marginBottom:18}}>Comment veux-tu importer ta facture ?</div>
            {[
              {icon:"📷",title:"Prendre une photo",sub:"Ouvre l'appareil photo",fn:()=>cameraRef.current.click()},
              {icon:"🖼️",title:"Depuis la galerie",sub:"Choisir une photo existante",fn:()=>fileRef.current.click()},
              {icon:"✏️",title:"Saisie manuelle",sub:"Entrer les infos à la main",fn:()=>{setPreviewImg(null);setScanResult(null);setForm({fournisseur:"",description:"",montant:"",date:"",iban:"",communication:""});setSourceModal(false);setView("scan");}},
            ].map(({icon,title,sub,fn}) => (
              <button key={title} style={S.srcBtn} className="btn" onClick={fn}>
                <span style={{fontSize:28,flexShrink:0}}>{icon}</span>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#E2E8F0"}}>{title}</div>
                  <div style={{fontSize:12,color:"#8888AA",marginTop:2}}>{sub}</div>
                </div>
              </button>
            ))}
            <button style={{...S.ghostBtn,width:"100%",marginTop:6,color:"#8888AA"}} onClick={() => setSourceModal(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* MODAL RAPPEL */}
      {rappelModal && currentFacture && (
        <div style={S.overlay} onClick={() => setRappelModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>🔔 Définir un rappel</div>
            {currentFacture.date && (
              <div>
                <div style={{fontSize:13,color:"#8888AA",marginBottom:12}}>Rappel automatique avant l'échéance :</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
                  {RAPPEL_PRESETS.map(({label,days}) => (
                    <button key={days} style={{...S.ghostBtn,padding:"9px 14px",fontSize:13}} className="btn"
                      onClick={() => {
                        const date = computeRappelDate(currentFacture.date, days);
                        updateFacture(currentFacture.id,{rappel:date,rappelJours:days});
                        setRappelModal(false);
                        showToast(`Rappel le ${fmtDate(date)} ✓`);
                      }}>{label}</button>
                  ))}
                </div>
                <div style={{color:"#8888AA",fontSize:12,textAlign:"center",marginBottom:12}}>— ou une date précise —</div>
              </div>
            )}
            <div style={S.fg}>
              <label style={S.lbl}>Date de rappel</label>
              <input type="date" style={S.inp} id="rappel-date" />
            </div>
            <button style={{...S.addBtn,width:"100%",marginTop:8}} className="btn"
              onClick={() => {
                const val = document.getElementById("rappel-date").value;
                if(val){updateFacture(currentFacture.id,{rappel:val,rappelJours:null});setRappelModal(false);showToast(`Rappel le ${fmtDate(val)} ✓`);}
              }}>Confirmer</button>
            <button style={{...S.ghostBtn,width:"100%",marginTop:8}} className="btn" onClick={() => setRappelModal(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* MODAL PLAN */}
      {planModal && (
        <div style={S.overlay} onClick={() => setPlanModal(false)}>
          <div style={{...S.modal,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>💳 Plan de paiement</div>
            <div style={{display:"flex",gap:12}}>
              <div style={{...S.fg,flex:1}}>
                <label style={S.lbl}>Nb versements</label>
                <select style={S.inp} value={plan.nb} onChange={e=>{
                  const nb=parseInt(e.target.value);
                  const m=((selected?.montant||0)/nb).toFixed(2);
                  const dates=Array.from({length:nb},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()+i+1);return d.toISOString().split("T")[0];});
                  setPlan({nb,montant:m,dates});
                }}>
                  {[2,3,4,6,12].map(n=><option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
              <div style={{...S.fg,flex:1}}>
                <label style={S.lbl}>Montant / versement</label>
                <input style={S.inp} type="number" value={plan.montant} onChange={e=>setPlan(p=>({...p,montant:e.target.value}))} />
              </div>
            </div>
            {plan.dates.map((d,i)=>(
              <div key={i} style={S.fg}>
                <label style={S.lbl}>Date versement {i+1}</label>
                <input style={S.inp} type="date" value={d} onChange={e=>setPlan(p=>({...p,dates:p.dates.map((x,j)=>j===i?e.target.value:x)}))} />
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button style={{...S.addBtn,flex:1}} className="btn" onClick={savePlan}>Confirmer</button>
              <button style={{...S.ghostBtn,flex:1}} className="btn" onClick={()=>setPlanModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  app:       {fontFamily:"'DM Sans',sans-serif",background:"#0F0F1A",minHeight:"100vh",color:"#E2E8F0",display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",position:"relative"},
  header:    {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 18px 12px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(15,15,26,.97)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:10},
  logo:      {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:19,color:"#E2E8F0"},
  sub:       {fontSize:11,color:"#6B7280",marginTop:1},
  backBtn:   {background:"rgba(255,255,255,.08)",border:"none",color:"#E2E8F0",fontSize:17,width:34,height:34,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  addBtn:    {background:"#5A52D5",color:"white",border:"none",borderRadius:11,padding:"9px 16px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:14,cursor:"pointer",transition:"all .2s"},
  ghostBtn:  {background:"transparent",border:"1px solid rgba(255,255,255,.15)",color:"#E2E8F0",borderRadius:11,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",transition:"all .2s",textAlign:"center"},
  content:   {flex:1,padding:"14px 18px 100px",overflowY:"auto"},
  statsRow:  {display:"flex",gap:8,marginBottom:18},
  stat:      {flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,padding:"13px 10px",textAlign:"center"},
  statL:     {fontSize:10,color:"#6B7280",textTransform:"uppercase",letterSpacing:.5,marginBottom:3},
  statV:     {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:"#E2E8F0"},
  secLabel:  {fontSize:11,color:"#6B7280",textTransform:"uppercase",letterSpacing:.6,marginBottom:10},
  chip:      {background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 14px",display:"flex",flexDirection:"column",alignItems:"flex-start",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,minWidth:100,transition:"all .2s"},
  card:      {background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:13,padding:"15px",marginBottom:10,cursor:"pointer",transition:"all .2s"},
  badge:     {fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,display:"inline-flex",alignItems:"center"},
  empty:     {textAlign:"center",padding:"50px 20px",display:"flex",flexDirection:"column",alignItems:"center"},
  pageTitle: {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:16,color:"#E2E8F0"},
  fg:        {marginBottom:13},
  lbl:       {fontSize:11,color:"#8888AA",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5},
  inp:       {width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,padding:"11px 13px",color:"#E2E8F0",fontFamily:"'DM Sans',sans-serif",fontSize:14,colorScheme:"dark"},
  tabs:      {display:"flex",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:16,gap:2},
  tabBtn:    {flex:1,background:"transparent",border:"none",padding:"10px 4px",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",transition:"all .2s",fontWeight:500},
  block:     {marginBottom:16},
  blockTitle:{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginBottom:12,color:"#E2E8F0"},
  nav:       {position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(15,15,26,.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",padding:"8px 0 20px",zIndex:10},
  navBtn:    {flex:1,background:"transparent",border:"none",color:"#6B7280",fontSize:18,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",padding:"4px 0",lineHeight:1.5},
  toast:     {position:"fixed",bottom:86,left:"50%",transform:"translateX(-50%)",padding:"11px 22px",borderRadius:28,color:"white",fontWeight:500,fontSize:13,zIndex:999,boxShadow:"0 8px 24px rgba(0,0,0,.5)",whiteSpace:"nowrap"},
  overlay:   {position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  modal:     {background:"#1A1A2E",borderRadius:"18px 18px 0 0",padding:"22px 18px 36px",width:"100%",maxWidth:430},
  modalTitle:{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:19,marginBottom:8,color:"#E2E8F0"},
  srcBtn:    {display:"flex",alignItems:"center",gap:14,width:"100%",padding:"15px",borderRadius:13,marginBottom:9,textAlign:"left",cursor:"pointer",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",transition:"all .2s"},
};
