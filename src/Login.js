import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const C = {
  bg: "#F4F8FC", surface: "#FFFFFF", ink: "#1B2A3D", muted: "#6E859C",
  border: "#DCE6F0", accent: "#1E5DA8", red: "#C0392B",
};

const SAVED_EMAIL_KEY = "order-login-saved-email";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 🤖 저장된 아이디(이메일)가 있으면 불러와서 자동으로 채워줌
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) { setEmail(saved); setRememberId(true); }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await login(email, password);
    setSubmitting(false);
    if (error) { setError("이메일 또는 비밀번호가 올바르지 않습니다"); return; }

    if (rememberId) localStorage.setItem(SAVED_EMAIL_KEY, email);
    else localStorage.removeItem(SAVED_EMAIL_KEY);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif", padding: 20 }}>
      <form onSubmit={handleSubmit} autoComplete="on" style={{ backgroundColor: C.surface, borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 360, boxShadow: "0 10px 30px rgba(15,46,79,0.12)", boxSizing: "border-box" }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.accent, marginBottom: 24, textAlign: "center" }}>✝️ 로이스6 주문관리</div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>이메일</label>
        <input
          type="email" name="email" autoComplete="username" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, marginBottom: 14, outline: "none", fontFamily: "inherit" }}
        />

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>비밀번호</label>
        <input
          type="password" name="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, marginBottom: 14, outline: "none", fontFamily: "inherit" }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.muted, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={rememberId} onChange={e => setRememberId(e.target.checked)} style={{ width: 14, height: 14, cursor: "pointer" }} />
          아이디 저장
        </label>

        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <button
          type="submit" disabled={submitting}
          style={{ width: "100%", backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit" }}
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
