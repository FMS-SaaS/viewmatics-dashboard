import { useState } from "react";
import { Search } from "lucide-react";
import { C, bodyFont, EXPENSE_TYPES, expensesSeed, Stamp, Card, Kpi, Table, selectStyle, inputStyle, Field2, exportToExcelColored, ReportHeader } from "../../common";

function ExpenseReportPage({ selectedSite }) {
  const [fromDate, setFromDate] = useState("2026-06-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searched, setSearched] = useState(false);

  const filtered = expensesSeed.filter(e => {
    const okDate = e.dateISO >= fromDate && e.dateISO <= toDate;
    const okSite = selectedSite === "All" || e.site === selectedSite;
    const q = query.toLowerCase();
    const okQuery = !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q);
    const okType = typeFilter === "All" || e.type === typeFilter;
    const okStatus = statusFilter === "All" || e.status === statusFilter;
    return okDate && okSite && okQuery && okType && okStatus;
  });
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const pending = filtered.filter(e => e.status === "Pending").length;
  const approved = filtered.filter(e => e.status === "Approved").length;
  const rejected = filtered.filter(e => e.status === "Rejected").length;

  const doExport = () => exportToExcelColored(
    "Expense_Report",
    ["ID", "Employee", "Code", "Designation", "Site", "Date", "Type", "Amount", "Status", "Remark"],
    filtered.map(e => [e.id, e.name, e.code, e.designation, e.site, e.date, e.type, e.amount,
      { text: e.status, tone: e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "accent" }, e.remark])
  );

  return (
    <div>
      <ReportHeader sub="All expenses raised across the org, with status and totals" onDownload={doExport} />
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: -14, marginBottom: 16, fontStyle: "italic" }}>
        Demo data — no expense-claim table in Supabase yet.
      </div>
      {searched && (
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <Kpi label="Total Raised" value={filtered.length} tone="primary" />
          <Kpi label="Total Amount" value={`₹${totalAmount.toLocaleString("en-IN")}`} tone="primary" />
          <Kpi label="Pending" value={pending} tone="accent" />
          <Kpi label="Approved" value={approved} tone="success" />
          <Kpi label="Rejected" value={rejected} tone="danger" />
        </div>
      )}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Search Employee"><input style={{ ...inputStyle, width: 160 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or code" /></Field2>
          <Field2 label="Expense Type">
            <select style={{ ...selectStyle, width: 180 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option>All</option>{EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field2>
          <Field2 label="Status">
            <select style={{ ...selectStyle, width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option>
            </select>
          </Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", alignSelf: "flex-end",
          }}><Search size={14} /> Search</button>
        </div>
      </Card>
      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see expense records.</div>
        </Card>
      ) : (
        <Card>
          <Table
            columns={["ID", "Employee", "Code", "Site", "Date", "Type", "Amount", "Status"]}
            rows={filtered.map(e => [
              e.id, e.name, e.code, e.site, e.date, e.type, `₹${e.amount.toLocaleString("en-IN")}`,
              <Stamp key={e.id} text={e.status} tone={e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "accent"} />,
            ])}
          />
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   GRIEVANCE REPORT
   ============================================================ */

export default ExpenseReportPage;
