import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, bodyFont, monthlyReportData, Card, SectionLabel, Kpi, selectStyle, Field2, ReportHeader } from "../../common";

function MonthlyReport() {
  const [monthIdx, setMonthIdx] = useState(monthlyReportData.length - 1);
  const m = monthlyReportData[monthIdx];

  return (
    <div>
      <ReportHeader sub="Month-over-month org performance and cost summary" onDownload={() => {}} />
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: -14, marginBottom: 16, fontStyle: "italic" }}>
        Demo data — task completion, escalations, and month-over-month cost history aren't tracked in Supabase yet.
      </div>
      <Card style={{ marginBottom: 20 }}>
        <Field2 label="Select Month">
          <select value={monthIdx} onChange={e => setMonthIdx(Number(e.target.value))} style={selectStyle}>
            {monthlyReportData.map((row, i) => <option key={row.month} value={i}>{row.month}</option>)}
          </select>
        </Field2>
      </Card>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Kpi label="Avg Attendance" value={`${m.avgAttendance}%`} tone="success" />
        <Kpi label="Total Cost" value={`₹${(m.totalCost / 100000).toFixed(1)}L`} tone="primary" />
        <Kpi label="Avg Task Completion" value={`${m.taskCompletion}%`} tone="accent" />
        <Kpi label="Escalations Resolved" value={m.escalationsResolved} tone="primary" />
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Card style={{ flex: 1 }}>
          <SectionLabel>Attendance & Task Completion Trend</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyReportData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontFamily: bodyFont, fontSize: 11 }} />
              <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgAttendance" name="Attendance %" stroke={C.success} strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="taskCompletion" name="Task Completion %" stroke={C.accentDeep} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ flex: 1 }}>
          <SectionLabel>Cost Trend</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyReportData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontFamily: bodyFont, fontSize: 11 }} />
              <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="totalCost" fill={C.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   ATTRITION REPORT
   ============================================================ */
/* ============================================================
   BUDGET REPORT
   ============================================================ */

export default MonthlyReport;
  