import { useState } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{background:"#0F0F1A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:"36px 28px",width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:8}}>🧾</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,color:"#E2E8F0"}}>Facturo</div>
          <div style={{color:"#6B7280",fontSize:14,marginTop:4}}>{isSignUp ? "Créer un compte" : "Connexion"}</div>
        </div>

        {error && <div style={{background:"rgba(252,129,129,.15)",border:"1px solid rgba(252,129,129,.3)",borderRadius:10,padding:"10px 14px",color:"#FC8181",fontSize:13,marginBottom:16}}>{error}</div>}

        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,color:"#8888AA",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="ton@email.com"
            style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,padding:"11px 13px",color:"#E2E8F0",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",boxSizing:"border-box"}} />
        </div>

        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,color:"#8888AA",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5}}>Mot de passe</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••"
            style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,padding:"11px 13px",color:"#E2E8F0",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",boxSizing:"border-box"}} />
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{width:"100%",background:"#5A52D5",color:"white",border:"none",borderRadius:11,padding:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:15,cursor:"pointer"}}>
          {loading ? "Chargement..." : isSignUp ? "Créer mon compte" : "Se connecter"}
        </button>

        <div style={{textAlign:"center",marginTop:16,color:"#6B7280",fontSize:13}}>
          {isSignUp ? "Déjà un compte ? " : "Pas encore de compte ? "}
          <span style={{color:"#A78BFA",cursor:"pointer"}} onClick={()=>setIsSignUp(!isSignUp)}>
            {isSignUp ? "Se connecter" : "S'inscrire"}
          </span>
        </div>
      </div>
    </div>
  );
}