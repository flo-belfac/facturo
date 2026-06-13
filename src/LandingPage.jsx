export default function LandingPage({ onStart }) {
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.7;transform:scale(1.1)}}
        @keyframes scanLine{0%{top:0}100%{top:100%}}
        @keyframes typewriter{from{width:0}to{width:100%}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.2),0 0 40px rgba(0,255,136,0.1)}50%{box-shadow:0 0 40px rgba(0,255,136,0.4),0 0 80px rgba(0,255,136,0.2)}}
        @keyframes rotateGlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        .cta-btn:hover{transform:translateY(-3px)!important;box-shadow:0 20px 60px rgba(0,255,136,0.4)!important}
        .feat:hover{border-color:rgba(0,255,136,0.4)!important;background:rgba(0,255,136,0.05)!important;transform:translateY(-4px)}
        .feat{transition:all 0.3s}
      `}</style>

      {/* BG Effects */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",zIndex:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",width:800,height:800,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,136,0.06) 0%,transparent 70%)",top:"20%",left:"50%",transform:"translateX(-50%)",animation:"pulse 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,200,0.04) 0%,transparent 70%)",bottom:"10%",left:"5%",animation:"pulse 10s ease-in-out infinite 3s"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,136,0.05) 0%,transparent 70%)",top:"10%",right:"5%",animation:"pulse 12s ease-in-out infinite 1s"}}/>
        <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:0.025}}>
          <defs>
            <pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00FF88" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
      </div>

      {/* NAV */}
      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontWeight:700,
            fontSize:24,
            letterSpacing:2,
            background:"linear-gradient(90deg,#00FF88,#00FFCC,#00FF88)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            backgroundClip:"text",
            animation:"shimmer 2s linear infinite",
          }}>Factura</div>
        </div>
        <button onClick={onStart} style={S.navBtn}>Connexion</button>
      </nav>

      {/* HERO */}
      <section style={S.hero}>

        {/* Animated logo */}
        <div style={{position:"relative",width:100,height:100,margin:"0 auto 36px",animation:"float 4s ease-in-out infinite",zIndex:1}}>
          <div style={{position:"absolute",inset:-10,borderRadius:"50%",border:"1px solid rgba(0,255,136,0.2)",animation:"rotateGlow 8s linear infinite"}}/>
          <div style={{position:"absolute",inset:-20,borderRadius:"50%",border:"1px solid rgba(0,255,136,0.08)",animation:"rotateGlow 12s linear infinite reverse"}}/>
          <svg viewBox="0 0 100 100" width="100" height="100" style={{filter:"drop-shadow(0 0 12px rgba(0,255,136,0.5))"}}>
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FF88"/>
                <stop offset="100%" stopColor="#00FFCC"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#080D0A" stroke="url(#g1)" strokeWidth="1.5"/>
            <rect x="27" y="20" width="46" height="56" rx="4" fill="#0a1a10" stroke="url(#g1)" strokeWidth="1.2"/>
            <line x1="35" y1="34" x2="65" y2="34" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="35" y1="44" x2="62" y2="44" stroke="#00FF88" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
            <line x1="35" y1="52" x2="58" y2="52" stroke="#00FF88" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
            <line x1="35" y1="60" x2="55" y2="60" stroke="#00FF88" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
            <path d="M27 64 L30 68 L33 64 L36 68 L39 64 L42 68 L45 64 L48 68 L51 64 L54 68 L57 64 L60 68 L63 64 L66 68 L69 64 L73 64" fill="none" stroke="url(#g1)" strokeWidth="1.2"/>
          </svg>
        </div>

        <div style={{animation:"fadeUp 0.8s ease both",zIndex:1}}>
          <div style={{display:"inline-block",background:"rgba(0,255,136,0.08)",border:"1px solid rgba(0,255,136,0.2)",borderRadius:20,padding:"6px 18px",fontSize:12,color:"#00FF88",letterSpacing:3,textTransform:"uppercase",marginBottom:24,fontFamily:"'DM Sans',sans-serif"}}>
            ✦ Gestion de factures intelligente
          </div>
        </div>

        <h1 style={{...S.title,animation:"fadeUp 0.8s 0.1s ease both"}}>
          Vos factures,<br/>
          <span style={{
            background:"linear-gradient(135deg,#00FF88,#00FFCC,#00FF88)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            backgroundClip:"text",
            animation:"shimmer 2s linear infinite",
          }}>sous contrôle.</span>
        </h1>

        <p style={{...S.subtitle,animation:"fadeUp 0.8s 0.2s ease both"}}>
          Photographiez vos factures papier — Factura extrait tout automatiquement.<br/>
          Rappels, plans de paiement, virements simplifiés.
        </p>

        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",animation:"fadeUp 0.8s 0.3s ease both"}}>
          <button onClick={onStart} className="cta-btn" style={S.ctaBtn}>
            Commencer gratuitement →
          </button>
          <button onClick={onStart} style={S.ctaGhost}>
            Voir comment ça marche
          </button>
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:32,justifyContent:"center",marginTop:48,animation:"fadeUp 0.8s 0.4s ease both",flexWrap:"wrap"}}>
          {[["Gratuit","3 mois"],["< 10s","par facture"],["100%","sécurisé"]].map(([v,l]) => (
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:"#00FF88"}}>{v}</div>
              <div style={{fontSize:12,color:"#4a7a5a",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={S.features}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:36,color:"#F0FFF8",marginBottom:12}}>Tout ce dont vous avez besoin</h2>
          <p style={{color:"#4a7a5a",fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>Une app simple, rapide, et efficace</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,maxWidth:900,margin:"0 auto"}}>
          {[
            {icon:"📸",title:"Scan automatique",desc:"Prenez une photo — Factura lit la facture et remplit tout en quelques secondes."},
            {icon:"📁",title:"Dossiers fournisseurs",desc:"Toutes vos factures organisées par fournisseur automatiquement."},
            {icon:"🔔",title:"Rappels intelligents",desc:"Ne plus jamais oublier une échéance. Définissez vos rappels en 1 clic."},
            {icon:"💳",title:"Virement simplifié",desc:"Copiez IBAN et communication en un tap. Collez dans votre app bancaire."},
            {icon:"📅",title:"Plan de paiement",desc:"Étalez vos paiements en 2x, 3x, jusqu'à 12x avec suivi automatique."},
            {icon:"✅",title:"Suivi des paiements",desc:"Marquez vos factures payées et gardez un historique clair et net."},
          ].map(({icon,title,desc}) => (
            <div key={title} className="feat" style={S.feat}>
              <div style={{fontSize:32,marginBottom:14}}>{icon}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:"#F0FFF8",marginBottom:8}}>{title}</div>
              <div style={{fontSize:14,color:"#4a7a5a",lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={S.ctaSection}>
        <div style={{background:"rgba(0,255,136,0.04)",border:"1px solid rgba(0,255,136,0.15)",borderRadius:24,padding:"48px 32px",textAlign:"center",maxWidth:600,margin:"0 auto",position:"relative",overflow:"hidden",animation:"glow 4s ease-in-out infinite"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 0%,rgba(0,255,136,0.08),transparent 60%)"}}/>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:36,color:"#F0FFF8",marginBottom:12,position:"relative"}}>
            Essayez Factura gratuitement
          </h2>
          <p style={{color:"#4a7a5a",fontSize:15,marginBottom:28,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
            Gratuit pendant 3 mois, puis 4,99€/mois.<br/>Annulation à tout moment.
          </p>
          <button onClick={onStart} className="cta-btn" style={{...S.ctaBtn,position:"relative"}}>
            Créer mon compte →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontWeight:700,
          fontSize:18,
          background:"linear-gradient(90deg,#00FF88,#00FFCC)",
          WebkitBackgroundClip:"text",
          WebkitTextFillColor:"transparent",
          backgroundClip:"text",
          marginBottom:8,
        }}>Factura</div>
        <div style={{fontSize:12,color:"#2a4a38",fontFamily:"'DM Sans',sans-serif"}}>© 2026 Factura — Vos factures, sous contrôle.</div>
      </footer>
    </div>
  );
}

const S = {
  page:    {background:"#080D0A",minHeight:"100vh",color:"#F0FFF8",position:"relative",overflowX:"hidden"},
  nav:     {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 32px",position:"sticky",top:0,background:"rgba(8,13,10,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,255,136,0.08)",zIndex:10},
  navBtn:  {background:"transparent",border:"1px solid rgba(0,255,136,0.2)",color:"#00FF88",borderRadius:10,padding:"9px 20px",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",transition:"all 0.3s",letterSpacing:1},
  hero:    {textAlign:"center",padding:"80px 24px 60px",position:"relative",zIndex:1},
  title:   {fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(40px,7vw,72px)",lineHeight:1.15,color:"#F0FFF8",marginBottom:20,letterSpacing:-1},
  subtitle:{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(15px,2vw,18px)",color:"#4a7a5a",lineHeight:1.7,maxWidth:560,margin:"0 auto 32px",fontWeight:300},
  ctaBtn:  {background:"linear-gradient(135deg,#00FF88,#00FFCC)",color:"#050D08",border:"none",borderRadius:14,padding:"15px 32px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:16,cursor:"pointer",transition:"all 0.3s",letterSpacing:0.5},
  ctaGhost:{background:"transparent",border:"1px solid rgba(0,255,136,0.2)",color:"#00FF88",borderRadius:14,padding:"15px 28px",fontFamily:"'DM Sans',sans-serif",fontSize:15,cursor:"pointer",transition:"all 0.3s"},
  features:{padding:"60px 24px",position:"relative",zIndex:1},
  feat:    {background:"rgba(0,255,136,0.02)",border:"1px solid rgba(0,255,136,0.1)",borderRadius:16,padding:"28px 24px",cursor:"default"},
  ctaSection:{padding:"40px 24px 60px",position:"relative",zIndex:1},
  footer:  {textAlign:"center",padding:"28px 24px",borderTop:"1px solid rgba(0,255,136,0.08)"},
};