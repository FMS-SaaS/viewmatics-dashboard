import { useState, useEffect } from "react";
import { C, bodyFont, Card, Table, inputStyle, Field2, PriorityTag, Modal, exportToExcelColored, ReportHeader, supabaseClient } from "../../common";

// Real tasks from Supabase's `tasks` table — the same one the mobile app's
// "Assign Task" screen reads and writes.
function useRealTasks() {
  const [state, setState] = useState({ loading: true, error: "", tasks: [] });
  useEffect(() => {
    let cancelled = false;
    supabaseClient
      .from("tasks")
      .select("id, subject, priority, status, assigned_date, completed_date, sites(name), employees!assigned_to(name, employee_code, designations(name))")
      .order("assigned_date", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setState({ loading: false, error: error.message, tasks: [] }); return; }
        const tasks = (data || []).map(t => ({
          id: t.id,
          task: t.subject,
          priority: t.priority,
          status: t.status,
          assignedDateISO: t.assigned_date,
          assignedDate: t.assigned_date ? new Date(t.assigned_date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
          completedDate: t.completed_date ? new Date(t.completed_date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null,
          name: t.employees?.name || "—",
          code: t.employees?.employee_code || "—",
          designation: t.employees?.designations?.name || "—",
          site: t.sites?.name || "—",
        }));
        setState({ loading: false, error: "", tasks });
      });
    return () => { cancelled = true; };
  }, []);
  return state;
}

function TaskHistoryReportPage({ selectedSite }) {
  const [tab, setTab] = useState("open");
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [openId, setOpenId] = useState(null);

  const { loading, error, tasks } = useRealTasks();

  const scoped = tasks.filter(t => selectedSite === "All" || t.site === selectedSite);
  const openTasks = scoped.filter(t => t.status === "Open");
  const history = scoped.filter(t =>
    t.status === "Completed" && t.assignedDateISO >= fromDate && t.assignedDateISO <= toDate
  );
  const openTaskDetail = tasks.find(t => t.id === openId);

  const doExport = () => exportToExcelColored(
    "Task_History",
    ["ID", "Employee", "Code", "Designation", "Site", "Task", "Priority", "Assigned", "Completed", "Status"],
    history.map(t => [t.id, t.name, t.code, t.designation, t.site, t.task, t.priority, t.assignedDate, t.completedDate || "—",
      { text: t.status, tone: "success" }])
  );

  if (loading) return <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Loading tasks…</div></Card>;
  if (error) return <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.danger }}>Couldn't load tasks: {error}</div></Card>;

  return (
    <div>
      <ReportHeader sub="Open tasks awaiting action, and completed task history" onDownload={doExport} />
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["open", `Open Tasks (${openTasks.length})`], ["history", "Task History"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "8px 16px", borderRadius: 8, fontFamily: bodyFont, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${tab === k ? C.primary : C.border}`, background: tab === k ? C.primaryTint : C.paper, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {tab === "open" && (
        <Card>
          <Table
            columns={["ID", "Employee", "Code", "Site", "Task", "Priority", "Assigned", ""]}
            rows={openTasks.map(t => [
              t.id, t.name, t.code, t.site, t.task, <PriorityTag key={t.id} p={t.priority} />, t.assignedDate,
              <button key={"v" + t.id} onClick={() => setOpenId(t.id)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
            ])}
          />
          {openTasks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No open tasks.</div>}
        </Card>
      )}

      {tab === "history" && (
        <>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
              <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
            </div>
          </Card>
          <Card>
            <Table
              columns={["ID", "Employee", "Code", "Site", "Task", "Priority", "Assigned", "Completed"]}
              rows={history.map(t => [t.id, t.name, t.code, t.site, t.task, <PriorityTag key={t.id} p={t.priority} />, t.assignedDate, t.completedDate])}
            />
            {history.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No completed tasks in this range.</div>}
          </Card>
        </>
      )}

      {openTaskDetail && (
        <Modal title={String(openTaskDetail.id)} onClose={() => setOpenId(null)}>
          {[
            ["Task", openTaskDetail.task], ["Employee", `${openTaskDetail.name} (${openTaskDetail.code})`],
            ["Designation", openTaskDetail.designation], ["Site", openTaskDetail.site],
            ["Priority", openTaskDetail.priority], ["Assigned On", openTaskDetail.assignedDate],
            ["Status", openTaskDetail.status],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontFamily: bodyFont, fontSize: 13.5 }}>
              <span style={{ color: C.inkSoft }}>{k}</span><b>{v}</b>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

export default TaskHistoryReportPage;
