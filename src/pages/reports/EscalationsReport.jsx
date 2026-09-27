import { useState } from "react";
import { C, bodyFont, escalationsReportData, Stamp, Card, SectionLabel, Kpi, Table, selectStyle, exportToExcelColored, ReportHeader } from "../../common";

function EscalationsReport({ selectedSite }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const scoped = selectedSite === "All" ? escalationsReportData : escalationsReportData.filter(e => e.site === selectedSite);
  const filtered = scoped.filter(e => statusFilter === "All" || e.status === statusFilter);
  const resolved = scoped.filter(e => e.status === "Resolved");
  const avgResolution = resolved.length ? (resolved.reduce((s, e) => s + e.daysToResolve, 0) / resolved.length).toFixed(1) : "—";
  const doExport = () => exportToExcelColored(
    "Escalations_Report",
    ["Ref", "Type", "Site", "Raised On", "Resolved On", "Days", "Status"],
    filtered.map(e => [e.ref, e.type, e.site, e.raisedOn, e.resolvedOn || "—", e.daysToResolve,
      { text: e.status, tone: e.status === "Resolved" ? "success" : "danger" }])
  );

  return (
    <div>
      <ReportHeader sub="Historical view of every escalation — open and resolved" onDownload={doExport} />
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: -14, marginBottom: 16, fontStyle: "italic" }}>
        Demo data — no escalations table in Supabase yet.
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Kpi label="Total Escalations" value={scoped.length} tone="primary" />
        <Kpi label="Open" value={scoped.filter(e => e.status === "Open").length} tone="danger" />
        <Kpi label="Resolved" value={resolved.length} tone="success" />
        <Kpi label="Avg Resolution Time" value={`${avgResolution}d`} tone="accent" />
      </div>
      <Card>
        <SectionLabel right={
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, width: 140 }}>
            <option>All</option><option>Open</option><option>Resolved</option>
          </select>
        }>Escalation History</SectionLabel>
        <Table
          columns={["Ref", "Type", "Site", "Raised On", "Resolved On", "Days", "Status"]}
          rows={filtered.map(e => [
            e.ref, e.type, e.site, e.raisedOn, e.resolvedOn || "—", e.daysToResolve,
            <Stamp key={e.ref} text={e.status} tone={e.status === "Resolved" ? "success" : "danger"} />,
          ])}
        />
      </Card>
    </div>
  );
}

/* ============================================================
   ATTENDANCE REPORT
   ============================================================ */

export default EscalationsReport;
