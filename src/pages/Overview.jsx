import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from "recharts";
import { C, displayFont, bodyFont, monoFont, SITES, getLivePunch, seededVariation, getPresentByShiftForDate, ORG_DIRECTORY, getSiteAttendanceSummary, hoursToHHMM, otReportSeed, splitBudgetByShift, costPie, escalationsReportData, Stamp, Card, SectionLabel, Kpi, Table, inputStyle, Field2, supabaseClient } from "../common";
import LiveAttendanceReal from "../components/LiveAttendanceReal";

function useRealOrgKpis() {
  const [state, setState] = useState({
    loading: true, budget: 0, present: 0, orgAttendancePct: 0, newHiredToday: null,
  });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [empRes, budgetRes, attRes] = await Promise.all([
        supabaseClient.from("employees").select("id, created_at").eq("active", true),
        supabaseClient.from("site_designation_budgets").select("morning_count, evening_count, night_count"),
        supabaseClient.from("attendance").select("employee_id, punch_in").eq("date", today),
      ]);
      if (cancelled) return;
      const employees = empRes.data || [];
      const budgets = budgetRes.data || [];
      const empIds = new Set(employees.map(e => e.id));
      const att = (attRes.data || []).filter(r => empIds.has(r.employee_id));
      const budget = budgets.reduce(
        (sum, b) => sum + (Number(b.morning_count) || 0) + (Number(b.evening_count) || 0) + (Number(b.night_count) || 0),
        0
      );
      const present = att.filter(r => r.punch_in != null).length;
      const orgAttendancePct = employees.length > 0 ? Math.round((present / employees.length) * 100) : 0;
      // Only claim a "new hired" figure if employees.created_at actually came back —
      // if that column doesn't exist in your schema, this stays null and the card
      // shows a plain dash instead of a fabricated number.
      let newHiredToday = null;
      if (employees.length > 0 && employees[0].created_at !== undefined) {
        newHiredToday = employees.filter(e => e.created_at && e.created_at.slice(0, 10) === today).length;
      }
      setState({ loading: false, budget, present, orgAttendancePct, newHiredToday });
    })();
    return () => { cancelled = true; };
  }, []);
  return state;
}

function MasterOverview({ selectedSite, rates }) {
  const realKpis = useRealOrgKpis();
  const DAYS_IN_MONTH = 30;
  const [asOfDate, setAsOfDate] = useState("2026-07-22");
  const [liveSelected, setLiveSelected] = useState(null); // { designation, shift }
  const [otDate, setOtDate] = useState("2026-07-22");
  const [sitesDate, setSitesDate] = useState("2026-07-22");
  const [donutHovered, setDonutHovered] = useState(false);
  useEffect(() => { setLiveSelected(null); }, [selectedSite]);

  const sites = selectedSite === "All" ? SITES : SITES.filter(s => s.name === selectedSite);
  const pie = selectedSite === "All" ? costPie : costPie.filter(c => c.name === selectedSite);
  const mockTotalBudget = sites.reduce((s, x) => s + getSiteAttendanceSummary(x.name, "2026-07-22").budget, 0);
  const mockTotalPresent = sites.reduce((s, x) => s + getSiteAttendanceSummary(x.name, "2026-07-22").present, 0);
  const useReal = selectedSite === "All" && !realKpis.loading;
  const totalBudget = useReal ? realKpis.budget : mockTotalBudget;
  const totalPresent = useReal ? realKpis.present : mockTotalPresent;
  const orgAttendance = useReal ? realKpis.orgAttendancePct : (mockTotalBudget ? Math.round((mockTotalPresent / mockTotalBudget) * 100) : 0);
  const totalCost = sites.reduce((s, x) => s + x.cost, 0);

  const site = sites[0];

  // Budget vs Actual manpower, by designation — budgeted = assigned headcount (ORG_DIRECTORY),
  // actual = present count as of the selected date. When Shiftwise is checked, both budget
  // and actual are additionally split into G (General) / A (Afternoon) / C (Night) shifts.
  const manpowerByDesignation = site
    ? Object.entries(
        ORG_DIRECTORY.filter(e => e.site === site.name).reduce((acc, e) => {
          acc[e.designation] = (acc[e.designation] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([designation, budgeted]) => {
          const shifts = getPresentByShiftForDate(asOfDate, site.name, designation, budgeted);
          const actual = shifts.G + shifts.A + shifts.C;
          const budgetShifts = splitBudgetByShift(designation, budgeted);
          return {
            designation, budgeted, actual, remaining: Math.max(budgeted - actual, 0),
            shiftG: shifts.G, shiftA: shifts.A, shiftC: shifts.C,
            budgetG: budgetShifts.G, budgetA: budgetShifts.A, budgetC: budgetShifts.C,
            pctPresent: budgeted ? Math.round((actual / budgeted) * 100) : 0,
          };
        })
        .sort((a, b) => b.budgeted - a.budgeted)
    : [];

  // Click-to-drill-down for the Live Report table — same pattern as Designation
  // Summary Report: "today" shows real punched-in employees, other dates estimate
  // deterministically from the roster since there's no real per-day history.
  const liveEmployeesFor = (designation, shiftKey, targetCount) => {
    if (designation === "ALL") {
      return manpowerByDesignation.flatMap(m => liveEmployeesFor(m.designation, shiftKey, m[`shift${shiftKey}`] || 0));
    }
    if (asOfDate === "2026-07-22") {
      return ORG_DIRECTORY.filter(e => e.site === site.name && e.designation === designation)
        .map(e => ({ ...e, ...getLivePunch(e.code) }))
        .filter(e => e.punchedIn && e.shift === shiftKey);
    }
    const roster = ORG_DIRECTORY.filter(e => e.site === site.name && e.designation === designation)
      .map(e => ({ ...e, shift: shiftKey, time: "—", h: seededVariation(asOfDate, site.name, e.code, 0, 1000) }))
      .sort((a, b) => a.h - b.h);
    return roster.slice(0, targetCount);
  };
  const liveTotalRow = {
    designation: "ALL",
    budgeted: manpowerByDesignation.reduce((s, m) => s + m.budgeted, 0),
    actual: manpowerByDesignation.reduce((s, m) => s + m.actual, 0),
    shiftG: manpowerByDesignation.reduce((s, m) => s + m.shiftG, 0), budgetG: manpowerByDesignation.reduce((s, m) => s + m.budgetG, 0),
    shiftA: manpowerByDesignation.reduce((s, m) => s + m.shiftA, 0), budgetA: manpowerByDesignation.reduce((s, m) => s + m.budgetA, 0),
    shiftC: manpowerByDesignation.reduce((s, m) => s + m.shiftC, 0), budgetC: manpowerByDesignation.reduce((s, m) => s + m.budgetC, 0),
  };
  const liveRowFor = (designation) => designation === "ALL" ? liveTotalRow : manpowerByDesignation.find(m => m.designation === designation);

  // OT summary, by designation, for the selected date
  const otByDesignation = site
    ? Object.values(
        otReportSeed
          .filter(r => r.site === site.name && r.dateISO === otDate)
          .reduce((acc, r) => {
            if (!acc[r.designation]) acc[r.designation] = { designation: r.designation, applied: 0, actual: 0 };
            acc[r.designation].applied += r.otApplied;
            acc[r.designation].actual += r.actualOT;
            return acc;
          }, {})
      ).sort((a, b) => b.actual - a.actual)
    : [];
  const otTotals = otByDesignation.reduce((acc, r) => ({
    applied: acc.applied + r.applied, actual: acc.actual + r.actual,
  }), { applied: 0, actual: 0 });

  const liveSelectedList = liveSelected
    ? (liveSelected.shift === "ALL"
        ? ["G", "A", "C"].flatMap(sk => liveEmployeesFor(liveSelected.designation, sk, liveRowFor(liveSelected.designation)?.[`shift${sk}`] || 0))
        : liveEmployeesFor(liveSelected.designation, liveSelected.shift, liveRowFor(liveSelected.designation)?.[`shift${liveSelected.shift}`] || 0))
    : [];
  const liveSelectedRow = liveSelected ? liveRowFor(liveSelected.designation) : null;
  const LIVE_SHIFT_LABEL = { G: "General", A: "Afternoon", C: "Night", ALL: "All Shifts" };

  // Cost by designation — CostPerDay = Present(designation) × (MonthlyRate / 30). Accrued cost
  // is a running total: the actual present count is looked up for EVERY day from the 1st of
  // the month through the selected date, and each day's cost is summed. This guarantees accrued
  // cost only ever goes up (or stays flat) as the date moves forward — it can't drop just
  // because one particular day happened to have lower attendance than the day before it.
  const monthStart = new Date(asOfDate + "T00:00:00");
  monthStart.setDate(1);
  const daysUpToSelected = [];
  { let d = new Date(monthStart); const end = new Date(asOfDate + "T00:00:00");
    while (d <= end) { daysUpToSelected.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); } }

  const costByDesignation = site
    ? manpowerByDesignation
        .map(m => {
          const r = rates.find(x => x.site === site.name && x.designation === m.designation);
          const monthlyRate = r ? r.monthlyRate : 0;
          const monthlyCost = monthlyRate * m.budgeted;
          const dailyRate = monthlyRate / DAYS_IN_MONTH;
          const costToday = Math.round(m.actual * dailyRate);
          const runningTotal = daysUpToSelected.reduce((sum, dISO) => {
            if (dISO === asOfDate) return sum + m.actual * dailyRate;
            const shifts = getPresentByShiftForDate(dISO, site.name, m.designation, m.budgeted);
            return sum + (shifts.G + shifts.A + shifts.C) * dailyRate;
          }, 0);
          const accruedCost = Math.min(Math.round(runningTotal), monthlyCost);
          return {
            designation: m.designation, headcount: m.budgeted, cost: monthlyCost,
            actual: m.actual, costToday, accruedCost, remainingCost: Math.max(monthlyCost - accruedCost, 0),
          };
        })
        .sort((a, b) => b.cost - a.cost)
    : [];
  const siteDesignationCostTotal = costByDesignation.reduce((s, c) => s + c.cost, 0);
  const siteDesignationAccruedTotal = costByDesignation.reduce((s, c) => s + c.accruedCost, 0);

  return (
    <div>
      <LiveAttendanceReal />
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Kpi label="Budget" value={selectedSite === "All" ? totalBudget : liveTotalRow.budgeted} tone="primary" />
        <Kpi label="Present Headcount" value={selectedSite === "All" ? totalPresent : liveTotalRow.actual} tone="primary" sub={selectedSite === "All" ? undefined : "Present today"} />
        {selectedSite === "All" ? (
          <Kpi label="Org Attendance" value={`${orgAttendance}%`} trend={useReal ? undefined : 1} tone="success" />
        ) : (
          <Card style={{ flex: 1, padding: "18px 20px" }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500, marginBottom: 10 }}>Shift Attendance</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {["G", "A", "C"].map(sk => {
                const pct = liveTotalRow[`budget${sk}`] ? Math.round((liveTotalRow[`shift${sk}`] / liveTotalRow[`budget${sk}`]) * 100) : 0;
                return (
                  <div key={sk} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 12, color: C.inkSoft, width: 14 }}>{sk}</span>
                    <span style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15, color: C.ink }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        <Kpi
          label="Open Escalations"
          value={escalationsReportData.filter(e => e.status === "Open" && (selectedSite === "All" || e.site === selectedSite)).length}
          tone="danger"
          sub={useReal ? "demo data — no escalations table yet" : undefined}
        />
        <Kpi
          label="New Hired"
          value={
            useReal
              ? (realKpis.newHiredToday ?? "—")
              : ORG_DIRECTORY.filter(e => e.doj === "2026-07-22" && (selectedSite === "All" || e.site === selectedSite)).length
          }
          tone="accent"
          sub={useReal && realKpis.newHiredToday == null ? "no hire-date field yet" : "Joined today"}
        />
      </div>

      {selectedSite === "All" ? (
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <Card style={{ flex: 1 }}>
            <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>demo data</span>}>Task Completion by Site</SectionLabel>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[...sites].sort((a, b) => b.taskCompletion - a.taskCompletion).map(s => ({ ...s, shortName: s.name.replace(/^DLF Cyber Hub — /, "") }))}
                margin={{ top: 16, left: 0, right: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="shortName" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: bodyFont, fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="taskCompletion" fill={C.success} radius={[10, 10, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="taskCompletion" position="top" formatter={(v) => `${v}%`} style={{ fontFamily: bodyFont, fontSize: 11, fill: C.ink, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ flex: 1 }}>
            <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>demo data</span>}>Cost Share by Site</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...pie].sort((a, b) => b.value - a.value)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontFamily: bodyFont, fontSize: 10.5 }} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {pie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  <LabelList dataKey="value" position="right" formatter={(v) => `₹${(v / 1000).toFixed(0)}k`} style={{ fontFamily: bodyFont, fontSize: 10.5, fill: C.inkSoft }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
              Total: <b style={{ color: C.ink }}>₹{totalCost.toLocaleString("en-IN")}</b>
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <Card style={{ flex: 1.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <SectionLabel>Live Report</SectionLabel>
              <Field2 label="As of Date">
                <input type="date" style={{ ...inputStyle, width: 140 }} value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
              </Field2>
            </div>

            {/* Overall donut summary */}
            {(() => {
              const totalBudgeted = manpowerByDesignation.reduce((s, m) => s + m.budgeted, 0);
              const totalActual = manpowerByDesignation.reduce((s, m) => s + m.actual, 0);
              const overBudget = totalBudgeted > 0 && totalActual > totalBudgeted;
              const pct = totalBudgeted ? Math.round((totalActual / totalBudgeted) * 100) : 0;
              return (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, color: C.ink, marginBottom: 10 }}>Overall Summary</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div
                      onMouseEnter={() => setDonutHovered(true)}
                      onMouseLeave={() => setDonutHovered(false)}
                      style={{
                        position: "relative", width: 140, height: 140, flexShrink: 0, borderRadius: "50%",
                        boxShadow: donutHovered ? `0 0 0 5px ${overBudget ? "#6B3FA044" : `${C.success}44`}` : "none",
                        transition: "box-shadow 0.15s ease",
                      }}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={[{ v: totalActual }, { v: Math.max(totalBudgeted - totalActual, 0) }]} dataKey="v" innerRadius={46} outerRadius={66} startAngle={90} endAngle={-270}>
                            <Cell fill={overBudget ? "#6B3FA0" : C.success} /><Cell fill="#ECEAE1" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: overBudget ? "#6B3FA0" : C.ink }}>{pct}%</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9, color: C.inkSoft }}>Fulfillment</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.success }}>{totalActual}</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Actual</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.ink }}>{totalBudgeted}</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Budget</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.danger }}>{getSiteAttendanceSummary(site.name, "2026-07-22").absent}</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Absent</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, color: C.ink, marginBottom: 8 }}>Budget vs Actual</div>
            <ResponsiveContainer width="100%" height={Math.max(manpowerByDesignation.length * 34 + 40, 190)}>
              <BarChart data={manpowerByDesignation} layout="vertical" margin={{ left: 20, right: 16, top: 4, bottom: 4 }} barCategoryGap={10} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickCount={6} tick={{ fontFamily: bodyFont, fontSize: 11 }} />
                <YAxis type="category" dataKey="designation" width={130} tick={{ fontFamily: bodyFont, fontSize: 10.5, fontWeight: 500 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ fontFamily: bodyFont, fontSize: 12, background: C.paper, borderRadius: 8, border: `1px solid ${C.border}`, padding: "8px 12px" }}>
                        <div style={{ fontWeight: 700, marginBottom: 3 }}>{d.designation}</div>
                        <div style={{ color: C.inkSoft }}>Actual {d.actual} / Budget {d.budgeted}</div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: bodyFont, fontSize: 11 }} />
                <Bar dataKey="actual" name="Actual" stackId="manpower" fill="#2C5A8C" radius={[8, 0, 0, 8]}>
                  <LabelList dataKey="actual" position="center" formatter={(v) => v > 0 ? v : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#fff", fontWeight: 600 }} />
                </Bar>
                <Bar dataKey="remaining" name="Vacant" stackId="manpower" fill="#8FA6BC" radius={[0, 8, 8, 0]}>
                  <LabelList dataKey="remaining" position="center" formatter={(v) => v > 0 ? v : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#fff", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {/* Clickable table — every shift cell and the Total cell drill down on the right */}
              <div style={{ flex: 1.2, overflowX: "auto" }}>
                <Table
                  columns={["Designation", "G", "A", "C", "Total", "Fulfillment"]}
                  rows={manpowerByDesignation.map(m => {
                    const CellBtn = ({ shiftKey, actualV, budgetV }) => {
                      const active = liveSelected && liveSelected.designation === m.designation && liveSelected.shift === shiftKey;
                      const over = budgetV > 0 && actualV > budgetV;
                      const short = actualV < budgetV;
                      return (
                        <button onClick={() => setLiveSelected({ designation: m.designation, shift: shiftKey })} style={{
                          background: active ? C.primaryTint : "none", border: active ? `1.5px solid ${C.primary}` : "none",
                          borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontFamily: bodyFont, fontWeight: 600, fontSize: 12,
                          color: over ? "#6B3FA0" : short ? C.danger : C.ink,
                        }}>{actualV}/{budgetV}</button>
                      );
                    };
                    const fulfillPct = m.budgeted ? Math.round((m.actual / m.budgeted) * 100) : 0;
                    const fulfillOver = m.budgeted > 0 && m.actual > m.budgeted;
                    const fulfillTone = fulfillPct >= 100 ? "success" : fulfillPct >= 60 ? "accent" : "danger";
                    return [
                      m.designation,
                      <CellBtn key="G" shiftKey="G" actualV={m.shiftG} budgetV={m.budgetG} />,
                      <CellBtn key="A" shiftKey="A" actualV={m.shiftA} budgetV={m.budgetA} />,
                      <CellBtn key="C" shiftKey="C" actualV={m.shiftC} budgetV={m.budgetC} />,
                      <CellBtn key="ALL" shiftKey="ALL" actualV={m.actual} budgetV={m.budgeted} />,
                      fulfillOver ? (
                        <span key="fulfill" style={{
                          display: "inline-flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontWeight: 600,
                          color: "#6B3FA0", background: "#E4D6F0", borderRadius: 6, padding: "4px 10px 4px 8px", fontSize: 12,
                        }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B3FA0", flexShrink: 0 }} />{fulfillPct}%</span>
                      ) : (
                        <Stamp key="fulfill" text={`${fulfillPct}%`} tone={fulfillTone} />
                      ),
                    ];
                  }).concat([(() => {
                    const TotalCellBtn = ({ shiftKey, actualV, budgetV }) => {
                      const active = liveSelected && liveSelected.designation === "ALL" && liveSelected.shift === shiftKey;
                      const over = budgetV > 0 && actualV > budgetV;
                      const short = actualV < budgetV;
                      return (
                        <button onClick={() => setLiveSelected({ designation: "ALL", shift: shiftKey })} style={{
                          background: active ? C.primaryTint : "none", border: active ? `1.5px solid ${C.primary}` : `1px solid ${C.primary}55`,
                          borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontFamily: bodyFont, fontWeight: 700, fontSize: 12,
                          color: over ? "#6B3FA0" : short ? C.danger : C.primary,
                        }}>{actualV}/{budgetV}</button>
                      );
                    };
                    const totalFulfillPct = liveTotalRow.budgeted ? Math.round((liveTotalRow.actual / liveTotalRow.budgeted) * 100) : 0;
                    return [
                      <b key="label" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12 }}>Total (All)</b>,
                      <TotalCellBtn key="G" shiftKey="G" actualV={liveTotalRow.shiftG} budgetV={liveTotalRow.budgetG} />,
                      <TotalCellBtn key="A" shiftKey="A" actualV={liveTotalRow.shiftA} budgetV={liveTotalRow.budgetA} />,
                      <TotalCellBtn key="C" shiftKey="C" actualV={liveTotalRow.shiftC} budgetV={liveTotalRow.budgetC} />,
                      <TotalCellBtn key="ALL" shiftKey="ALL" actualV={liveTotalRow.actual} budgetV={liveTotalRow.budgeted} />,
                      <Stamp key="fulfill" text={`${totalFulfillPct}%`} tone={totalFulfillPct >= 100 ? "success" : totalFulfillPct >= 60 ? "accent" : "danger"} />,
                    ];
                  })()])}
                />
              </div>

              {/* Detail panel — shows drill-down for whichever cell was clicked */}
              <div style={{ flex: 1 }}>
                <Card style={{ padding: 10, background: C.bg }}>
                  {!liveSelected || !liveSelectedRow ? (
                    <div style={{ textAlign: "center", padding: "20px 6px", color: C.inkSoft, fontFamily: bodyFont, fontSize: 11.5 }}>
                      Click any cell to see who's on it.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 4 }}>
                        {liveSelected.designation === "ALL" ? "All Designations" : liveSelected.designation} — {LIVE_SHIFT_LABEL[liveSelected.shift]}
                      </div>
                      <div style={{ display: "flex", gap: 12, marginBottom: 8, fontFamily: bodyFont, fontSize: 11, color: C.inkSoft }}>
                        <span>Actual: <b style={{ color: C.success }}>{liveSelected.shift === "ALL" ? liveSelectedRow.actual : liveSelectedRow[`shift${liveSelected.shift}`]}</b></span>
                        <span>Budget: <b style={{ color: C.ink }}>{liveSelected.shift === "ALL" ? liveSelectedRow.budgeted : liveSelectedRow[`budget${liveSelected.shift}`]}</b></span>
                      </div>
                      {asOfDate !== "2026-07-22" && (
                        <div style={{ fontFamily: bodyFont, fontSize: 10, color: C.inkSoft, background: C.accentTint, padding: "5px 8px", borderRadius: 6, marginBottom: 8 }}>
                          Estimated roster for {asOfDate} — only today's punch data is exact.
                        </div>
                      )}
                      {liveSelectedList.length === 0 ? (
                        <div style={{ textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 11.5, padding: 10 }}>No one punched in.</div>
                      ) : (
                        liveSelectedList.map(e => (
                          <div key={e.code + (e.shift || "")} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 11.5 }}>{e.name}</span>
                              <span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft }}>{e.time}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: monoFont, fontSize: 10, color: C.inkSoft }}>
                              <span>{e.code} · {e.designation}</span><span>Shift {e.shift}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </Card>
              </div>
            </div>
          </Card>
          <Card style={{ flex: 1.4 }}>
            <SectionLabel>Cost by Designation</SectionLabel>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginBottom: 10 }}>
              Each bar is the full monthly budgeted cost. The dark segment is what's been accrued so far this month, calculated as Present × (Monthly Rate ÷ 30) per day.
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={costByDesignation} layout="vertical" margin={{ left: 20, right: 12 }} barCategoryGap={14} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fontFamily: bodyFont, fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="designation" width={140} tick={{ fontFamily: bodyFont, fontSize: 11.5, fontWeight: 500 }} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontFamily: bodyFont, fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
                <Legend wrapperStyle={{ fontFamily: bodyFont, fontSize: 11.5 }} />
                <Bar dataKey="accruedCost" name="Accrued (Till Date)" stackId="cost" fill="#6B3FA0" radius={[4, 0, 0, 4]}>
                  <LabelList dataKey="accruedCost" position="center" formatter={(v) => v > 0 ? `₹${(v / 1000).toFixed(1)}k` : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#fff", fontWeight: 600 }} />
                </Bar>
                <Bar dataKey="remainingCost" name="Remaining of Budget" stackId="cost" fill="#E4D6F0" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="remainingCost" position="center" formatter={(v) => v > 0 ? `₹${(v / 1000).toFixed(1)}k` : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#6B3FA0", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10 }}>
              <Table
                columns={["Designation", "Headcount", "Monthly Cost", "Cost (Till Date)", "% Used"]}
                rows={costByDesignation.map(c => {
                  const pctUsed = c.cost ? Math.round((c.accruedCost / c.cost) * 100) : 0;
                  return [
                    c.designation, c.headcount, `₹${c.cost.toLocaleString("en-IN")}`, `₹${c.accruedCost.toLocaleString("en-IN")}`,
                    <Stamp key={c.designation} text={`${pctUsed}%`} tone={pctUsed >= 90 ? "danger" : pctUsed >= 60 ? "accent" : "success"} />,
                  ];
                })}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, marginTop: 10 }}>
              <span>Monthly Total: <b style={{ color: C.ink }}>₹{siteDesignationCostTotal.toLocaleString("en-IN")}</b></span>
              <span>Accrued Till Date: <b style={{ color: C.ink }}>₹{siteDesignationAccruedTotal.toLocaleString("en-IN")}</b></span>
            </div>
          </Card>
        </div>
      )}

      {selectedSite === "All" && (
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <Card style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <SectionLabel>Sites</SectionLabel>
              <Field2 label="Date"><input type="date" min="2026-06-23" max="2026-07-22" style={{ ...inputStyle, width: 140 }} value={sitesDate} onChange={e => setSitesDate(e.target.value)} /></Field2>
            </div>
            <Table
              columns={["Site", "Budget", "Present", "Absent", "Present %", "OT Applied"]}
              rows={SITES.map(s => {
                const { budget, present, absent, pct } = getSiteAttendanceSummary(s.name, sitesDate);
                const otApplied = otReportSeed.filter(r => r.site === s.name && r.dateISO === sitesDate).reduce((sum, r) => sum + r.otApplied, 0);
                return [
                  s.name, budget, present, absent,
                  <Stamp key={s.id} text={`${pct}%`} tone={pct >= 90 ? "success" : pct >= 70 ? "accent" : "danger"} />,
                  hoursToHHMM(otApplied),
                ];
              })}
            />
          </Card>
        </div>
      )}

      <div style={{ display: "flex", gap: 16 }}>
          <Card style={{ flex: 1.3 }}>
            <SectionLabel>Escalations</SectionLabel>
            {(() => {
              const openEsc = escalationsReportData.filter(e => e.status === "Open" && (selectedSite === "All" ? true : e.site === selectedSite));
              const byType = Object.values(
                openEsc.reduce((acc, e) => {
                  if (!acc[e.type]) acc[e.type] = { name: e.type, value: 0 };
                  acc[e.type].value += 1;
                  return acc;
                }, {})
              );
              const avgDaysOpen = openEsc.length ? Math.round(openEsc.reduce((s, e) => s + e.daysToResolve, 0) / openEsc.length) : 0;
              const ESC_COLORS = [C.danger, C.accentDeep, C.primary, "#6B3FA0", "#1F7A6C"];
              return openEsc.length === 0 ? (
                <div style={{ padding: "24px 8px", textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No open escalations{selectedSite !== "All" ? " at this site" : ""}.</div>
              ) : (
                <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
                    <ResponsiveContainer width={108} height={108}>
                      <PieChart>
                        <Pie data={byType} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={3}>
                          {byType.map((entry, i) => <Cell key={i} fill={ESC_COLORS[i % ESC_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.ink }}>{openEsc.length}</div>
                      <div style={{ fontFamily: bodyFont, fontSize: 8.5, color: C.inkSoft }}>Open</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {byType.map((t, i) => (
                      <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 11.5, color: C.ink }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: ESC_COLORS[i % ESC_COLORS.length], flexShrink: 0 }} />
                        {t.name}: <b>{t.value}</b>
                      </div>
                    ))}
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Avg {avgDaysOpen}d open</div>
                  </div>
                </div>
              );
            })()}
            <Table
              columns={["Type", "Ref", "Site", "Days Open"]}
              rows={escalationsReportData.filter(e => e.status === "Open" && (selectedSite === "All" || e.site === selectedSite)).map(e => [e.type, e.ref, e.site, <Stamp key={e.ref} text={`${e.daysToResolve}d`} tone="danger" />])}
            />
          </Card>
          {selectedSite !== "All" && (
            <Card style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <SectionLabel>OT Summary</SectionLabel>
                <Field2 label="Date"><input type="date" style={{ ...inputStyle, width: 140 }} value={otDate} onChange={e => setOtDate(e.target.value)} /></Field2>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.ink }}>{hoursToHHMM(otTotals.applied)}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Applied OT</div>
                </div>
                <div>
                  <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.success }}>{hoursToHHMM(otTotals.actual)}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Actual OT (System)</div>
                </div>
              </div>
              <Table
                columns={["Designation", "Applied OT", "Actual OT (System)"]}
                rows={otByDesignation.map(r => [
                  r.designation, hoursToHHMM(r.applied),
                  <Stamp key={r.designation} text={hoursToHHMM(r.actual)} tone={r.actual < r.applied ? "accent" : "success"} />,
                ])}
              />
              {otByDesignation.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 12.5 }}>No OT logged on this date.</div>
              )}
            </Card>
          )}
        </div>
    </div>
  );
}

/* ============================================================
   SITES OVERVIEW
   ============================================================ */

export default MasterOverview;
