import { FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { C, displayFont, bodyFont, monoFont } from "../theme";

export function Stamp({ text, tone = "neutral" }) {
  const tones = {
    success: { c: C.success, t: C.successTint }, danger: { c: C.danger, t: C.dangerTint },
    accent: { c: C.accentDeep, t: C.accentTint }, neutral: { c: C.inkSoft, t: "#EEECE5" },
    primary: { c: C.primary, t: C.primaryTint },
  };
  const tn = tones[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontWeight: 600,
      color: tn.c, background: tn.t, borderRadius: 6, padding: "4px 10px 4px 8px", fontSize: 12,
      whiteSpace: "nowrap", letterSpacing: "0.01em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tn.c, flexShrink: 0 }} />
      {text}
    </span>
  );
}

/* ============================================================
   MOCK DATA — condensed, desktop-relevant slices of the same
   Viewmatics world modeled in the mobile app.
   ============================================================ */
export function Card({ children, style }) {
  return (
    <div style={{
      background: C.paper, borderRadius: 12, padding: 20,
      boxShadow: "0 1px 2px rgba(20,24,28,0.04), 0 1px 8px rgba(20,24,28,0.04)",
      border: `1px solid rgba(228,224,212,0.6)`, ...style,
    }}>{children}</div>
  );
}
export function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, letterSpacing: "0.01em", color: C.ink }}>{children}</div>
      {right}
    </div>
  );
}
export function Kpi({ label, value, sub, trend, tone = "primary" }) {
  const color = { primary: C.primary, success: C.success, accent: C.accentDeep, danger: C.danger }[tone];
  return (
    <Card style={{ flex: 1, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>{label}</div>
        {trend != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, color: trend >= 0 ? C.success : C.danger, fontFamily: bodyFont, fontSize: 11.5, fontWeight: 600 }}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 28, color: C.ink, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginTop: 6 }}>{sub}</div>}
      <div style={{ width: 28, height: 3, borderRadius: 2, background: color, marginTop: 12 }} />
    </Card>
  );
}
export function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: "auto", margin: "-4px -4px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: bodyFont, fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#F3F1EA" }}>
            {columns.map((c, ci) => (
              <th key={ci} style={{
                padding: "10px 14px", fontWeight: 700, color: C.ink, fontSize: 11.5, letterSpacing: "0.04em",
                textTransform: "uppercase", borderBottom: `2px solid ${C.border}`,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? "#FAF9F5" : "transparent" }}>
              {r.map((cell, j) => <td key={j} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.ink }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const selectStyle = {
  border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontFamily: bodyFont,
  fontSize: 13, color: C.ink, background: C.paper,
};
export const inputStyle = {
  width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px",
  fontFamily: bodyFont, fontSize: 13, color: C.ink, background: "#FBFAF7",
};
export function PrimaryButton({ children, onClick, tone = "primary", disabled, full }) {
  const bg = tone === "primary" ? C.primary : tone === "accent" ? C.accent : C.danger;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#C9C6BB" : bg, color: "#fff", border: "none", borderRadius: 9,
      padding: "10px 16px", fontFamily: bodyFont, fontWeight: 600, fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto",
    }}>{children}</button>
  );
}

export function Field2({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}

export function PriorityTag({ p }) {
  const map = { P1: C.danger, P2: C.accentDeep, P3: C.inkSoft };
  const c = map[p] || C.inkSoft;
  return (
    <span style={{
      display: "inline-block", fontFamily: monoFont, fontWeight: 600, fontSize: 11,
      color: c, background: "transparent", border: `1px solid ${c}66`, borderRadius: 5, padding: "2px 7px",
    }}>{p}</span>
  );
}

export function Modal({ title, onClose, children, width = 440 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,24,28,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div style={{ width, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", background: C.paper, borderRadius: 12, padding: 24, boxShadow: "0 20px 50px rgba(20,24,28,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 15.5, color: C.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   COMING SOON — an invitation to build the next section, not a
   generic placeholder.
   ============================================================ */
export function ComingSoon({ page }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: C.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <FileText size={24} color={C.primary} />
      </div>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 6 }}>{page} is next up</div>
      <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft, maxWidth: 380 }}>
        This section mirrors the {page} module from the mobile app. Tell Claude to build it and it'll be added here next.
      </div>
    </div>
  );
}

/* ============================================================
   NAVIGATION
   ============================================================ */

