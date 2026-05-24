import { useState, useEffect, useRef } from "react";
import { Home, BarChart2, Bell, ArrowLeft, X, Paperclip, Camera, Image, Pen, CheckCircle, Trash2, Plus, Copy, Check, Search } from "lucide-react";

const STORAGE_KEY = "payday-factures-v1";
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://jihdihqgyvtzboqwuzmr.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppaGRpaHFneXZ0emJvcXd1em1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjc4NjIsImV4cCI6MjA5MzkwMzg2Mn0.Bs8d_crq6hKkAYQlXR2CCZdCk4HoLKgTNMgU-kla714";

const statusColors = {
  impayee:         { bg: "rgba(252,129,129,0.15)", text: "#FC8181", dot: "#FC8181" },
  "plan paiement": { bg: "rgba(99,179,237,0.15)",  text: "#63B3ED", dot: "#63B3ED" },
  payee:           { bg: "rgba(104,211,145,0.15)",  text: "#68D391", dot: "#68D391" },
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

export default function App({ user, onLogout }) {
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
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const fileRef = useRef();
  const cameraRef = useRef();
  const annexeFileRef = useRef();

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) setFactures(JSON.parse(data));
    } catch {}
  }, []);

  const save = (data) => {
    setFactures(data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
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
      showToast("Annexe ajoutee");
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (dataUrl) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      const max = 1200;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      if (h > max) { w = Math.round(w * max / h); h = max; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = dataUrl;
  });

  const scanFacture = async () => {
    if (!previewImg) return;
    setScanning(true);
    try {
      const compressed = await compressImage(previewImg);
      const base64 = compressed.split(",")[1];
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-facture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ image: base64, mediaType: "image/jpeg" })
      });
      const parsed = await res.json();
      if (parsed.error) throw new Error(parsed.error);
      setScanResult(parsed);
      setForm({
        fournisseur: parsed.fournisseur || "",
        description: parsed.description || "",
        montant: parsed.montant != null ? String(parsed.montant) : "",
        date: parsed.date_echeance || parsed.date_facture || "",
        iban: parsed.iban || "",
        communication: parsed.communication || "",
      });
      showToast("Infos extraites !");
    } catch (err) {
      showToast("Erreur: " + err.message, "err");
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
      statut: "impayee",
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
    showToast(`Facture ${f.fournisseur} ajoutee`);
  };

  const updateFacture = (id, updates) => {
    const updated = factures.map(f => f.id === id ? { ...f, ...updates } : f);
    save(updated);
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }));
  };

  const supprimerFacture = (id) => {
    save(factures.filter(f => f.id !== id));
    setView("list");
    showToast("Facture supprimee");
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => showToast("Copie non supportee", "err"));
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
    const planData = plan.dates.map((d, i) => ({ date: d, montant: parseFloat(plan.montant), paye: false, numero: i + 1 }));
    const annexe = { id: Date.now(), type: "plan", name: `Plan ${plan.nb}x paiements`, data: planData, addedAt: new Date().toISOString() };
    const f = factures.find(x => x.id === selected.id);
    updateFacture(selected.id, { statut: "plan paiement", planPaiement: planData, annexes: [...(f?.annexes || []), annexe] });
    setPlanModal(false);
    showToast("Plan de paiement cree");
  };

  const dossiers = [...new Set(factures.map(f => f.fournisseur))].map(name => ({
    name,
    factures: factures.filter(f => f.fournisseur === name),
    total: factures.filter(f => f.fournisseur === name && f.statut !== "payee").reduce((s, f) => s + f.montant, 0),
  }));

  const listeAffichee = (dossierFilter ? factures.filter(f => f.fournisseur === dossierFilter) : factures)
    .filter(f => filterStatut === "tous" || f.statut === filterStatut)
    .filter(f => !search || f.fournisseur.toLowerCase().includes(search.toLowerCase()) || (f.description||"").toLowerCase().includes(search.toLowerCase()) || String(f.montant).includes(search));
  const totalImpaye = factures.filter(f => f.statut !== "payee").reduce((s, f) => s + f.montant, 0);
  const urgentes = factures.filter(f => { const d = daysUntil(f.date); return f.statut !== "payee" && d !== null && d <= 7; });
  const currentFacture = selected ? (factures.find(x => x.id === selected.id) || selected) : null;

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#2a2010;border-radius:4px}
        @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes tin{from{transform:translateY(70px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        .hov:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.4)!important}
        .btn:hover{filter:brightness(1.1)}
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
            }}><ArrowLeft size={16}/></button>
          )}
          <div style={{animation:"float 4s ease-in-out infinite"}}>
            <div style={{...S.logo,background:"linear-gradient(90deg,#00FF88,#00FFCC,#00FF88)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"shimmer 2s linear infinite"}}>PayDay</div>
            {view === "list" && !dossierFilter && <div style={S.sub}>Vos factures, sous contrôle</div>}
            {dossierFilter && <div style={S.sub}>📁 {dossierFilter}</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {view === "list" && (
            <button style={S.addBtn} className="btn" onClick={() => setSourceModal(true)}>+ Ajouter</button>
          )}
          <button style={{...S.ghostBtn,padding:"8px 12px",fontSize:12,color:"#8a8070"}} className="btn" onClick={onLogout}>Déco</button>
        </div>
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

        {/* LIST */}
        {view === "list" && (
          <div style={{animation:"up .3s ease"}}>
            <div style={S.statsRow}>
              <div style={S.stat}><div style={S.statL}>A payer</div><div style={S.statV}>{fmt(totalImpaye)}</div></div>
              <div style={S.stat}><div style={S.statL}>Factures</div><div style={S.statV}>{factures.length}</div></div>
              <div style={{...S.stat,...(urgentes.length>0?{background:"rgba(252,129,129,.1)",borderColor:"rgba(252,129,129,.3)"}:{})}}>
                <div style={S.statL}>Urgentes</div>
                <div style={{...S.statV,color:urgentes.length>0?"#FC8181":undefined}}>{urgentes.length}</div>
              </div>
            </div>

            {dossiers.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={S.secLabel}>Dossiers fournisseurs</div>
                <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
                  {dossiers.map(d => (
                    <button key={d.name} style={S.chip} className="btn" onClick={() => setDossierFilter(d.name)}>
                      <span style={{fontWeight:700,fontSize:13,color:"#F5F0E8"}}>{d.name}</span>
                      <span style={{fontSize:11,color:"#8a8070",marginTop:2}}>{d.factures.length} facture{d.factures.length>1?"s":""}</span>
                      {d.total > 0 && <span style={{fontSize:12,color:"#FC8181",marginTop:1}}>{fmt(d.total)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SEARCH */}
            <div style={{position:"relative",marginBottom:12}}>
              <Search size={15} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#4a7a5a"}}/>
              <input
                style={{...S.inp,paddingLeft:36,fontSize:13}}
                placeholder="Rechercher une facture..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",color:"#4a7a5a"}}><X size={14}/></button>}
            </div>

            {/* FILTERS */}
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
              {[["tous","Toutes"],["impayee","Impayées"],["plan paiement","En plan"],["payee","Payées"]].map(([val,lbl]) => (
                <button key={val} onClick={() => setFilterStatut(val)} style={{
                  background:filterStatut===val?"linear-gradient(135deg,#00FF88,#00FFCC)":"rgba(0,255,136,0.05)",
                  border:"1px solid rgba(0,255,136,0.15)",
                  borderRadius:20,
                  padding:"6px 14px",
                  fontSize:12,
                  color:filterStatut===val?"#050D08":"#4a7a5a",
                  cursor:"pointer",
                  whiteSpace:"nowrap",
                  fontFamily:"'DM Sans',sans-serif",
                  fontWeight:filterStatut===val?600:400,
                  transition:"all 0.2s",
                  flexShrink:0,
                }}>{lbl}</button>
              ))}
            </div>

            <div style={S.secLabel}>Toutes les factures</div>

            {listeAffichee.length === 0 ? (
              <div style={S.empty}>
                <div style={{marginBottom:14,opacity:0.4}}><BarChart2 size={52} color="#00FF88"/></div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,marginBottom:8}}>Aucune facture</div>
                <div style={{color:"#6B7280",fontSize:14,marginBottom:24}}>Appuyez sur Ajouter pour commencer</div>
                <button style={{...S.addBtn,padding:"12px 28px"}} className="btn" onClick={() => setSourceModal(true)}>Ajouter une facture</button>
              </div>
            ) : (
              listeAffichee.map(f => {
                const days = daysUntil(f.date);
                const urgent = days !== null && days <= 7 && f.statut !== "payee";
                return (
                  <div key={f.id} style={{...S.card,borderLeft:`3px solid ${urgent?"#FC8181":statusColors[f.statut]?.dot||"#00FF88"}`,opacity:f.statut==="payee"?.6:1}}
                    className="hov" onClick={() => { setSelected(f); setTab("infos"); setView("detail"); }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:17,textDecoration:f.statut==="payee"?"line-through":"none"}}>{f.fournisseur}</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:"#00FF88"}}>{fmt(f.montant)}</div>
                    </div>
                    {f.description && <div style={{fontSize:13,color:"#8a8070",marginBottom:8}}>{f.description}</div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                      <span style={{...S.badge,...(statusColors[f.statut]||statusColors.impayee)}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:(statusColors[f.statut]||statusColors.impayee)?.dot,display:"inline-block",marginRight:5}}/>
                        {f.statut}
                      </span>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        {f.annexes?.length > 0 && <span style={{fontSize:11,color:"#8a8070"}}><Paperclip size={12} style={{marginRight:3}}/>{f.annexes.length}</span>}
                        {f.rappel && <span style={{fontSize:13,color:"#00FF88"}}>🔔</span>}
                        {f.date && <span style={{fontSize:12,color:urgent?"#FC8181":"#8a8070"}}>{urgent?"⚠ ":""}{fmtDate(f.date)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SCAN */}
        {view === "scan" && (
          <div style={{animation:"up .3s ease"}}>
            <div style={S.pageTitle}>Nouvelle facture</div>

            {previewImg && (
              <div style={{background:"rgba(0,255,136,.04)",border:"1px solid rgba(0,255,136,.12)",borderRadius:14,padding:12,marginBottom:16}}>
                <img src={previewImg} alt="" style={{width:"100%",borderRadius:10,maxHeight:200,objectFit:"contain"}} />
                {!scanResult && !scanning && (
                  <button style={{...S.addBtn,width:"100%",marginTop:12}} className="btn" onClick={scanFacture}>
                    Analyser la facture
                  </button>
                )}
                {scanning && <div style={{textAlign:"center",color:"#00FF88",padding:"12px 0",animation:"pulse 1.2s infinite"}}>Analyse en cours...</div>}
                {scanResult && <div style={{textAlign:"center",color:"#68D391",padding:"8px 0",fontSize:13}}>Informations extraites ✓</div>}
              </div>
            )}

            {[
              {k:"fournisseur",l:"Fournisseur / Societe",p:"EDF, Orange, Proximus..."},
              {k:"description",l:"Description",p:"Facture electricite, abonnement..."},
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
                <label style={S.lbl}>Date echeance</label>
                <input style={S.inp} type="date" value={form.date} onChange={e=>setForm(v=>({...v,date:e.target.value}))} />
              </div>
            </div>

            <div style={S.fg}>
              <label style={S.lbl}>IBAN beneficiaire</label>
              <input style={S.inp} placeholder="BE XX XXXX XXXX XXXX" value={form.iban} onChange={e=>setForm(v=>({...v,iban:e.target.value}))} />
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Communication / Reference</label>
              <input style={S.inp} placeholder="+++123/456/789+++" value={form.communication} onChange={e=>setForm(v=>({...v,communication:e.target.value}))} />
            </div>

            <button style={{...S.addBtn,width:"100%",padding:14,marginTop:4}} className="btn" onClick={ajouterFacture}>Enregistrer la facture</button>
            <button style={{...S.ghostBtn,width:"100%",marginTop:10}} className="btn" onClick={() => setSourceModal(true)}>Changer de photo</button>
          </div>
        )}

        {/* DETAIL */}
        {view === "detail" && currentFacture && (() => {
          const f = currentFacture;
          const days = daysUntil(f.date);
          const urgent = days !== null && days <= 7 && f.statut !== "payee";
          return (
            <div style={{animation:"up .3s ease"}}>
              <div style={{...S.card,marginBottom:14}}>
                {f.image && <img src={f.image} alt="" style={{width:"100%",borderRadius:10,maxHeight:140,objectFit:"contain",marginBottom:12,background:"#111"}} />}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,textDecoration:f.statut==="payee"?"line-through":"none"}}>{f.fournisseur}</div>
                    {f.description && <div style={{color:"#8a8070",fontSize:13,marginTop:2}}>{f.description}</div>}
                  </div>
                  <span style={{...S.badge,...(statusColors[f.statut]||statusColors.impayee),fontSize:12,flexShrink:0,marginLeft:8}}>{f.statut}</span>
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:36,color:"#00FF88",margin:"8px 0 6px"}}>{fmt(f.montant)}</div>
                {f.date && (
                  <div style={{color:urgent?"#FC8181":"#8a8070",fontSize:13}}>
                    Echeance : {fmtDate(f.date)} {days!==null?`(${days===0?"Aujourd'hui":days<0?`En retard de ${Math.abs(days)}j`:`J-${days}`})`:""}
                  </div>
                )}
              </div>

              <div style={S.tabs}>
                {[["infos","Infos"],["virement","Virement"],["annexes","Annexes"]].map(([id,lbl]) => (
                  <button key={id} style={{...S.tabBtn,borderBottom:tab===id?"2px solid #00FF88":"2px solid transparent",color:tab===id?"#00FF88":"#8a8070"}}
                    onClick={() => setTab(id)}>{lbl}</button>
                ))}
              </div>

              {tab === "infos" && (
                <div>
                  <div style={S.block}>
                    <div style={S.blockTitle}>Rappel de paiement</div>
                    {f.rappel ? (
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(0,255,136,.08)",border:"1px solid rgba(0,255,136,.2)",borderRadius:11,padding:"12px 14px"}}>
                        <div>
                          <div style={{color:"#00FF88",fontSize:14,fontWeight:500}}>Rappel le {fmtDate(f.rappel)}</div>
                          {f.rappelJours > 0 && <div style={{color:"#8a8070",fontSize:12,marginTop:2}}>{f.rappelJours} jours avant</div>}
                        </div>
                        <button style={{background:"transparent",border:"none",color:"#FC8181",fontSize:18,cursor:"pointer"}}
                          onClick={() => updateFacture(f.id,{rappel:null,rappelJours:null})}><X size={14}/></button>
                      </div>
                    ) : (
                      <button style={{...S.ghostBtn,width:"100%"}} className="btn" onClick={() => setRappelModal(true)}>+ Definir un rappel</button>
                    )}
                  </div>

                  {f.statut !== "payee" && (
                    <div style={S.block}>
                      <div style={S.blockTitle}>Plan de paiement</div>
                      {f.planPaiement ? (
                        f.planPaiement.map((p,i) => (
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid rgba(0,255,136,.08)",fontSize:14}}>
                            <div><span>Versement {p.numero}</span><span style={{color:"#00FF88",fontWeight:700,marginLeft:10}}>{fmt(p.montant)}</span></div>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{color:"#8a8070",fontSize:12}}>{fmtDate(p.date)}</span>
                              <input type="checkbox" checked={p.paye} style={{width:18,height:18,accentColor:"#00FF88",cursor:"pointer"}}
                                onChange={() => {
                                  const up = f.planPaiement.map((x,j)=>j===i?{...x,paye:!x.paye}:x);
                                  updateFacture(f.id,{planPaiement:up,statut:up.every(x=>x.paye)?"payee":"plan paiement"});
                                }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <button style={{...S.ghostBtn,width:"100%"}} className="btn" onClick={openPlanModal}>Creer un plan de paiement</button>
                      )}
                    </div>
                  )}

                  <div style={{display:"flex",gap:10,marginTop:8}}>
                    {f.statut !== "payee" ? (
                      <button style={{...S.addBtn,flex:1,padding:13}} className="btn" onClick={() => { updateFacture(f.id,{statut:"payee"}); showToast("Facture payee"); }}>
                        Marquer payee
                      </button>
                    ) : (
                      <button style={{...S.ghostBtn,flex:1,padding:13}} className="btn" onClick={() => updateFacture(f.id,{statut:"impayee"})}>
                        Remettre impayee
                      </button>
                    )}
                    <button style={{...S.ghostBtn,flex:1,padding:13,color:"#FC8181",borderColor:"rgba(252,129,129,.25)"}} className="btn" onClick={() => supprimerFacture(f.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              )}

              {tab === "virement" && (
                <div style={{...S.block,background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.15)",borderRadius:14,padding:"16px 16px 10px"}}>
                  <div style={{...S.blockTitle,marginBottom:4}}>Infos pour le virement</div>
                  <div style={{fontSize:12,color:"#8a8070",marginBottom:16}}>Appuyez sur Copier puis collez dans votre app bancaire</div>

                  {[
                    {label:"Beneficiaire", value:f.fournisseur, k:"ben"},
                    {label:"Montant", value:fmt(f.montant), k:"amt"},
                    {label:"IBAN", value:f.iban, k:"iban"},
                    {label:"Communication", value:f.communication, k:"comm"},
                  ].filter(x=>x.value).map(({label,value,k}) => (
                    <div key={k} style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:"#8a8070",textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>{label}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.04)",border:"1px solid rgba(0,255,136,.1)",borderRadius:10,padding:"11px 13px"}}>
                        <span style={{fontSize:14,color:"#F5F0E8",fontWeight:500,wordBreak:"break-all",flex:1}}>{value}</span>
                        <button className="btn" style={{background:copied===k?"rgba(104,211,145,.2)":"rgba(0,255,136,.15)",border:"none",color:copied===k?"#68D391":"#00FF88",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",marginLeft:10,flexShrink:0,transition:"all .2s"}}
                          onClick={() => copyToClipboard(k==="amt"?String(f.montant):value, k)}>
                          {copied===k?"Copie":"Copier"}
                        </button>
                      </div>
                    </div>
                  ))}

                  {!f.iban && !f.communication && (
                    <div style={{color:"#8a8070",fontSize:13,padding:"10px 0",textAlign:"center"}}>Aucun IBAN ni communication enregistre.</div>
                  )}

                  <button style={{...S.addBtn,width:"100%",marginTop:6}} className="btn"
                    onClick={() => {
                      const lines = [`Beneficiaire: ${f.fournisseur}`,`Montant: ${fmt(f.montant)}`,f.iban?`IBAN: ${f.iban}`:"",f.communication?`Communication: ${f.communication}`:""].filter(Boolean).join("\n");
                      copyToClipboard(lines,"all");
                      showToast("Toutes les infos copiees");
                    }}>
                    Tout copier
                  </button>
                </div>
              )}

              {tab === "annexes" && (
                <div>
                  <div style={{display:"flex",gap:10,marginBottom:16}}>
                    <button style={{...S.addBtn,flex:1,padding:12,fontSize:13}} className="btn" onClick={() => annexeFileRef.current.click()}>
                      Ajouter une photo
                    </button>
                    <button style={{...S.ghostBtn,flex:1,padding:12,fontSize:13}} className="btn"
                      onClick={() => {
                        const note = window.prompt("Note ou remarque :");
                        if (note?.trim()) {
                          const a = {id:Date.now(),type:"note",name:"Note",data:note.trim(),addedAt:new Date().toISOString()};
                          updateFacture(f.id,{annexes:[...(f.annexes||[]),a]});
                          showToast("Note ajoutee");
                        }
                      }}>
                      Ajouter une note
                    </button>
                  </div>

                  {(!f.annexes || f.annexes.length===0) ? (
                    <div style={{textAlign:"center",padding:"36px 20px",color:"#6B7280"}}>
                      <div style={{marginBottom:10,opacity:0.3}}><Paperclip size={40} color="#00FF88"/></div>
                      <div>Aucune annexe</div>
                    </div>
                  ) : (
                    f.annexes.map((a,i) => (
                      <div key={a.id} style={{...S.card,marginBottom:10,padding:"13px"}}>
                        {a.type==="image" && (
                          <div>
                            <img src={a.data} alt={a.name} style={{width:"100%",borderRadius:8,maxHeight:160,objectFit:"contain",background:"#111",marginBottom:8}} />
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:12,color:"#8a8070"}}>{a.name}</span>
                              <button style={{background:"transparent",border:"none",color:"#FC8181",cursor:"pointer"}}
                                onClick={() => updateFacture(f.id,{annexes:f.annexes.filter((_,j)=>j!==i)})}><X size={14}/></button>
                            </div>
                          </div>
                        )}
                        {a.type==="note" && (
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontSize:11,color:"#8a8070",marginBottom:4}}>Note - {fmtDate(a.addedAt)}</div>
                              <div style={{fontSize:14,color:"#F5F0E8"}}>{a.data}</div>
                            </div>
                            <button style={{background:"transparent",border:"none",color:"#FC8181",cursor:"pointer",marginLeft:10}}
                              onClick={() => updateFacture(f.id,{annexes:f.annexes.filter((_,j)=>j!==i)})}><X size={14}/></button>
                          </div>
                        )}
                        {a.type==="plan" && (
                          <div>
                            <div style={{fontSize:11,color:"#00FF88",marginBottom:8}}>Plan paiement - {fmtDate(a.addedAt)}</div>
                            {a.data.map((p,j) => (
                              <div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:"1px solid rgba(0,255,136,.08)"}}>
                                <span>Versement {p.numero} - {fmt(p.montant)}</span>
                                <span style={{color:"#8a8070"}}>{fmtDate(p.date)}</span>
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
          <button style={{...S.navBtn,color:"#00FF88"}}><Home size={20}/><br/><span style={{fontSize:10}}>Accueil</span></button>
          <button style={S.navBtn} onClick={() => showToast(`${factures.filter(f=>f.statut!=="payee").length} factures — ${fmt(totalImpaye)} a payer`)}>
            📊<br/><span style={{fontSize:10}}>Resume</span>
          </button>
          <button style={S.navBtn} onClick={() => {
            const r=factures.filter(f=>f.rappel).length;
            showToast(r>0?`${r} rappel(s) actif(s)`:"Aucun rappel defini");
          }}><Bell size={20}/><br/><span style={{fontSize:10}}>Rappels</span></button>
        </div>
      )}

      {/* MODAL SOURCE */}
      {sourceModal && (
        <div style={S.overlay} onClick={() => setSourceModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>Ajouter une facture</div>
            <div style={{color:"#8a8070",fontSize:13,marginBottom:18}}>Comment voulez-vous importer votre facture ?</div>
            {[
              {icon:"📷",title:"Prendre une photo",sub:"Ouvre l'appareil photo",fn:()=>cameraRef.current.click()},
              {icon:"🖼️",title:"Depuis la galerie",sub:"Choisir une photo existante",fn:()=>fileRef.current.click()},
              {icon:"✏️",title:"Saisie manuelle",sub:"Entrer les infos a la main",fn:()=>{setPreviewImg(null);setScanResult(null);setForm({fournisseur:"",description:"",montant:"",date:"",iban:"",communication:""});setSourceModal(false);setView("scan");}},
            ].map(({icon,title,sub,fn}) => (
              <button key={title} style={S.srcBtn} className="btn" onClick={fn}>
                <span style={{fontSize:28,flexShrink:0}}>{icon}</span>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#F5F0E8"}}>{title}</div>
                  <div style={{fontSize:12,color:"#8a8070",marginTop:2}}>{sub}</div>
                </div>
              </button>
            ))}
            <button style={{...S.ghostBtn,width:"100%",marginTop:6,color:"#8a8070"}} onClick={() => setSourceModal(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* MODAL RAPPEL */}
      {rappelModal && currentFacture && (
        <div style={S.overlay} onClick={() => setRappelModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>Definir un rappel</div>
            {currentFacture.date && (
              <div>
                <div style={{fontSize:13,color:"#8a8070",marginBottom:12}}>Rappel avant l echeance :</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
                  {RAPPEL_PRESETS.map(({label,days}) => (
                    <button key={days} style={{...S.ghostBtn,padding:"9px 14px",fontSize:13}} className="btn"
                      onClick={() => {
                        const date = computeRappelDate(currentFacture.date, days);
                        updateFacture(currentFacture.id,{rappel:date,rappelJours:days});
                        setRappelModal(false);
                        showToast(`Rappel le ${fmtDate(date)}`);
                      }}>{label}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={S.fg}>
              <label style={S.lbl}>Date de rappel</label>
              <input type="date" style={S.inp} id="rappel-date" />
            </div>
            <button style={{...S.addBtn,width:"100%",marginTop:8}} className="btn"
              onClick={() => {
                const val = document.getElementById("rappel-date").value;
                if(val){updateFacture(currentFacture.id,{rappel:val,rappelJours:null});setRappelModal(false);showToast(`Rappel le ${fmtDate(val)}`);}
              }}>Confirmer</button>
            <button style={{...S.ghostBtn,width:"100%",marginTop:8}} className="btn" onClick={() => setRappelModal(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* MODAL PLAN */}
      {planModal && (
        <div style={S.overlay} onClick={() => setPlanModal(false)}>
          <div style={{...S.modal,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>Plan de paiement</div>
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
  app:       {fontFamily:"'DM Sans',sans-serif",background:"#080D0A",minHeight:"100vh",color:"#F5F0E8",display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",position:"relative"},
  header:    {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 18px 12px",borderBottom:"1px solid rgba(0,255,136,.1)",background:"rgba(13,13,8,.97)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:10},
  logo:      {fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#F5F0E8",letterSpacing:1},
  sub:       {fontSize:11,color:"#8a8070",marginTop:1,fontFamily:"'DM Sans',sans-serif"},
  backBtn:   {background:"rgba(0,255,136,.08)",border:"1px solid rgba(0,255,136,.15)",color:"#00FF88",fontSize:17,width:34,height:34,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  addBtn:    {background:"linear-gradient(135deg,#00FF88,#00FF88)",color:"#050D08",border:"none",borderRadius:11,padding:"9px 16px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,cursor:"pointer",transition:"all .2s"},
  ghostBtn:  {background:"transparent",border:"1px solid rgba(0,255,136,.2)",color:"#F5F0E8",borderRadius:11,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",transition:"all .2s",textAlign:"center"},
  content:   {flex:1,padding:"14px 18px 100px",overflowY:"auto"},
  statsRow:  {display:"flex",gap:8,marginBottom:18},
  stat:      {flex:1,background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.1)",borderRadius:13,padding:"13px 10px",textAlign:"center"},
  statL:     {fontSize:10,color:"#8a8070",textTransform:"uppercase",letterSpacing:.5,marginBottom:3,fontFamily:"'DM Sans',sans-serif"},
  statV:     {fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:19,color:"#F5F0E8"},
  secLabel:  {fontSize:11,color:"#8a8070",textTransform:"uppercase",letterSpacing:.6,marginBottom:10,fontFamily:"'DM Sans',sans-serif"},
  chip:      {background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.15)",borderRadius:12,padding:"10px 14px",display:"flex",flexDirection:"column",alignItems:"flex-start",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,minWidth:100,transition:"all .2s"},
  card:      {background:"rgba(0,255,136,.03)",border:"1px solid rgba(0,255,136,.08)",borderRadius:13,padding:"15px",marginBottom:10,cursor:"pointer",transition:"all .2s"},
  badge:     {fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,display:"inline-flex",alignItems:"center"},
  empty:     {textAlign:"center",padding:"50px 20px",display:"flex",flexDirection:"column",alignItems:"center"},
  pageTitle: {fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,marginBottom:16,color:"#F5F0E8"},
  fg:        {marginBottom:13},
  lbl:       {fontSize:11,color:"#8a8070",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5,fontFamily:"'DM Sans',sans-serif"},
  inp:       {width:"100%",background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.12)",borderRadius:9,padding:"11px 13px",color:"#F5F0E8",fontFamily:"'DM Sans',sans-serif",fontSize:14,colorScheme:"dark"},
  tabs:      {display:"flex",borderBottom:"1px solid rgba(0,255,136,.1)",marginBottom:16,gap:2},
  tabBtn:    {flex:1,background:"transparent",border:"none",padding:"10px 4px",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",transition:"all .2s",fontWeight:500},
  block:     {marginBottom:16},
  blockTitle:{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,marginBottom:12,color:"#F5F0E8"},
  nav:       {position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(13,13,8,.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(0,255,136,.1)",display:"flex",padding:"8px 0 20px",zIndex:10},
  navBtn:    {flex:1,background:"transparent",border:"none",color:"#8a8070",fontSize:18,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",padding:"4px 0",lineHeight:1.5},
  toast:     {position:"fixed",bottom:86,left:"50%",transform:"translateX(-50%)",padding:"11px 22px",borderRadius:28,color:"white",fontWeight:500,fontSize:13,zIndex:999,boxShadow:"0 8px 24px rgba(0,0,0,.5)",whiteSpace:"nowrap"},
  overlay:   {position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  modal:     {background:"#141408",border:"1px solid rgba(0,255,136,.15)",borderRadius:"18px 18px 0 0",padding:"22px 18px 36px",width:"100%",maxWidth:430},
  modalTitle:{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,marginBottom:8,color:"#F5F0E8"},
  srcBtn:    {display:"flex",alignItems:"center",gap:14,width:"100%",padding:"15px",borderRadius:13,marginBottom:9,textAlign:"left",cursor:"pointer",background:"rgba(0,255,136,.04)",border:"1px solid rgba(0,255,136,.1)",transition:"all .2s"},
};