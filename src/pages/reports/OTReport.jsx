import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { C, bodyFont, Stamp, Card, Kpi, Table, selectStyle, inputStyle, Field2, exportToExcelColored, ReportHeader, supabaseClient } from "../../common";

// Real OT hours from Supabase's `overtime_records` table. Note: that table only
// records a single "hours" figure per employee per day — it doesn't separately
// track shift length or actual duty hours, so we can't compute an "Applied vs
// Actual" variance the way the old demo data did. This shows the real recorded
// OT hours as-is.
function useRealOT(fromDate, toDate) {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    supabaseClient
      .from("overtime_records")
      .select("date, hours, employees(id, name, employee_code, sites(name), designations(name))")
      .gte("date", fromDate)
      .lte("date", toDate)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setState({ loading: false, error: error.message, rows: [] }); return; }
        const rows = (data || [])
          .filter(r => r.employees)
          .map(r => ({
            dateISO: r.date,
            date: new Date(r.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            hours: Number(r.hours) || 0,
            code: r.employees.employee_code,
            name: r.employees.name,
            designation: r.employees.designations?.name || "—",
            site: r.employees.sites?.name || "—",
          }));
        setState({ loading: false, error: "", rows });
      });
    return () => { cancelled = true; };
  }, [fromDate, toDate]);
  return state;
}

function useRealDesignations() {
  const [designations, setDesignations] = useState([]);
  useEffect(() => {
    supabaseClient.from("designations").select("name").order("name").then(({ data, error }) => {
      if (!error) setDesignations((data || []).map(d => d.name));
    });
  }, []);
  return designations;
}

function OTReportSection({ selectedSite }) {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [designation, setDesignation] = useState("All");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [searched, setSearched] = useState(false);

  const { loading, error, rows } = useRealOT(fromDate, toDate);
  const designations = useRealDesignations();

  const filtered = rows.filter(r => {
    const okSite = selectedSite === "All" || r.site === selectedSite;
    const okDesignation = designation === "All" || r.designation === designation;
    const okCode = !code || r.code.toLowerCase().includes(code.toLowerCase());
    const okName = !name || r.name.toLowerCase().includes(name.toLowerCase());
    return okSite && okDesignation && okCode && okName;
  });

  const totalHours = filtered.reduce((s, r) => s + r.hours, 0);

  const doExport = () => exportToExcelColored(
    "OT_Report",
    ["Employee Code", "Employee Name", "Designation", "Site", "Date", "OT Hours (Recorded)"],
    filtered.map(r => [r.code, r.name, r.designation, r.site, r.date, r.hours])
  );

  return (
    <div>
      <ReportHeader sub="Overtime hours logged across every employee, filterable and exportable" onDownload={doExport} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
          <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: 180 }} value={designation} onChange={e => setDesignation(e.target.value)}>
              <option>All</option>
              {designations.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <Field2 label="Employee Code"><input style={{ ...inputStyle, width: 140 }} value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. EMP-2291" /></Field2>
          <Field2 label="Employee Name"><input style={{ ...inputStyle, width: 160 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh" /></Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
      </Card>

      {loading ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Loading OT records…</div>
        </Card>
      ) : error ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.danger }}>Couldn't load OT records: {error}</div>
        </Card>
      ) : !searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see OT records.</div>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <Kpi label="Total OT Hours (Recorded)" value={totalHours.toFixed(1)} tone="primary" />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginBottom: 10 }}>
            These are the real OT hours recorded in Supabase per employee per day. There's no shift-length data tracked
            yet, so an "Applied vs Actual" variance (like the old demo report showed) isn't available here.
          </div>
          <Card>
            <Table
              columns={["S.No", "Code", "Name", "Designation", "Site", "Date", "OT Hours (Recorded)"]}
              rows={filtered.slice(0, 200).map((r, i) => [
                i + 1, r.code, r.name, r.designation, r.site, r.date,
                <Stamp key={r.code + r.dateISO} text={r.hours} tone="accent" />,
              ])}
            />
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No OT records in this range.</div>}
            {filtered.length > 200 && (
              <div style={{ padding: 12, textAlign: "center", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft }}>
                Showing first 200 of {filtered.length} — export to Excel for the full set.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default OTReportSection;
