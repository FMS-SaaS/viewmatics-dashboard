import { useState } from "react";
import { Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, bodyFont, DESIGNATIONS, shortPeriodLabel, BUDGET_PERIODS, budgetHistorySeed, Stamp, Card, SectionLabel, Kpi, Table, selectStyle, Field2, exportToExcelColored, ReportHeader } from "../../common";

function BudgetReportPage({ selectedSite }) {
  const [designationFilter, setDesignationFilter] = useState("All");
  const [fromMonth, setFromMonth] = useState(BUDGET_PERIODS[BUDGET_PERIODS.length - 6]); // last 6 months by default
  const [toMonth, setToMonth] = useState(BUDGET_PERIODS[BUDGET_PERIODS.length - 1]);
  const [searched, setSearched] = useState(false);

  const scoped = budgetHistorySeed.filter(r =>
    (selectedSite === "All" || r.site === selectedSite) &&
    (designationFilter === "All" || r.designation === designationFilter)
  );

  const fromIdx = BUDGET_PERIODS.indexOf(fromMonth);
  const toIdx = BUDGET_PERIODS.indexOf(toMonth);
  const rangePeriods = fromIdx <= toIdx ? BUDGET_PERIODS.slice(fromIdx, toIdx + 1) : [];

  // Pivot: one row per Site+Designation, one column per period in the selected range.
  // Change = last period in range minus first period in range (handles any range width,
  // not just a single month vs the one before it).
  const rowKeys = [...new Set(scoped.map(r => r.site + "|" + r.designation))];
  const matrixRows = rowKeys.map(key => {
    const [site, designation] = key.split("|");
    const byPeriod = {};
    rangePeriods.forEach(p => {
      const rec = scoped.find(r => r.site === site && r.designation === designation && r.period === p);
      byPeriod[p] = rec ? rec.budget : 0;
    });
    const first = rangePeriods.length ? byPeriod[rangePeriods[0]] : 0;
    const last = rangePeriods.length ? byPeriod[rangePeriods[rangePeriods.length - 1]] : 0;
    const change = rangePeriods.length > 1 ? last - first : null;
    return { site, designation, byPeriod, current: last, change };
  }).sort((a, b) => b.current - a.current);

  const totalCurrent = matrixRows.reduce((s, r) => s + r.current, 0);
  const totalFirst = matrixRows.reduce((s, r) => s + (rangePeriods.length ? r.byPeriod[rangePeriods[0]] : 0), 0);
  const totalChange = rangePeriods.length > 1 ? totalCurrent - totalFirst : null;
  const increased = matrixRows.filter(r => r.change > 0).length;
  const decreased = matrixRows.filter(r => r.change < 0).length;

  // Trend line — total budget across the range, for the current filter scope
  const trendData = rangePeriods.map(p => ({
    label: shortPeriodLabel(p),
    budget: matrixRows.reduce((s, r) => s + (r.byPeriod[p] || 0), 0),
  }));

  const doExport = () => exportToExcelColored(
    "Budget_Report",
    ["Site", "Designation", ...rangePeriods.map(shortPeriodLabel), "Change"],
    matrixRows.map(r => [
      r.site, r.designation, ...rangePeriods.map(p => r.byPeriod[p]),
      r.change === null
        ? { text: "—", tone: "neutral" }
        : { text: r.change > 0 ? `+${r.change}` : `${r.change}`, tone: r.change > 0 ? "primary" : r.change < 0 ? "danger" : "neutral" },
    ])
  );

  return (
    <div>
      <ReportHeader sub="Budgeted headcount over time, by designation and center" onDownload={doExport} />
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: -14, marginBottom: 16, fontStyle: "italic" }}>
        Demo data — Supabase only keeps the current budget snapshot (see Shift Budget), not month-over-month history.
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field2 label="From Month">
            <select style={{ ...selectStyle, width: 170 }} value={fromMonth} onChange={e => setFromMonth(e.target.value)}>
              {BUDGET_PERIODS.map(p => <option key={p} value={p}>{shortPeriodLabel(p)}</option>)}
            </select>
          </Field2>
          <Field2 label="To Month">
            <select style={{ ...selectStyle, width: 170 }} value={toMonth} onChange={e => setToMonth(e.target.value)}>
              {BUDGET_PERIODS.map(p => <option key={p} value={p}>{shortPeriodLabel(p)}</option>)}
            </select>
          </Field2>
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: 200 }} value={designationFilter} onChange={e => setDesignationFilter(e.target.value)}>
              <option>All</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
        {fromIdx > toIdx && (
          <div style={{ marginTop: 10, fontFamily: bodyFont, fontSize: 12, color: C.danger }}>"From Month" is after "To Month" — pick a valid range.</div>
        )}
      </Card>

      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see the budget report.</div>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <Kpi label="Total Budget" value={totalCurrent} tone="primary" sub={rangePeriods.length ? shortPeriodLabel(toMonth) : undefined} />
            {rangePeriods.length > 1 ? (
              <Kpi label="Change (Range)" value={totalChange > 0 ? `+${totalChange}` : `${totalChange}`} tone={totalChange > 0 ? "primary" : totalChange < 0 ? "danger" : "accent"} sub={`${shortPeriodLabel(fromMonth)} → ${shortPeriodLabel(toMonth)}`} />
            ) : (
              <Kpi label="Change (Range)" value="—" tone="neutral" sub="Pick more than one month" />
            )}
            <Kpi label="Designations Increased" value={increased} tone="primary" />
            <Kpi label="Designations Decreased" value={decreased} tone="danger" />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginBottom: 20, marginTop: -6 }}>
            <b>Change</b> = budget in the "To Month" minus budget in the "From Month" — for each Site+Designation row, and for the totals above.
            "Designations Increased/Decreased" counts how many of those rows moved up or down over the selected range (0 change doesn't count either way).
          </div>

          {rangePeriods.length > 1 && (
            <Card style={{ marginBottom: 20 }}>
              <SectionLabel>Budget Trend{selectedSite !== "All" ? ` — ${selectedSite}` : ""}{designationFilter !== "All" ? ` — ${designationFilter}` : ""}</SectionLabel>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} />
                  <YAxis allowDecimals={false} tick={{ fontFamily: bodyFont, fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="budget" name="Total Budget" stroke={C.primary} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card>
            <SectionLabel>Budget — Designation & Center wise{selectedSite !== "All" ? ` — ${selectedSite}` : ""}</SectionLabel>
            <div style={{ overflowX: "auto" }}>
              <Table
                columns={[
                  ...(selectedSite === "All" ? ["Site"] : []),
                  "Designation", ...rangePeriods.map(shortPeriodLabel), "Change",
                ]}
                rows={matrixRows.map(r => [
                  ...(selectedSite === "All" ? [r.site] : []),
                  r.designation,
                  ...rangePeriods.map(p => r.byPeriod[p]),
                  r.change === null ? (
                    <span key={r.site + r.designation} style={{ color: C.inkSoft, fontFamily: bodyFont, fontSize: 12.5 }}>—</span>
                  ) : (
                    <Stamp
                      key={r.site + r.designation}
                      text={r.change > 0 ? `+${r.change}` : `${r.change}`}
                      tone={r.change > 0 ? "primary" : r.change < 0 ? "danger" : "neutral"}
                    />
                  ),
                ])}
              />
            </div>
            {matrixRows.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No budget records match this filter.</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}


export default BudgetReportPage;
