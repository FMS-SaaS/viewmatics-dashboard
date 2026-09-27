import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, bodyFont, SITES, getSiteAttendanceSummary, otCostSeed, Stamp, Card, SectionLabel, Kpi, Table } from "../common";
import { avgSiteRate } from "./RateChart";

function CostPage({ rates, selectedSite }) {
  const sitesToShow = selectedSite === "All" ? SITES : SITES.filter(s => s.name === selectedSite);
  const rows = sitesToShow.map(s => {
    const { budget, present } = getSiteAttendanceSummary(s.name, "2026-07-22");
    const budgetedCost = Math.round(avgSiteRate(s.name, rates) * budget);
    const attendanceCost = Math.round(budgetedCost * (budget ? present / budget : 0));
    const ot = otCostSeed.find(o => o.site === s.name);
    const otCost = ot ? ot.otCost : 0;
    const totalActual = attendanceCost + otCost;
    return { site: s.name, budgetedCost, attendanceCost, otCost, otHours: ot?.otHours || 0, totalActual, variance: totalActual - budgetedCost };
  });
  const totalBudgeted = rows.reduce((s, r) => s + r.budgetedCost, 0);
  const totalActual = rows.reduce((s, r) => s + r.totalActual, 0);
  const totalOt = rows.reduce((s, r) => s + r.otCost, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Kpi label="Total Budgeted Cost" value={`₹${(totalBudgeted / 100000).toFixed(1)}L`} tone="primary" />
        <Kpi label="Total Actual Cost" value={`₹${(totalActual / 100000).toFixed(1)}L`} tone={totalActual > totalBudgeted ? "danger" : "success"} />
        <Kpi label="Total OT Cost" value={`₹${totalOt.toLocaleString("en-IN")}`} tone="accent" />
        <Kpi label="Variance" value={`${totalActual >= totalBudgeted ? "+" : ""}₹${(totalActual - totalBudgeted).toLocaleString("en-IN")}`} tone={totalActual > totalBudgeted ? "danger" : "success"} />
      </div>
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>Demo data — no real rate card in Supabase yet</span>}>
          Budgeted vs Actual by Site
        </SectionLabel>
        {rows.length === 0 ? (
          <div style={{ padding: "24px 8px", textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>
            No demo cost data exists for this site — this only has sample rates for the 4 sites shipped with the prototype.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="site" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} interval={0} angle={-12} textAnchor="end" height={60} />
              <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="budgetedCost" name="Budgeted" fill={C.primaryTint} stroke={C.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalActual" name="Actual (incl. OT)" fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
      {rows.length > 0 && (
        <Card>
          <SectionLabel>Cost Detail by Site</SectionLabel>
          <Table
            columns={["Site", "Budgeted Cost", "Actual (Attendance)", "OT Hours", "OT Cost", "Total Actual", "Variance"]}
            rows={rows.map(r => [
              r.site,
              `₹${r.budgetedCost.toLocaleString("en-IN")}`,
              `₹${r.attendanceCost.toLocaleString("en-IN")}`,
              r.otHours,
              `₹${r.otCost.toLocaleString("en-IN")}`,
              <b key={r.site}>₹{r.totalActual.toLocaleString("en-IN")}</b>,
              <Stamp key={"v" + r.site} text={`${r.variance >= 0 ? "+" : ""}₹${r.variance.toLocaleString("en-IN")}`} tone={r.variance > 0 ? "danger" : "success"} />,
            ])}
          />
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   RAISE TICKET — Master Admin raises a ticket to a Supervisor
   ============================================================ */

export default CostPage;
