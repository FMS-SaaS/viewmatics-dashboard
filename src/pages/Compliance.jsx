import { useState } from "react";
import { C, displayFont, bodyFont, ORG_DIRECTORY, COMPLIANCE_SUMMARY, COMPLIANCE_PENDING_ITEMS, Stamp, Card, SectionLabel, Table } from "../common";

function CompliancePage({ selectedSite }) {
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const [activeCategory, setActiveCategory] = useState(null);

  const siteEmployees = selectedSite === "All" ? ORG_DIRECTORY : ORG_DIRECTORY.filter(e => e.site === selectedSite);
  const sitePending = selectedSite === "All" ? COMPLIANCE_PENDING_ITEMS : COMPLIANCE_PENDING_ITEMS.filter(p => p.site === selectedSite);
  const totalHere = siteEmployees.length;
  const countPending = (cat) => sitePending.filter(p => p.category === cat).length;

  const rows = selectedSite === "All"
    ? [
        { key: "bgv", label: "BGV Verified", done: COMPLIANCE_SUMMARY.bgvVerified, total: COMPLIANCE_SUMMARY.bgvTotal },
        { key: "docs", label: "Document Compliance", done: COMPLIANCE_SUMMARY.docsComplete, total: COMPLIANCE_SUMMARY.docsTotal },
        { key: "pfEsi", label: "PF / ESI Compliant", done: COMPLIANCE_SUMMARY.pfEsiCompliant, total: COMPLIANCE_SUMMARY.pfEsiTotal },
      ]
    : [
        { key: "bgv", label: "BGV Verified", done: totalHere - countPending("bgv"), total: totalHere },
        { key: "docs", label: "Document Compliance", done: totalHere - countPending("docs"), total: totalHere },
        { key: "pfEsi", label: "PF / ESI Compliant", done: totalHere - countPending("pfEsi"), total: totalHere },
      ];
  const visible = activeCategory ? sitePending.filter(p => p.category === activeCategory) : sitePending;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {rows.map(r => (
          <button key={r.key} onClick={() => setActiveCategory(activeCategory === r.key ? null : r.key)} style={{ flex: 1, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
            <Card style={{ border: `1.5px solid ${activeCategory === r.key ? C.primary : "rgba(228,224,212,0.6)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5 }}>{r.label}</div>
                <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 17, color: pct(r.done, r.total) >= 90 ? C.success : C.accentDeep }}>{pct(r.done, r.total)}%</div>
              </div>
              <div style={{ background: "#ECEAE1", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${pct(r.done, r.total)}%`, height: "100%", background: pct(r.done, r.total) >= 90 ? C.success : C.accent }} />
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft }}>{r.done} of {r.total} · tap to filter</div>
            </Card>
          </button>
        ))}
      </div>
      <Card>
        <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>Demo data — no BGV/PF-ESI/document tracking in Supabase yet</span>}>
          {activeCategory ? `${rows.find(r => r.key === activeCategory).label} — Remaining` : "All Pending Items"} {selectedSite !== "All" && `(${selectedSite})`}
        </SectionLabel>
        <Table
          columns={["S.No", "Name", "Code", "Site", "Issue"]}
          rows={visible.map((p, i) => [i + 1, p.name, p.code, p.site, <Stamp key={i} text={p.issue} tone="accent" />])}
        />
        {visible.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>Everyone here is compliant.</div>}
      </Card>
    </div>
  );
}

/* ============================================================
   ESCALATIONS
   ============================================================ */

export default CompliancePage;
