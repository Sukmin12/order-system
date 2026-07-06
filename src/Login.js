import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabaseClient";

const C = {
  bg: "#F4F8FC", surface: "#FFFFFF", ink: "#1B2A3D", muted: "#6E859C",
  border: "#DCE6F0", accent: "#1E5DA8", red: "#C0392B",
};

const inputStyle = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, marginBottom: 14, outline: "none", fontFamily: "inherit", color: C.ink, backgroundColor: C.surface };

const SAVED_GROUP_KEY = "order-login-saved-group";

export default function Login() {
  const { login } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupId, setGroupId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberGroup, setRememberGroup] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("groups").select("id, name").order("name");
      if (!error && data) setGroups(data);
      setLoadingGroups(false);
    })();

    const saved = localStorage.getItem(SAVED_GROUP_KEY);
    if (saved) { setGroupId(saved); setRememberGroup(true); }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!groupId) { setError("여선교회를 선택해주세요"); return; }
    setSubmitting(true);

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("login_email")
      .eq("id", groupId)
      .single();

    if (groupError || !group?.login_email) {
      setSubmitting(false);
      setError("여선교회 또는 비밀번호를 확인해주세요");
      return;
    }

    const { error: loginError } = await login(group.login_email, password);
    setSubmitting(false);
    if (loginError) { setError("여선교회 또는 비밀번호를 확인해주세요"); return; }

    if (rememberGroup) localStorage.setItem(SAVED_GROUP_KEY, groupId);
    else localStorage.removeItem(SAVED_GROUP_KEY);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif", padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: C.surface, borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 360, boxShadow: "0 10px 30px rgba(15,46,79,0.12)", boxSizing: "border-box" }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.accent, marginBottom: 24, textAlign: "center" }}>✝️ 여선교회 주문관리</div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>여선교회</label>
        <select
          required value={groupId} onChange={e => setGroupId(e.target.value)} disabled={loadingGroups}
          style={{ ...inputStyle, cursor: loadingGroups ? "default" : "pointer" }}
        >
          <option value="" disabled>{loadingGroups ? "불러오는 중..." : "선택하세요"}</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>비밀번호</label>
        <input
          type="password" name="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.muted, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={rememberGroup} onChange={e => setRememberGroup(e.target.checked)} style={{ width: 14, height: 14, cursor: "pointer" }} />
          여선교회 기억하기
        </label>

        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <button
          type="submit" disabled={submitting}
          style={{ width: "100%", backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit" }}
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>

        {/* 🤖 테스트 기간 임시 안내 — 실사용 전환 시 반드시 제거 */}
        <div style={{ fontSize: 10.5, color: C.muted, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          (테스트용) 로이스1~6 비밀번호: 0001~0006
        </div>
      </form>
    </div>
  );
}
