import { useState } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");

  const handle = async () => {
    setLoading(true);
    setError("");
    const { error: err } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div style={S.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.05)}}
        @keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.2)}50%{box-shadow:0 0 40px rgba(0,255,136,0.5)}}
        input{outline:none}
        input::placeholder{color:#1a4a30}
        .inp:focus{border-color:rgba(0,255,136,0.6)!important;box-shadow:0 0 0 3px rgba(0,255,136,0.1)!important}
        .btn-main:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,255,136,0.4)!important}
        .btn-main:active{transform:translateY(0)}
      `}</style>

      {/* Animated background orbs */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",zIndex:0}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,136,0.08) 0%,transparent 70%)",top:"10%",left:"50%",transform:"translateX(-50%)",animation:"pulse 6s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,136,0.05) 0%,transparent 70%)",bottom:"20%",left:"10%",animation:"pulse 8s ease-in-out infinite 2s"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,136,0.06) 0%,transparent 70%)",top:"30%",right:"10%",animation:"pulse 7s ease-in-out infinite 1s"}}/>

        {/* Grid lines */}
        <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:0.03}}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00FF88" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      <div style={S.container}>

        {/* Logo & Title */}
        <div style={{textAlign:"center",marginBottom:40,animation:"fadeUp 0.8s ease both"}}>
          {/* Animated logo */}
          <div style={{position:"relative",width:80,height:80,margin:"0 auto 24px",animation:"float 4s ease-in-out infinite"}}>
            <svg viewBox="0 0 80 80" width="80" height="80">
              <defs>
                <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FF88"/>
                  <stop offset="50%" stopColor="#00FF88"/>
                  <stop offset="100%" stopColor="#00CC66"/>
                </linearGradient>
                <filter id="logoGlow">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <circle cx="40" cy="40" r="38" fill="#0D0D08" stroke="url(#logoGold)" strokeWidth="1.5" opacity="0.6"/>
              <rect x="22" y="16" width="36" height="46" rx="3" fill="#1a1a0a" stroke="url(#logoGold)" strokeWidth="1.2"/>
              <line x1="28" y1="28" x2="52" y2="28" stroke="url(#logoGold)" strokeWidth="2" strokeLinecap="round" filter="url(#logoGlow)"/>
              <line x1="28" y1="37" x2="50" y2="37" stroke="#00FF88" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
              <line x1="28" y1="44" x2="48" y2="44" stroke="#00FF88" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
              <path d="M22 52 L25 56 L28 52 L31 56 L34 52 L37 56 L40 52 L43 56 L46 52 L49 56 L52 52 L55 56 L58 52" fill="none" stroke="url(#logoGold)" strokeWidth="1.2"/>
            </svg>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:52,
            fontWeight:300,
            letterSpacing:8,
            background:"linear-gradient(135deg,#00FF88 0%,#00FF88 40%,#00FF88 60%,#00CC66 100%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            backgroundClip:"text",
            animation:"shimmer 3s linear infinite",
            textTransform:"uppercase",
            marginBottom:8,
          }}>PayDay</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#2a6a50",letterSpacing:3,textTransform:"uppercase",fontWeight:300}}>
            Gestion de factures
          </p>
        </div>

        {/* Card */}
        <div style={{...S.card,animation:"fadeUp 0.8s ease 0.2s both"}}>

          {/* Tabs */}
          <div style={{display:"flex",marginBottom:28,background:"rgba(0,255,136,0.04)",borderRadius:10,padding:3}}>
            {["login","signup"].map(m => (
              <button key={m} style={{
                flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",fontSize:13,letterSpacing:1,fontWeight:500,
                transition:"all 0.3s",
                background:mode===m?"linear-gradient(135deg,#00FF88,#00FF88)":"transparent",
                color:mode===m?"#0D0D08":"#2a6a50",
              }} onClick={() => setMode(m)}>
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {/* Fields */}
          {[
            {label:"Adresse email",type:"email",val:email,set:setEmail,ph:"vous@exemple.com"},
            {label:"Mot de passe",type:"password",val:password,set:setPassword,ph:"••••••••"},
          ].map(({label,type,val,set,ph}) => (
            <div key={label} style={{marginBottom:16}}>
              <label style={{display:"block",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#2a6a50",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{label}</label>
              <input
                className="inp"
                type={type}
                value={val}
                onChange={e => set(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handle()}
                placeholder={ph}
                style={{
                  width:"100%",
                  background:"rgba(0,255,136,0.03)",
                  border:"1px solid rgba(0,255,136,0.12)",
                  borderRadius:10,
                  padding:"14px 16px",
                  color:"#F5F0E8",
                  fontFamily:"'DM Sans',sans-serif",
                  fontSize:14,
                  transition:"all 0.3s",
                  colorScheme:"dark",
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{background:"rgba(252,129,129,0.1)",border:"1px solid rgba(252,129,129,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:16,color:"#FC8181",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
              {error}
            </div>
          )}

          <button
            className="btn-main"
            onClick={handle}
            disabled={loading}
            style={{
              width:"100%",
              padding:"15px",
              marginTop:8,
              background:"linear-gradient(135deg,#00FF88,#00FF88,#00FF88)",
              backgroundSize:"200% auto",
              border:"none",
              borderRadius:12,
              color:"#050D08",
              fontFamily:"'DM Sans',sans-serif",
              fontWeight:600,
              fontSize:15,
              letterSpacing:2,
              textTransform:"uppercase",
              cursor:loading?"not-allowed":"pointer",
              transition:"all 0.3s",
              opacity:loading?0.7:1,
              animation:"glow 3s ease-in-out infinite",
            }}>
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </div>

        <p style={{textAlign:"center",marginTop:24,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#1a3a28",animation:"fadeUp 0.8s ease 0.4s both"}}>
          Vos factures, enfin sous contrôle.
        </p>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    minHeight:"100vh",
    background:"#080D0A",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    padding:"20px",
    position:"relative",
  },
  container: {
    width:"100%",
    maxWidth:400,
    position:"relative",
    zIndex:1,
  },
  card: {
    background:"rgba(20,20,10,0.8)",
    border:"1px solid rgba(0,255,136,0.15)",
    borderRadius:20,
    padding:"32px 28px",
    backdropFilter:"blur(20px)",
    boxShadow:"0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,255,136,0.1)",
  },
};