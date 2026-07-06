import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async (currentUser) => {
      if (!currentUser) { setGroupId(null); setGroupName(null); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("group_id, groups(name)")
        .eq("id", currentUser.id)
        .single();
      if (cancelled) return;
      if (error) { console.error("프로필 조회 실패:", error.message); setGroupId(null); setGroupName(null); return; }
      setGroupId(data?.group_id ?? null);
      setGroupName(data?.groups?.name ?? null);
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      if (!cancelled) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      setLoading(true);
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, groupId, groupName, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다");
  return ctx;
}
