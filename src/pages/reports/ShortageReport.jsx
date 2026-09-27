import { useState, useEffect } from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, displayFont, bodyFont, Card, SectionLabel, Kpi, selectStyle, inputStyle, exportToExcelColored, ReportHeader, supabaseClient } from "../../common";

// Real shortage data: Budget comes from `site_designation_budgets`, Present comes
// from counting real `attendance` rows per site+designation+date. Note: Supabase
// doesn't track which shift (G/A/C) each attendance row belongs to, so — unlike
// the old demo version — this can't break shortage down by shift. It shows the
// combined (all-shift) picture for each site+designation+day instead.
function useRealShortageData(fromDate, toDate) {
  const [state, setState] = useState({ loading: true, error: "", sites: [], designations: [], budgetMap: {}, dayMap: {} });
  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    (async () => {
      const [sitesRes, desigRes, budgetRes, attRes] = await Promise.all([
        supabaseClient.from("sites").select("id, name").order("name"),
        supabaseClient.from("designations").select("id, name").order("name"),
        supabaseClient.from("site_designation_budgets").select("site_id, designation_id, morning_count, evening_count, night_count"),
        supabaseClient.from("attendance").select("date, status, employees(site_id, designation_id)").gte("date", fromDate).lte("date", toDate),
      ]);
      if (cancelled) return;
      if (sitesRes.error) { setState({ loading: false, error: sitesRes.error.message, sites: [], designations: [], budgetMap: {}, dayMap: {} }); return; }

      const sites = sitesRes.data || [];
      const designations = desigRes.data || [];

      const budgetMap = {}; // `${siteId}|${desigId}` -> total budget
      (budgetRes.data || []).forEach(b => {
        const key = `${b.site_id}|${b.designation_id}`;
        budgetMap[key] = (budgetMap[key] || 0) + (Number(b.morning_count) || 0) + (Number(b.evening_count) || 0) + (Number(b.night_count) || 0);
      });

      const dayMap = {}; // dateISO -> `${siteId}|${desigId}` -> { present, wo, leave }
      (attRes.data || []).forEach(r => {
        if (!r.employees || !r.employees.site_id || !r.employees.designation_id) return;
        const key = `${r.employees.site_id}|${r.employees.designation_id}`;
        if (!dayMap[r.date]) dayMap[r.date] = {};
        if (!dayMap[r.date][key]) dayMap[r.date][key] = { present: 0, wo: 0, leave: 0 };
        if (r.status === "P") dayMap[r.date][key].present += 1;
        else if (r.status === "WO") dayMap[r.date][key].wo += 1;
        else if (r.status === "L") dayMap[r.date][key].leave += 1;
      });

      setState({ loading: false, error: "", sites, designations, budgetMap, dayMap });
    })();
    return () => { cancelled = true; };
  }, [fromDate, toDate]);
  return state;
}

function ShortageReport({ selectedSite }) {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(today);
  const [designationFilter, setDesignationFilter] = useState("All");
  const [woChecked, setWoChecked] = useState(false);
  const [leaveChecked, setLeaveChecked] = useState(false);
  const [unit, setUnit] = useState("no"); // "no" | "pct"
  const [viewMode, setViewMode] = useState("withBudget");
  const [tableMode, setTableMode] = useState("shortage");
  const [selectedPoint, setSelectedPoint] = useState(null);

  const { loading, error, sites, designations, budgetMap, dayMap } = useRealShortageData(fromDate, toDate);

  const sitesInScope = selectedSite === "All" ? sites : sites.filter(s => s.name === selectedSite);
  const designationsInScope = designationFilter === "All" ? designations : designations.filter(d => d.name === designationFilter);

  const dateList = [];
  { let d = new Date(fromDate + "T00:00:00"); const end = new Date(toDate + "T00:00:00");
    while (d <= end) { dateList.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); } }
  const dateColLabel = (dISO) => {
    const d = new Date(dISO + "T00:00:00");
    return `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}`;
  };

  const shortageFor = (dateISO, siteId, desigId) => {
    const budgeted = budgetMap[`${siteId}|${desigId}`] || 0;
    const cell = (dayMap[dateISO] || {})[`${siteId}|${desigId}`] || { present: 0, wo: 0, leave: 0 };
    let no = budgeted - cell.present;
    if (woChecked) no -= cell.wo;
    if (leaveChecked) no -= cell.leave;
    no = Math.round(no * 10) / 10;
    const pct = budgeted ? Math.round((no / budgeted) * 1000) / 10 : 0;
    return { budgeted, present: cell.present, no, pct };
  };

  const excludedParts = [woChecked && "WO", leaveChecked && "Leave"].filter(Boolean);
  const metricLabel = excludedParts.length === 0 ? "Shortage" : `Shortage (excl. ${excludedParts.join(" & ")})`;

  const matrixRows = sitesInScope.flatMap(site =>
    designationsInScope
      .map(designation => ({
        site: site.name, designation: designation.name,
        perDay: dateList.map(dISO => shortageFor(dISO, site.id, designation.id)),
      }))
      .filter(r => r.perDay.some(d => d.budgeted > 0))
  );
  const anyShortInRow = (r) => r.perDay.some(d => (unit === "no" ? d.no : d.pct) > 0);
  const flatForKpis = matrixRows.flatMap(r => r.perDay.map(d => ({ budgeted: d.budgeted, shortageNo: d.no, shortagePct: d.pct })));
  const totalBudget = flatForKpis.reduce((s, r) => s + r.budgeted, 0);
  const totalShortageNo = flatForKpis.reduce((s, r) => s + Math.max(r.shortageNo, 0), 0);
  const avgShortagePctOverall = flatForKpis.length ? (flatForKpis.reduce((s, r) => s + Math.max(r.shortagePct, 0), 0) / flatForKpis.length).toFixed(1) : 0;
  const avgShortageNoOverall = flatForKpis.length ? (flatForKpis.reduce((s, r) => s + Math.max(r.shortageNo, 0), 0) / flatForKpis.length).toFixed(1) : 0;

  const trendData = dateList.map(dISO => {
    let noSum = 0, budgetSum = 0;
    sitesInScope.forEach(site => designationsInScope.forEach(designation => {
      const r = shortageFor(dISO, site.id, designation.id);
      noSum += Math.max(r.no, 0); budgetSum += r.budgeted;
    }));
    const d = new Date(dISO + "T00:00:00");
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    return {
      dateISO: dISO, date, dayName, label: `${dayName} ${date}`,
      no: Math.round(noSum * 10) / 10, budget: budgetSum,
      pct: budgetSum ? Number(((noSum / budgetSum) * 100).toFixed(1)) : 0,
    };
  });

  if (loading) return <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Loading shortage data…</div></Card>;
  if (error) return <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.danger }}>Couldn't load shortage data: {error}</div></Card>;

  return (
    <div>
      <ReportHeader sub="Budgeted vs. actual headcount, by site and designation" />
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: -14, marginBottom: 16, fontStyle: "italic" }}>
        Shift-level breakdown isn't tracked in Supabase yet — this shows combined (all-shift) shortage per site/designation.
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Kpi label="Total Budget" value={totalBudget} tone="primary" />
        <Kpi label={`Total ${unit === "no" ? metricLabel + " (No.)" : metricLabel + " (%)"}`} value={unit === "no" ? totalShortageNo : `${avgShortagePctOverall}%`} tone="danger" sub={selectedSite === "All" ? "Across all sites" : selectedSite} />
        <Kpi label={`Average ${unit === "no" ? "Shortage (No.)" : "Shortage (%)"}`} value={unit === "no" ? avgShortageNoOverall : `${avgShortagePctOverall}%`} tone="accent" sub="Per row, over the date range" />
        <Kpi label="Sites Affected" value={new Set(matrixRows.filter(anyShortInRow).map(r => r.site)).size} tone="accent" />
        <Kpi label="Designations Affected" value={new Set(matrixRows.filter(anyShortInRow).map(r => r.designation)).size} tone="primary" />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Filters (apply to both trend and table)</SectionLabel>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Date Range</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" style={{ ...inputStyle, width: 145 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <input type="date" style={{ ...inputStyle, width: 145 }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Designation</div>
            <select style={{ ...selectStyle, width: 180 }} value={designationFilter} onChange={e => setDesignationFilter(e.target.value)}>
              <option>All</option>
              {designations.map(d => <option key={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Count as Shortage</div>
            <div style={{ display: "flex", gap: 20 }}>
              {[["wo", "Week Off (WO)", woChecked, setWoChecked], ["leave", "Leave", leaveChecked, setLeaveChecked]].map(([key, label, checked, setChecked]) => (
                <button key={key} onClick={() => setChecked(!checked)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {checked ? <CheckCircle2 size={18} color={C.primary} /> : <div style={{ width: 18, height: 18, border: `1.5px solid ${C.border}`, borderRadius: 5 }} />}
                  <span style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 500, color: C.ink }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Measure</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["no", "By No."], ["pct", "By %"]].map(([k, label]) => (
                <button key={k} onClick={() => setUnit(k)} style={{
                  padding: "7px 14px", borderRadius: 8, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600,
                  border: `1.5px solid ${unit === k ? C.primary : C.border}`, background: unit === k ? C.primaryTint : C.paper, cursor: "pointer",
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>{metricLabel} — Trend ({fromDate} to {toDate})</SectionLabel>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData} onClick={e => { if (e && e.activePayload && e.activePayload.length) setSelectedPoint(e.activePayload[0].payload); }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="label" tick={{ fontFamily: bodyFont, fontSize: 10 }} interval={Math.ceil(trendData.length / 10)} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} unit={unit === "pct" ? "%" : ""} />
            <Tooltip />
            <Line type="monotone" dataKey={unit === "no" ? "no" : "pct"} name={unit === "no" ? "Shortage (No.)" : "Shortage (%)"} stroke={C.danger} strokeWidth={2.5} dot={{ r: 3, cursor: "pointer" }} activeDot={{ r: 6, cursor: "pointer" }} />
          </LineChart>
        </ResponsiveContainer>
        {selectedPoint && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: C.dangerTint, borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 13, color: C.ink }}>
              <b>{selectedPoint.dayName}, {selectedPoint.date}</b> ({selectedPoint.dateISO})
            </span>
            <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.inkSoft }}>
              Budget: <b style={{ color: C.ink }}>{selectedPoint.budget}</b>
            </span>
            <span style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15, color: C.danger }}>
              {unit === "no" ? Math.max(selectedPoint.no, 0) : `${Math.max(selectedPoint.pct, 0)}%`}
            </span>
          </div>
        )}
      </Card>

      <Card>
        <SectionLabel right={
          <div style={{ display: "flex", gap: 6 }}>
            {[["withBudget", "With Budget"], ["shortageOnly", "Shortage Only"]].map(([k, label]) => (
              <button key={k} onClick={() => setViewMode(k)} style={{
                padding: "6px 12px", borderRadius: 8, fontFamily: bodyFont, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${viewMode === k ? C.primary : C.border}`, background: viewMode === k ? C.primaryTint : C.paper, cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        }>Report</SectionLabel>
        {(() => {
          const metricPrefix = tableMode === "surplus" ? "Surplus" : "Shortage";
          const cellFor = (d) => {
            const val = unit === "no" ? d.no : d.pct;
            if (tableMode === "shortage") {
              const v = Math.max(val, 0);
              return { text: unit === "no" ? `${v}` : `${v}%`, color: v > 0 ? C.danger : C.inkSoft, raw: v };
            }
            if (tableMode === "surplus") {
              const v = Math.max(-val, 0);
              return { text: unit === "no" ? `${v}` : `${v}%`, color: v > 0 ? C.primary : C.inkSoft, raw: v };
            }
            if (val > 0) return { text: unit === "no" ? `${val}` : `${val}%`, color: C.danger, raw: val };
            if (val < 0) return { text: unit === "no" ? `+${Math.abs(val)}` : `+${Math.abs(val)}%`, color: C.primary, raw: val };
            return { text: "0", color: C.inkSoft, raw: 0 };
          };
          const showSiteCol = selectedSite === "All";
          const columns = [
            ...(showSiteCol ? ["Site"] : []),
            "Designation",
            ...(viewMode === "withBudget" ? dateList.map(d => `Budget-${dateColLabel(d)}`) : []),
            ...(viewMode === "withBudget" ? dateList.map(d => `Present-${dateColLabel(d)}`) : []),
            ...dateList.map(d => `${metricPrefix}-${dateColLabel(d)}`),
          ];
          const rows = matrixRows.map(r => [
            ...(showSiteCol ? [r.site] : []),
            r.designation,
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.budgeted) : []),
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.present) : []),
            ...r.perDay.map(d => {
              const c = cellFor(d);
              return <b style={{ color: c.color }}>{c.text}</b>;
            }),
          ]);
          const exportRows = matrixRows.map(r => [
            ...(showSiteCol ? [r.site] : []),
            r.designation,
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.budgeted) : []),
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.present) : []),
            ...r.perDay.map(d => {
              const c = cellFor(d);
              const tone = c.raw > 0 ? "danger" : c.raw < 0 ? "primary" : "neutral";
              return { text: c.text, tone };
            }),
          ]);
          const doExport = () => exportToExcelColored(`Shortage_Report_${tableMode}`, columns, exportRows);

          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Report Type</div>
                  <select style={{ ...selectStyle, width: 160 }} value={tableMode} onChange={e => setTableMode(e.target.value)}>
                    <option value="shortage">Shortage</option>
                    <option value="surplus">Surplus</option>
                    <option value="overall">Overall</option>
                  </select>
                </div>
                <button onClick={doExport} style={{
                  display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
                  padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}><FileText size={14} /> Export to Excel</button>
              </div>
              <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <table style={{ borderCollapse: "collapse", fontFamily: bodyFont, fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      {columns.map((c, ci) => {
                        const designationColIdx = showSiteCol ? 1 : 0;
                        const frozen = ci === designationColIdx;
                        return (
                          <th key={c} style={{
                            padding: "10px 14px", fontWeight: 700, color: C.ink, fontSize: 11.5, letterSpacing: "0.03em",
                            textTransform: "uppercase", borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap",
                            position: frozen ? "sticky" : "static", left: frozen ? 0 : undefined,
                            background: "#F3F1EA", zIndex: frozen ? 2 : 1,
                            boxShadow: frozen ? "2px 0 4px rgba(0,0,0,0.06)" : "none",
                          }}>{c}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, ri) => {
                      const rowBg = ri % 2 === 1 ? "#FAF9F5" : "#FFFFFF";
                      const designationColIdx = showSiteCol ? 1 : 0;
                      return (
                        <tr key={ri}>
                          {r.map((cell, ci) => {
                            const frozen = ci === designationColIdx;
                            return (
                              <td key={ci} style={{
                                padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.ink, whiteSpace: "nowrap",
                                position: frozen ? "sticky" : "static", left: frozen ? 0 : undefined,
                                background: rowBg, zIndex: frozen ? 1 : 0,
                                boxShadow: frozen ? "2px 0 4px rgba(0,0,0,0.06)" : "none",
                              }}>{cell}</td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {matrixRows.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", fontFamily: bodyFont, fontSize: 13, color: C.inkSoft }}>No rows match this filter — set a headcount budget for this site/designation on the Shift Budget page first.</div>
              )}
              {tableMode === "overall" && (
                <div style={{ padding: "10px 4px 0", fontFamily: bodyFont, fontSize: 11, color: C.inkSoft }}>
                  A "+N" figure means more people were present than budgeted that day (surplus, not a shortage).
                </div>
              )}
            </>
          );
        })()}
      </Card>
    </div>
  );
}


export default ShortageReport;
