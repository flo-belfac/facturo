export default function LandingPage({ onStart }) {
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .feat:hover{transform:translateY(-4px);border-color:rgba(212,175,55,.4)!important;background:rgba(212,175,55,.06)!important}
        .cta:hover{transform:translateY(-2px);box-shadow:0 20px 60px rgba(212,175,55,.3)!important}
        .fade1{animation:fadeUp .7s ease both}
        .fade2{animation:fadeUp .7s .15s ease both}
        .fade3{animation:fadeUp .7s .3s ease both}
        .fade4{animation:fadeUp .7s .45s ease both}
        .fade5{animation:fadeUp .7s .6s ease both}
        .nav-btn:hover{background:rgba(212,175,55,.1)!important;color:#D4AF37!important}
      `}</style>

      <div style={S.glow1} />
      <div style={S.glow2} />

      {/* Nav */}
      <nav style={S.nav} className="fade1">
        <div style={S.navLogo}>🧾 Facturo</div>
        <button onClick={onStart} style={S.navBtn} className="nav-btn">Connexion</button>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div className="fade1" style={S.badge}>✦ Gestion de factures simplifiée</div>

        <h1 className="fade2" style={S.title}>
          Vos factures,<br />
          <span style={S.titleAccent}>sous contrôle</span>
        </h1>

        <p className="fade3" style={S.subtitle}>
          Prenez en photo vos factures papier, Facturo extrait toutes les informations automatiquement.<br />
          Rappels, plans de paiement, virements — tout en un seul endroit.
        </p>

        <div className="fade4" style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={onStart} style={S.ctaBtn} className="cta">
            Commencer gratuitement →
          </button>
          <button onClick={onStart} style={S.ctaGhost}>
            En savoir plus
          </button>
        </div>

        {/* Mockup */}
        <div className="fade5" style={S.mockupWrap}>
          <div style={S.mockup}>
            <div style={S.mockupHeader}>
              <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"#F5F0E8"}}>🧾 Facturo</div>
              <div style={{background:"linear-gradient(135deg,#D4AF37,#F5D76E)",color:"#1a1a0a",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600}}>+ Ajouter</div>
            </div>
            <div style={S.mockupStats}>
              {[["À payer","1 240 €"],["Factures","8"],["Urgentes","2"]].map(([l,v])=>(
                <div key={l} style={S.mockupStat}>
                  <div style={{fontSize:10,color:"#8a8070",textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{l}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:"#F5F0E8"}}>{v}</div>
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
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:f.status==="payée"?"#6B7280":"#F5F0E8",textDecoration:f.status==="payée"?"line-through":"none"}}>{f.name}</div>
                    <div style={{fontSize:11,color:"#8a8070",marginTop:2}}>{f.days}</div>
                  </div>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"#D4AF37",textAlign:"right"}}>{f.amount}</div>
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
        <div style={{textAlign:"center",marginBottom:12}}>
          <div style={{...S.badge,display:"inline-block"}}>✦ Fonctionnalités</div>
        </div>
        <h2 style={S.featTitle}>Tout ce dont vous avez besoin</h2>
        <div style={S.featGrid}>
          {[
            {icon:"📷", title:"Scan automatique", desc:"Prenez en photo votre facture. Facturo détecte et extrait le montant, la date, l'IBAN et la communication en quelques secondes."},
            {icon:"📁", title:"Dossiers fournisseurs", desc:"Vos factures sont organisées automatiquement par fournisseur. Luminus, Proximus, taxes — tout est rangé et accessible."},
            {icon:"🔔", title:"Rappels intelligents", desc:"Définissez un rappel 3, 7 ou 15 jours avant l'échéance. Ne ratez plus jamais une date de paiement."},
            {icon:"💳", title:"Virement simplifié", desc:"Copiez l'IBAN et la communication en un clic pour les coller directement dans votre application bancaire."},
            {icon:"📋", title:"Plan de paiement", desc:"Divisez une facture importante en plusieurs versements. Suivez chaque paiement et cochez au fur et à mesure."},
            {icon:"✅", title:"Suivi des paiements", desc:"Marquez vos factures comme payées en un tap. Gardez une vue claire de ce qui reste à régler."},
          ].map(({icon,title,desc})=>(
            <div key={title} style={S.featCard} className="feat">
              <div style={S.featIcon}>{icon}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:"#F5F0E8",marginBottom:8}}>{title}</div>
              <div style={{fontSize:13,color:"#8a8070",lineHeight:1.7}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={S.ctaSection}>
        <div style={S.ctaBox}>
          <div style={{fontSize:48,marginBottom:16,animation:"float 3s ease-in-out infinite"}}>🧾</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:32,color:"#F5F0E8",marginBottom:12,textAlign:"center"}}>
            Prêt à reprendre le contrôle ?
          </h2>
          <p style={{color:"#8a8070",fontSize:15,marginBottom:28,textAlign:"center",maxWidth:400,lineHeight:1.7}}>
            Créez votre compte gratuitement et commencez à gérer vos factures en 2 minutes.
          </p>
          <button onClick={onStart} style={{...S.ctaBtn,padding:"16px 48px",fontSize:17}} className="cta">
            Créer mon compte →
          </button>
          <div style={{color:"#6B7280",fontSize:12,marginTop:16}}>Gratuit · Aucune carte bancaire requise</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,color:"#D4AF37",marginBottom:6}}>🧾 Facturo</div>
        <div style={{color:"#6B7280",fontSize:12}}>Gestion de factures simplifiée · 2025</div>
      </footer>
    </div>
  );
}

const S = {
  page:      {fontFamily:"'Inter',sans-serif",background:"#0D0D08",minHeight:"100vh",color:"#F5F0E8",position:"relative",overflow:"hidden"},
  glow1:     {position:"fixed",top:"-20%",left:"-10%",width:600,height:600,background:"radial-gradient(circle,rgba(212,175,55,.12) 0%,transparent 70%)",pointerEvents:"none",zIndex:0},
  glow2:     {position:"fixed",bottom:"-20%",right:"-10%",width:500,height:500,background:"radial-gradient(circle,rgba(212,175,55,.08) 0%,transparent 70%)",pointerEvents:"none",zIndex:0},
  nav:       {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 40px",borderBottom:"1px solid rgba(212,175,55,.12)",position:"relative",zIndex:10},
  navLogo:   {fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:"#F5F0E8"},
  navBtn:    {background:"transparent",border:"1px solid rgba(212,175,55,.3)",color:"#D4AF37",borderRadius:10,padding:"8px 18px",fontFamily:"'Inter',sans-serif",fontSize:14,cursor:"pointer",transition:"all .2s"},
  hero:      {textAlign:"center",padding:"80px 20px 60px",position:"relative",zIndex:1},
  badge:     {display:"inline-block",background:"rgba(212,175,55,.08)",border:"1px solid rgba(212,175,55,.25)",borderRadius:20,padding:"6px 16px",fontSize:12,color:"#D4AF37",marginBottom:24,letterSpacing:1},
  title:     {fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:"clamp(36px,6vw,72px)",color:"#F5F0E8",lineHeight:1.1,marginBottom:20},
  titleAccent:{background:"linear-gradient(135deg,#D4AF37,#F5D76E,#D4AF37)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 3s linear infinite"},
  subtitle:  {fontSize:"clamp(14px,2vw,17px)",color:"#8a8070",maxWidth:580,margin:"0 auto 36px",lineHeight:1.8},
  ctaBtn:    {background:"linear-gradient(135deg,#D4AF37,#F5D76E)",color:"#1a1a0a",border:"none",borderRadius:14,padding:"14px 32px",fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,cursor:"pointer",transition:"all .2s",boxShadow:"0 8px 32px rgba(212,175,55,.25)"},
  ctaGhost:  {background:"transparent",border:"1px solid rgba(212,175,55,.3)",color:"#D4AF37",borderRadius:14,padding:"14px 28px",fontFamily:"'Inter',sans-serif",fontSize:15,cursor:"pointer"},
  mockupWrap:{marginTop:60,display:"flex",justifyContent:"center"},
  mockup:    {background:"rgba(255,255,255,.03)",border:"1px solid rgba(212,175,55,.15)",borderRadius:24,padding:20,width:"100%",maxWidth:340,boxShadow:"0 40px 100px rgba(0,0,0,.6)"},
  mockupHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},
  mockupStats:{display:"flex",gap:8,marginBottom:16},
  mockupStat:{flex:1,background:"rgba(212,175,55,.06)",border:"1px solid rgba(212,175,55,.1)",borderRadius:10,padding:"10px 8px",textAlign:"center"},
  mockupCard:{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"12px 14px",marginBottom:8},
  features:  {padding:"80px 40px",position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto"},
  featTitle: {fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:"clamp(28px,4vw,48px)",textAlign:"center",marginBottom:48,color:"#F5F0E8"},
  featGrid:  {display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20},
  featCard:  {background:"rgba(255,255,255,.02)",border:"1px solid rgba(212,175,55,.1)",borderRadius:18,padding:"28px 24px",transition:"all .25s",cursor:"default"},
  featIcon:  {fontSize:32,marginBottom:14},
  ctaSection:{padding:"80px 20px",display:"flex",justifyContent:"center",position:"relative",zIndex:1},
  ctaBox:    {background:"rgba(212,175,55,.05)",border:"1px solid rgba(212,175,55,.2)",borderRadius:24,padding:"60px 40px",display:"flex",flexDirection:"column",alignItems:"center",maxWidth:600,width:"100%"},
  footer:    {textAlign:"center",padding:"40px 20px",borderTop:"1px solid rgba(212,175,55,.1)",position:"relative",zIndex:1},
};
