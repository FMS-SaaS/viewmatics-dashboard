import { useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { C, displayFont, bodyFont, MASTER, supabaseClient } from "../../common";
import ForgotPasswordCard from "./ForgotPasswordCard";

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: username.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    onLogin(data.user);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  if (mode === "forgot") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.primaryDeeper, fontFamily: bodyFont }}>
        <ForgotPasswordCard onBackToLogin={() => setMode("login")} />
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
      background: C.primaryDeeper, fontFamily: bodyFont,
    }}>
      <div style={{ width: 380, background: C.paper, borderRadius: 16, padding: "36px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.primary, letterSpacing: "0.02em" }}>VIEWMATICS</div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, letterSpacing: "0.06em", marginTop: 2 }}>MASTER ADMIN DASHBOARD</div>
        </div>
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500, marginBottom: 6 }}>Email</div>
            <input
              value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. arvind.kapoor@company.com"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500, marginBottom: 6 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••"
                style={{ width: "100%", padding: "11px 40px 11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4,
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button type="button" onClick={() => setSavePassword(!savePassword)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {savePassword ? <CheckCircle2 size={16} color={C.primary} /> : <div style={{ width: 16, height: 16, border: `1.5px solid ${C.border}`, borderRadius: 4 }} />}
              <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.inkSoft }}>Save Password</span>
            </button>
            <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: bodyFont, fontSize: 12.5, color: C.primary, fontWeight: 600 }}>
              Forgot Password?
            </button>
          </div>
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12 }}>{error}</div>}
          <button
            type="button"
            onClick={submit}
            onMouseDown={(e) => { e.preventDefault(); if (!loading) submit(); }}
            disabled={loading}
            style={{
              width: "100%", marginTop: 4, background: loading ? C.inkSoft : C.primary, border: "none", borderRadius: 9, padding: "12px 0",
              color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer",
              position: "relative", zIndex: 10, pointerEvents: "auto",
            }}
          >{loading ? "Signing in..." : "Sign In"}</button>
        </div>
      </div>
    </div>
  );
}


export default LoginPage;
