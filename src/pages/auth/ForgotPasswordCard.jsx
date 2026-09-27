import { useState, useRef } from "react";
import { Check } from "lucide-react";
import { C, displayFont, bodyFont } from "../../common";

function ForgotPasswordCard({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: employee code, 2: OTP, 3: new password, 4: success
  const [employeeCode, setEmployeeCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const step1Submit = () => {
    if (!employeeCode.trim()) { setError("Please enter your Employee Code."); return; }
    setError("");
    setMobile("+91 XXXXX XX210"); // masked, matches the code's registered contact on file
    setStep(2);
  };
  const otpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 3) otpRefs[i + 1].current?.focus();
  };
  const step2Submit = () => {
    if (otp.join("").length < 4) { setError("Please enter the 4-digit OTP."); return; }
    if (otp.join("") !== "1234") { setError("Incorrect OTP. Please try again."); return; }
    setError("");
    setStep(3);
  };
  const step3Submit = () => {
    if (!newPassword || !confirmPassword) { setError("Please fill in both password fields."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setStep(4);
  };

  return (
    <div style={{ width: 380, background: C.paper, borderRadius: 16, padding: "36px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.primary, letterSpacing: "0.02em" }}>VIEWMATICS</div>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, letterSpacing: "0.06em", marginTop: 2 }}>RESET PASSWORD</div>
      </div>

      {step === 1 && (
        <div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginBottom: 18, textAlign: "center" }}>Enter your Employee Code to begin resetting your password.</div>
          <div style={{ marginBottom: 6, fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>Employee Code</div>
          <input
            value={employeeCode} onChange={e => setEmployeeCode(e.target.value)} placeholder="e.g. EMP-2200"
            onKeyDown={e => e.key === "Enter" && step1Submit()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12 }}>{error}</div>}
          <button type="button" onClick={step1Submit} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Send OTP</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginBottom: 4, textAlign: "center" }}>Enter the 4-digit OTP sent to</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 18, textAlign: "center" }}>{mobile}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
            {otp.map((d, i) => (
              <input
                key={i} ref={otpRefs[i]} value={d} maxLength={1}
                onChange={e => otpChange(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) otpRefs[i - 1].current?.focus(); if (e.key === "Enter") step2Submit(); }}
                style={{ width: 44, height: 50, textAlign: "center", fontSize: 20, fontFamily: displayFont, fontWeight: 700, borderRadius: 9, border: `1.5px solid ${C.border}`, outline: "none" }}
              />
            ))}
          </div>
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12, textAlign: "center" }}>{error}</div>}
          <button type="button" onClick={step2Submit} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>Verify OTP</button>
          <button type="button" onClick={() => { setOtp(["", "", "", ""]); setError(""); }} style={{ width: "100%", background: "none", border: "none", color: C.primary, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Resend OTP</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginBottom: 18, textAlign: "center" }}>Set a new password for your account.</div>
          <div style={{ marginBottom: 6, fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>New Password</div>
          <input
            type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters"
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          <div style={{ marginBottom: 6, fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>Confirm Password</div>
          <input
            type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password"
            onKeyDown={e => e.key === "Enter" && step3Submit()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12 }}>{error}</div>}
          <button type="button" onClick={step3Submit} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Reset Password</button>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={26} color={C.success} />
          </div>
          <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14.5, color: C.ink, marginBottom: 6 }}>Password reset successful</div>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.inkSoft, marginBottom: 22 }}>You can now sign in with your new password.</div>
          <button type="button" onClick={onBackToLogin} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Back to Login</button>
        </div>
      )}

      {step < 4 && (
        <button type="button" onClick={onBackToLogin} style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: C.inkSoft, fontFamily: bodyFont, fontSize: 12.5, cursor: "pointer", marginTop: 16 }}>← Back to Login</button>
      )}
    </div>
  );
}


export default ForgotPasswordCard;
