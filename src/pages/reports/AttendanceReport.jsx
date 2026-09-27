import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { C, displayFont, bodyFont, monoFont, Stamp, Card, SectionLabel, Table, selectStyle, inputStyle, Field2, exportAttendanceCalendar, ReportHeader, supabaseClient } from "../../common";
import OTReportSection from "./OTReport";

// Real attendance, pulled straight from Supabase's `attendance` table joined to
// `employees` — same status codes (P/A/L/WO) the mobile app already writes.
function useRealAttendance(fromDate, toDate) {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    supabaseClient
      .from("attendance")
      .select("date, status, punch_in, punch_out, employees(id, name, employee_code, date_of_joining, sites(name), designations(name))")
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
            status: r.status,
            inTime: r.punch_in ? new Date(r.punch_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—",
            outTime: r.punch_out ? new Date(r.punch_out).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—",
            code: r.employees.employee_code,
            name: r.employees.name,
            designation: r.employees.designations?.name || "—",
            site: r.employees.sites?.name || "—",
            doj: r.employees.date_of_joining,
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

function AttendanceReportPage({ selectedSite }) {
  const [reportTab, setReportTab] = useState("attendance");
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [designation, setDesignation] = useState("All");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [searched, setSearched] = useState(false);
  const [openCode, setOpenCode] = useState(null);

  const { loading, error, rows: attendanceRows } = useRealAttendance(fromDate, toDate);
  const designations = useRealDesignations();

  const filtered = attendanceRows.filter(r => {
    const okSite = selectedSite === "All" || r.site === selectedSite;
    const okDesignation = designation === "All" || r.designation === designation;
    const okCode = !code || r.code.toLowerCase().includes(code.toLowerCase());
    const okName = !name || r.name.toLowerCase().includes(name.toLowerCase());
    return okSite && okDesignation && okCode && okName;
  });

  // Per-employee summary — one row per employee with attendance counts for the
  // selected range, used both for the list and the Excel export.
  const summary = Object.values(
    filtered.reduce((acc, r) => {
      if (!acc[r.code]) acc[r.code] = { code: r.code, name: r.name, designation: r.designation, site: r.site, doj: r.doj, present: 0, absent: 0, leave: 0, weekOff: 0 };
      if (r.status === "P") acc[r.code].present += 1;
      else if (r.status === "A") acc[r.code].absent += 1;
      else if (r.status === "L") acc[r.code].leave += 1;
      else if (r.status === "WO") acc[r.code].weekOff += 1;
      return acc;
    }, {})
  );

  // When exactly one employee matches (e.g. searched by code), open their detail directly.
  useEffect(() => {
    if (searched && summary.length === 1) setOpenCode(summary[0].code);
  }, [searched, summary.length === 1 ? summary[0].code : null]);

  const openEmp = summary.find(s => s.code === openCode);
  const openRecords = openCode ? filtered.filter(r => r.code === openCode).sort((a, b) => b.dateISO.localeCompare(a.dateISO)) : [];

  // Build one column per date in the selected range, labeled like "26-Tue"
  const dateCols = [];
  {
    let d = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");
    while (d <= end) {
      dateCols.push({ dateISO: d.toISOString().slice(0, 10), label: `${d.getDate()}-${d.toLocaleDateString("en-US", { weekday: "short" })}` });
      d.setDate(d.getDate() + 1);
    }
  }
  // code -> { dateISO: statusLetter }
  const attendanceMap = {};
  filtered.forEach(r => {
    if (!attendanceMap[r.code]) attendanceMap[r.code] = {};
    attendanceMap[r.code][r.dateISO] = r.status;
  });

  const doExport = () => {
    const employees = openEmp ? [openEmp] : summary;
    exportAttendanceCalendar(
      openEmp ? `Attendance_${openEmp.code}` : "Attendance_Report",
      "Viewmatics",
      employees, dateCols, attendanceMap
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["attendance", "Attendance"], ["ot", "OT Report"]].map(([k, label]) => (
          <button key={k} onClick={() => setReportTab(k)} style={{
            padding: "8px 18px", borderRadius: 8, fontFamily: bodyFont, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${reportTab === k ? C.primary : C.border}`, background: reportTab === k ? C.primaryTint : C.paper, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {reportTab === "ot" ? (
        <OTReportSection selectedSite={selectedSite} />
      ) : (
      <>
      <ReportHeader sub="Day-wise attendance across every employee, filterable and exportable" onDownload={doExport} />
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
          <button onClick={() => { setSearched(true); setOpenCode(null); }} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
        {searched && <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft }}>{summary.length} employees match this filter.</div>}
      </Card>

      {loading ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Loading attendance…</div>
        </Card>
      ) : error ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.danger }}>Couldn't load attendance: {error}</div>
        </Card>
      ) : !searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see attendance records.</div>
        </Card>
      ) : openEmp ? (
        <>
          {summary.length > 1 && (
            <button onClick={() => setOpenCode(null)} style={{ background: "none", border: "none", color: C.primary, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>
              ← Back to all {summary.length} employees
            </button>
          )}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 17, color: C.ink }}>{openEmp.name}</div>
            <div style={{ fontFamily: monoFont, fontSize: 12, color: C.inkSoft }}>{openEmp.code} · {openEmp.designation} · {openEmp.site}</div>
          </Card>
          <div style={{ display: "flex", gap: 16 }}>
            <Card style={{ flex: 1.6 }}>
              <SectionLabel>Attendance — Date-wise</SectionLabel>
              <Table
                columns={["Date", "Status", "In", "Out"]}
                rows={openRecords.map(r => [
                  r.date,
                  <Stamp key={r.dateISO} text={r.status} tone={r.status === "P" ? "success" : r.status === "A" ? "danger" : r.status === "WO" ? "neutral" : "accent"} />,
                  r.inTime, r.outTime,
                ])}
              />
            </Card>
            <Card style={{ flex: 1 }}>
              <SectionLabel>Summary</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Present", openEmp.present, "success"],
                  ["Absent", openEmp.absent, "danger"],
                  ["Leave", openEmp.leave, "accent"],
                  ["Week Off", openEmp.weekOff, "neutral"],
                ].map(([label, val, tone]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.ink }}>{label}</span>
                    <Stamp text={val} tone={tone} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <Table
            columns={["Code", "Name", "Designation", "Site", "Present", "Absent", "Leave", "WO", ""]}
            rows={summary.slice(0, 200).map(s => [
              s.code, s.name, s.designation, s.site,
              <Stamp key={s.code + "p"} text={s.present} tone="success" />,
              <Stamp key={s.code + "a"} text={s.absent} tone="danger" />,
              <Stamp key={s.code + "l"} text={s.leave} tone="accent" />,
              <Stamp key={s.code + "w"} text={s.weekOff} tone="neutral" />,
              <button key={"v" + s.code} onClick={() => setOpenCode(s.code)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
            ])}
          />
          {summary.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No attendance records match this filter.</div>
          )}
          {summary.length > 200 && (
            <div style={{ padding: 12, textAlign: "center", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft }}>
              Showing first 200 of {summary.length} — export to Excel for the full set.
            </div>
          )}
        </Card>
      )}
      </>
      )}
    </div>
  );
}

export default AttendanceReportPage;
