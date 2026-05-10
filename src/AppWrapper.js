import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import App from "./App";
import Login from "./Login";
import LandingPage from "./LandingPage";

export default function AppWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{background:"#0F0F1A",minHeight:"100vh"}} />;
  if (user) return <App user={user} onLogout={() => supabase.auth.signOut()} />;
  if (showLogin) return <Login />;
  return <LandingPage onStart={() => setShowLogin(true)} />;
}