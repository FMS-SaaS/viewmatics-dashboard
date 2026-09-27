import { useState } from "react";
import { Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { C, bodyFont, DESIGNATIONS, ORG_DIRECTORY, attritionSeed, Stamp, Card, SectionLabel, Kpi, Table, selectStyle, inputStyle, Field2, exportToExcelColored, ReportHeader } from "../../common";

function AttritionReportPage({ selectedSite }) {
  const [fromDate, setFromDate] = useState("2026-03-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [designation, setDesignation] = useState("All");
  const [reasonFilter, setReasonFilter] = useState("All");
  const [searched, setSearched] = useState(false);

  const REASONS = [...new Set(attritionSeed.map(r => r.reason))];

  const filtered = attritionSeed.filter(r => {
    const okDate = r.dol >= fromDate && r.dol <= toDate;
    const okSite = selectedSite === "All" || r.site === selectedSite;
    const okDesignation = designation === "All" || r.designation === designation;
    const okReason = reasonFilter === "All" || r.reason === reasonFilter;
    return okDate && okSite && okDesignation && okReason;
  });
  // True attrition excludes Structural Change exits — those aren't a
  // retention signal, so they shouldn't move the headline rate. Still visible in the
  // table/export if the Reason filter is set to show them.
  const trueAttrition = filtered.filter(r => r.reasonCategory === "Attrition");
  const structural = filtered.filter(r => r.reasonCategory === "Structural");

  const currentHeadcount = ORG_DIRECTORY.filter(e => selectedSite === "All" || e.site === selectedSite).length;
  const attritionRate = currentHeadcount ? ((trueAttrition.length / (currentHeadcount + trueAttrition.length)) * 100).toFixed(1) : "0.0";
  const avgTenure = trueAttrition.length ? Math.round(trueAttrition.reduce((s, r) => s + r.tenureMonths, 0) / trueAttrition.length) : 0;
  const voluntary = trueAttrition.filter(r => r.voluntary).length;
  const involuntary = trueAttrition.length - voluntary;

  // Monthly trend, by reason, as a % of headcount that month — scoped to the selected
  // date range. Structural exits get their own line too, kept visually distinct.
  const monthKeys = [];
  { const d = new Date(fromDate + "T00:00:00"); d.setDate(1);
    const end = new Date(toDate + "T00:00:00");
    while (d <= end) { monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); d.setMonth(d.getMonth() + 1); } }
  const monthLabel = (mk) => { const [y, m] = mk.split("-"); return new Date(`${y}-${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); };
  const reasonsForChart = reasonFilter === "All" ? REASONS : [reasonFilter];
  const trendData = monthKeys.map(mk => {
    const point = { month: monthLabel(mk) };
    reasonsForChart.forEach(reason => {
      const count = filtered.filter(r => r.reason === reason && r.dol.startsWith(mk)).length;
      point[reason] = currentHeadcount ? Number(((count / (currentHeadcount + count)) * 100).toFixed(1)) : 0;
    });
    return point;
  });
  const TREND_COLORS = [C.danger, C.accentDeep, C.primary, C.success, "#6B3FA0", "#1F7A6C", "#B5721A"];

  const doExport = () => exportToExcelColored(
    "Attrition_Report",
    ["Employee Code", "Employee Name", "Designation", "Site", "Date of Joining", "Date of Leaving", "Tenure (Months)", "Reason", "Category", "Type"],
    filtered.map(r => [r.code, r.name, r.designation, r.site, r.dojDisplay, r.dolDisplay, r.tenureMonths, r.reason, r.reasonCategory,
      { text: r.voluntary ? "Voluntary" : "Involuntary", tone: r.voluntary ? "accent" : "danger" }])
  );

  return (
    <div>
      <ReportHeader sub="Employees who have exited, with tenure and reason" onDownload={doExport} />
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: -14, marginBottom: 16, fontStyle: "italic" }}>
        Demo data — exits and leaving reasons aren't tracked in Supabase yet.
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field2 label="From date (exit)"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date (exit)"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: 180 }} value={designation} onChange={e => setDesignation(e.target.value)}>
              <option>All</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <Field2 label="Reason">
            <select style={{ ...selectStyle, width: 180 }} value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}>
              <option>All</option>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
      </Card>

      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see attrition records.</div>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <Kpi label="Total Attrition" value={trueAttrition.length} tone="danger" sub={selectedSite === "All" ? "Org-wide" : selectedSite} />
            <Kpi label="Attrition Rate" value={`${attritionRate}%`} tone="accent" sub="Excludes budget-driven exits" />
            <Kpi label="Avg Tenure" value={`${avgTenure} mo`} tone="primary" />
            <Kpi label="Voluntary" value={voluntary} tone="success" />
            <Kpi label="Involuntary" value={involuntary} tone="danger" />
            {structural.length > 0 && <Kpi label="Structural Change" value={structural.length} tone="primary" sub="Not counted in rate above" />}
          </div>

          <Card style={{ marginBottom: 20 }}>
            <SectionLabel>Attrition Trend by Reason — % of Headcount</SectionLabel>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fontFamily: bodyFont, fontSize: 11 }} />
                <YAxis tick={{ fontFamily: bodyFont, fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontFamily: bodyFont, fontSize: 11.5 }} />
                {reasonsForChart.map((reason, i) => (
                  <Line key={reason} type="monotone" dataKey={reason} stroke={TREND_COLORS[i % TREND_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <Table
              columns={["S.No", "Code", "Name", "Designation", "Site", "Date of Joining", "Date of Leaving", "Tenure", "Reason", "Type"]}
              rows={filtered.map((r, i) => [
                i + 1, r.code, r.name, r.designation, r.site, r.dojDisplay, r.dolDisplay, `${r.tenureMonths} mo`,
                r.reason,
                <Stamp key={r.code} text={r.voluntary ? "Voluntary" : "Involuntary"} tone={r.voluntary ? "accent" : "danger"} />,
              ])}
            />
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No attrition records in this range.</div>}
          </Card>
        </>
      )}
    </div>
  );
}


export default AttritionReportPage;
