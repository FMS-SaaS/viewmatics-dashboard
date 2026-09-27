import { useState } from "react";
import { Search } from "lucide-react";
import { C, bodyFont, GRIEVANCE_CATEGORIES, grievanceReportSeed, Stamp, Card, Kpi, Table, selectStyle, inputStyle, Field2, PriorityTag, exportToExcelColored, ReportHeader } from "../../common";

function GrievanceReportPage({ selectedSite }) {
  const [fromDate, setFromDate] = useState("2026-06-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = grievanceReportSeed.filter(g => {
    const okDate = g.dateISO >= fromDate && g.dateISO <= toDate;
    const okSite = selectedSite === "All" || g.site === selectedSite;
    const okCategory = category === "All" || g.category === category;
    const okStatus = statusFilter === "All" || g.status === statusFilter;
    const q = query.toLowerCase();
    const okQuery = !q || g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
    return okDate && okSite && okCategory && okStatus && okQuery;
  });
  const open = filtered.filter(g => g.status === "Pending").length;
  const inProgress = filtered.filter(g => g.status === "In Progress").length;
  const closed = filtered.filter(g => g.status === "Closed").length;

  const doExport = () => exportToExcelColored(
    "Grievance_Report",
    ["ID", "Employee", "Code", "Designation", "Site", "Category", "Subcategory", "Date", "Priority", "Status"],
    filtered.map(g => [g.id, g.name, g.code, g.designation, g.site, g.category, g.subcategory, g.date, g.priority,
      { text: g.status, tone: g.status === "Closed" ? "success" : g.status === "In Progress" ? "accent" : "danger" }])
  );

  return (
    <div>
      <ReportHeader sub="All grievances raised across the org, with resolution status" onDownload={doExport} />
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: -14, marginBottom: 16, fontStyle: "italic" }}>
        Demo data — no grievance table in Supabase yet.
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Kpi label="Total Grievances" value={filtered.length} tone="primary" />
        <Kpi label="Pending" value={open} tone="danger" />
        <Kpi label="In Progress" value={inProgress} tone="accent" />
        <Kpi label="Closed" value={closed} tone="success" />
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Category">
            <select style={{ ...selectStyle, width: 190 }} value={category} onChange={e => setCategory(e.target.value)}>
              <option>All</option>{GRIEVANCE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field2>
          <Field2 label="Status">
            <select style={{ ...selectStyle, width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option><option>Pending</option><option>In Progress</option><option>Closed</option>
            </select>
          </Field2>
          <Field2 label="Search Employee"><input style={{ ...inputStyle, width: 160 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or code" /></Field2>
        </div>
      </Card>
      <Card>
        <Table
          columns={["ID", "Employee", "Code", "Site", "Category", "Subcategory", "Date", "Priority", "Status"]}
          rows={filtered.map(g => [
            g.id, g.name, g.code, g.site, g.category, g.subcategory, g.date, <PriorityTag key={g.id} p={g.priority} />,
            <Stamp key={"s" + g.id} text={g.status} tone={g.status === "Closed" ? "success" : g.status === "In Progress" ? "accent" : "danger"} />,
          ])}
        />
      </Card>
    </div>
  );
}

/* ============================================================
   TASK HISTORY / OPEN TASK DETAILS
   ============================================================ */

export default GrievanceReportPage;
