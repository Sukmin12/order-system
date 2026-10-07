import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async (currentUser) => {
      if (!currentUser) { setGroupId(null); setGroupName(null); setRole(null); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("group_id, role, display_name, groups(name)")
        .eq("id", currentUser.id)
        .single();
      if (cancelled) return;
      if (error) { console.error("프로필 조회 실패:", error.message); setGroupId(null); setGroupName(null); setRole(null); return; }
      setGroupId(data?.group_id ?? null);
      setGroupName(data?.groups?.name ?? data?.display_name ?? null);
      setRole(data?.role ?? "group");
    };

    // 🤖 onAuthStateChange 콜백은 Supabase 인증 잠금을 잡은 채 실행돼서, 그 안에서 DB 조회를 await하면
    // 조회가 같은 잠금을 기다리며 서로 멈춤(데드락) → "불러오는 중..."에서 영원히 멈추는 원인이었음.
    // 그래서 콜백은 즉시 끝내고 프로필 조회는 setTimeout으로 다음 틱에 실행.
    // 또 처음 접속 시 INITIAL_SESSION 이벤트가 오므로 getSession을 따로 부르지 않음.
    let currentUserId; // 아직 아무 세션도 처리 안 함(undefined)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      const nextId = nextUser?.id ?? null;
      // 토큰 갱신처럼 같은 사용자 이벤트면 프로필을 다시 불러오지 않음(화면이 로딩으로 깜빡이며 초기화되는 것 방지)
      if (nextId === currentUserId) return;
      currentUserId = nextId;
      setLoading(true);
      setTimeout(async () => {
        try {
          await loadProfile(nextUser);
        } catch (err) {
          console.error("프로필 조회 중 오류:", err);
          setGroupId(null); setGroupName(null); setRole(null);
        } finally {
          if (!cancelled && currentUserId === nextId) setLoading(false);
        }
      }, 0);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, groupId, groupName, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다");
  return ctx;
}
