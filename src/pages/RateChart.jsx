import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { C, displayFont, bodyFont, SITES, Card, SectionLabel, Table, inputStyle } from "../common";

function RateChartPage({ rates, setRates, selectedSite }) {
  const site = selectedSite === "All" ? SITES[0].name : selectedSite;
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [draft, setDraft] = useState("");

  const siteRates = rates.filter(r => r.site === site);
  const save = () => {
    setRates(rates.map(r => (r.site === site && r.designation === editingDesignation) ? { ...r, monthlyRate: Number(draft) || 0 } : r));
    setEditingDesignation(null);
  };

  return (
    <div>
      {selectedSite === "All" && (
        <Card style={{ marginBottom: 16, background: C.accentTint, border: `1px solid ${C.accent}55` }}>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.ink }}>
            Rates are set per site. Showing <b>{site}</b> — pick a specific site from the top bar to edit a different one.
          </div>
        </Card>
      )}
      <Card>
        <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>Demo data — no rate-card table in Supabase yet</span>}>
          Rates by Designation — {site}
        </SectionLabel>
        {siteRates.length === 0 ? (
          <div style={{ padding: "24px 8px", textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>
            No demo rate data exists for "{site}" — this only has sample rates for the 4 sites shipped with the prototype.
          </div>
        ) : (
          <Table
            columns={["Designation", "Monthly Rate"]}
            rows={siteRates.map(r => [
              r.designation,
              editingDesignation === r.designation ? (
                <div key={r.designation} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="number" style={{ ...inputStyle, width: 100 }} value={draft} onChange={e => setDraft(e.target.value)} />
                  <button onClick={save} style={{ background: C.primary, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}><Check size={13} color="#fff" /></button>
                </div>
              ) : (
                <button key={r.designation} onClick={() => { setEditingDesignation(r.designation); setDraft(String(r.monthlyRate)); }} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span style={{ fontFamily: displayFont, fontWeight: 700 }}>₹{r.monthlyRate.toLocaleString("en-IN")}</span>
                  <Pencil size={12} color={C.inkSoft} />
                </button>
              ),
            ])}
          />
        )}
      </Card>

    </div>
  );
}

/* ============================================================
   SHIFT BUDGET
   ============================================================ */
/* ============================================================
   COST — Budgeted vs Actual (attendance-based) + OT, per site
   ============================================================ */
function avgSiteRate(siteName, rates) {
  const siteRates = rates.filter(r => r.site === siteName);
  if (!siteRates.length) return 0;
  return siteRates.reduce((s, r) => s + r.monthlyRate, 0) / siteRates.length;
}


export default RateChartPage;

export { avgSiteRate };
