export default function LandingPage({ onStart }) {
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow{0%,100%{opacity:.4}50%{opacity:.8}}
        .feat:hover{transform:translateY(-4px);border-color:rgba(167,139,250,.4)!important;background:rgba(167,139,250,.08)!important}
        .cta:hover{transform:translateY(-2px);box-shadow:0 20px 60px rgba(90,82,213,.5)!important}
        .fade1{animation:fadeUp .7s ease both}
        .fade2{animation:fadeUp .7s .15s ease both}
        .fade3{animation:fadeUp .7s .3s ease both}
        .fade4{animation:fadeUp .7s .45s ease both}
        .fade5{animation:fadeUp .7s .6s ease both}
      `}</style>

      {/* Glow bg */}
      <div style={S.glow1} />
      <div style={S.glow2} />

      {/* Nav */}
      <nav style={S.nav} className="fade1">
        <div style={S.navLogo}>🧾 Facturo</div>
        <button onClick={onStart} style={S.navBtn}>Connexion</button>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div className="fade1" style={S.badge}>✨ Gestion de factures intelligente</div>

        <h1 className="fade2" style={S.title}>
          Tes factures,<br />
          <span style={S.titleAccent}>enfin sous contrôle</span>
        </h1>

        <p className="fade3" style={S.subtitle}>
          Prends en photo tes factures papier, l'IA extrait toutes les infos automatiquement.<br />
          Rappels, plans de paiement, virements bancaires — tout en un seul endroit.
        </p>

        <div className="fade4" style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={onStart} style={S.ctaBtn} className="cta">
            Commencer gratuitement →
          </button>
          <button onClick={onStart} style={S.ctaGhost}>
            Voir une démo
          </button>
        </div>

        {/* Mockup */}
        <div className="fade5" style={S.mockupWrap}>
          <div style={S.mockup}>
            <div style={S.mockupHeader}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,color:"#E2E8F0"}}>🧾 Facturo</div>
              <div style={{background:"#5A52D5",color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:500}}>+ Ajouter</div>
            </div>
            <div style={S.mockupStats}>
              {[["À payer","1 240 €"],["Factures","8"],["Urgentes","2"]].map(([l,v])=>(
                <div key={l} style={S.mockupStat}>
                  <div style={{fontSize:10,color:"#6B7280",textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{l}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#E2E8F0"}}>{v}</div>
                </div>
              ))}
            </div>
            {[
              {name:"Luminus",amount:"€ 124,50",status:"impayée",color:"#FC8181",days:"J-3"},
              {name:"Proximus",amount:"€ 49,99",status:"plan paiement",color:"#63B3ED",days:"J-12"},
              {name:"Loyer",amount:"€ 850,00",status:"payée",color:"#68D391",days:"payée"},
            ].map(f=>(
              <div key={f.name} style={S.mockupCard}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,color:f.status==="payée"?"#6B7280":"#E2E8F0",textDecoration:f.status==="payée"?"line-through":"none"}}>{f.name}</div>
                    <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{f.days}</div>
                  </div>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"#A78BFA",textAlign:"right"}}>{f.amount}</div>
                    <div style={{fontSize:10,color:f.color,textAlign:"right",marginTop:2}}>{f.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={S.features}>
        <h2 style={S.featTitle} className="fade2">Tout ce dont tu as besoin</h2>
        <div style={S.featGrid}>
          {[
            {icon:"📷", title:"Scan IA", desc:"Prends une photo de ta facture. L'IA extrait le montant, la date, l'IBAN et la communication en quelques secondes."},
            {icon:"📁", title:"Dossiers fournisseurs", desc:"Tes factures sont automatiquement organisées par fournisseur. Luminus, Proximus, taxes — tout est rangé."},
            {icon:"🔔", title:"Rappels intelligents", desc:"Définis un rappel 3, 7 ou 15 jours avant l'échéance. Plus jamais de facture oubliée."},
            {icon:"💳", title:"Virement simplifié", desc:"Copie l'IBAN et la communication en un clic pour les coller directement dans ton app bancaire."},
            {icon:"📋", title:"Plan de paiement", desc:"Divise une grosse facture en 2x, 3x ou 6x. Suis chaque versement et coche au fur et à mesure."},
            {icon:"✅", title:"Suivi des paiements", desc:"Barre tes factures payées d'un tap. Garde une vue claire de ce qui reste à payer."},
          ].map(({icon,title,desc})=>(
            <div key={title} style={S.featCard} className="feat">
              <div style={S.featIcon}>{icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:"#E2E8F0",marginBottom:8}}>{title}</div>
              <div style={{fontSize:13,color:"#8888AA",lineHeight:1.6}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section style={S.ctaSection}>
        <div style={S.ctaBox}>
          <div style={{fontSize:48,marginBottom:16,animation:"float 3s ease-in-out infinite"}}>🧾</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:32,color:"#E2E8F0",marginBottom:12,textAlign:"center"}}>
            Prêt à reprendre le contrôle ?
          </h2>
          <p style={{color:"#8888AA",fontSize:15,marginBottom:28,textAlign:"center",maxWidth:400}}>
            Crée ton compte gratuitement et commence à scanner tes factures en 2 minutes.
          </p>
          <button onClick={onStart} style={{...S.ctaBtn,padding:"16px 48px",fontSize:17}} className="cta">
            Créer mon compte →
          </button>
          <div style={{color:"#6B7280",fontSize:12,marginTop:16}}>Gratuit · Aucune carte bancaire requise</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#E2E8F0",marginBottom:4}}>🧾 Facturo</div>
        <div style={{color:"#6B7280",fontSize:12}}>Gestion de factures intelligente · 2025</div>
      </footer>
    </div>
  );
}

const S = {
  page:      {fontFamily:"'DM Sans',sans-serif",background:"#0A0A14",minHeight:"100vh",color:"#E2E8F0",position:"relative",overflow:"hidden"},
  glow1:     {position:"fixed",top:"-20%",left:"-10%",width:600,height:600,background:"radial-gradient(circle,rgba(90,82,213,.2) 0%,transparent 70%)",pointerEvents:"none",zIndex:0},
  glow2:     {position:"fixed",bottom:"-20%",right:"-10%",width:500,height:500,background:"radial-gradient(circle,rgba(167,139,250,.15) 0%,transparent 70%)",pointerEvents:"none",zIndex:0},
  nav:       {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 40px",borderBottom:"1px solid rgba(255,255,255,.06)",position:"relative",zIndex:10},
  navLogo:   {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:"#E2E8F0"},
  navBtn:    {background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"#E2E8F0",borderRadius:10,padding:"8px 18px",fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"},
  hero:      {textAlign:"center",padding:"80px 20px 60px",position:"relative",zIndex:1},
  badge:     {display:"inline-block",background:"rgba(167,139,250,.12)",border:"1px solid rgba(167,139,250,.3)",borderRadius:20,padding:"6px 16px",fontSize:13,color:"#A78BFA",marginBottom:24},
  title:     {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(36px,6vw,72px)",color:"#E2E8F0",lineHeight:1.1,marginBottom:20},
  titleAccent:{background:"linear-gradient(135deg,#A78BFA,#5A52D5)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  subtitle:  {fontSize:"clamp(14px,2vw,18px)",color:"#8888AA",maxWidth:580,margin:"0 auto 36px",lineHeight:1.7},
  ctaBtn:    {background:"linear-gradient(135deg,#5A52D5,#7C6FFF)",color:"white",border:"none",borderRadius:14,padding:"14px 32px",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,cursor:"pointer",transition:"all .2s",boxShadow:"0 8px 32px rgba(90,82,213,.35)"},
  ctaGhost:  {background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"#E2E8F0",borderRadius:14,padding:"14px 28px",fontFamily:"'DM Sans',sans-serif",fontSize:15,cursor:"pointer"},
  mockupWrap:{marginTop:60,display:"flex",justifyContent:"center"},
  mockup:    {background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:24,padding:20,width:"100%",maxWidth:340,boxShadow:"0 40px 100px rgba(0,0,0,.5)"},
  mockupHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},
  mockupStats:{display:"flex",gap:8,marginBottom:16},
  mockupStat:{flex:1,background:"rgba(255,255,255,.05)",borderRadius:10,padding:"10px 8px",textAlign:"center"},
  mockupCard:{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"12px 14px",marginBottom:8},
  features:  {padding:"80px 40px",position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto"},
  featTitle: {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(28px,4vw,48px)",textAlign:"center",marginBottom:48,color:"#E2E8F0"},
  featGrid:  {display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20},
  featCard:  {background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:18,padding:"28px 24px",transition:"all .25s",cursor:"default"},
  featIcon:  {fontSize:32,marginBottom:14},
  ctaSection:{padding:"80px 20px",display:"flex",justifyContent:"center",position:"relative",zIndex:1},
  ctaBox:    {background:"rgba(90,82,213,.08)",border:"1px solid rgba(90,82,213,.25)",borderRadius:24,padding:"60px 40px",display:"flex",flexDirection:"column",alignItems:"center",maxWidth:600,width:"100%"},
  footer:    {textAlign:"center",padding:"40px 20px",borderTop:"1px solid rgba(255,255,255,.06)",position:"relative",zIndex:1},
};
