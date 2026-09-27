import { useState, useEffect } from "react";
import { C, bodyFont, Stamp, Card, SectionLabel, Table, Modal, supabaseClient } from "../common";

// Real, org-wide site data — sites, headcount budget, and today's attendance
// all come from Supabase now. Task Completion % and Open Grievances still
// have no real data source anywhere in the system yet, so those two columns
// are clearly marked "Demo" rather than silently shown as if they were real.
function useRealSiteRows() {
  const [state, setState] = useState({ loading: true, error: "", rows: [], supervisorsBySite: {} });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [sitesRes, empRes, budgetRes, attRes] = await Promise.all([
        supabaseClient.from("sites").select("id, name").order("name"),
        supabaseClient.from("employees").select("id, name, site_id, role").eq("active", true),
        supabaseClient.from("site_designation_budgets").select("site_id, morning_count, evening_count, night_count"),
        supabaseClient.from("attendance").select("employee_id, punch_in").eq("date", today),
      ]);
      if (cancelled) return;

      if (sitesRes.error) {
        setState({ loading: false, error: sitesRes.error.message, rows: [], supervisorsBySite: {} });
        return;
      }

      const sites = sitesRes.data || [];
      const employees = empRes.data || [];
      const budgets = budgetRes.data || [];
      const attendance = attRes.data || [];
      const presentEmpIds = new Set(attendance.filter(r => r.punch_in != null).map(r => r.employee_id));

      const supervisorsBySite = {};
      const presentBySite = {};
      for (const e of employees) {
        if (!e.site_id) continue;
        if (presentEmpIds.has(e.id)) presentBySite[e.site_id] = (presentBySite[e.site_id] || 0) + 1;
        if (e.role && String(e.role).toLowerCase().includes("supervisor")) {
          (supervisorsBySite[e.site_id] = supervisorsBySite[e.site_id] || []).push(e.name);
        }
      }

      const budgetBySite = {};
      for (const b of budgets) {
        budgetBySite[b.site_id] = (budgetBySite[b.site_id] || 0)
          + (Number(b.morning_count) || 0) + (Number(b.evening_count) || 0) + (Number(b.night_count) || 0);
      }

      const rows = sites.map(s => ({
        id: s.id,
        name: s.name,
        budget: budgetBySite[s.id] || 0,
        present: presentBySite[s.id] || 0,
      }));

      setState({ loading: false, error: "", rows, supervisorsBySite });
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

function SitesOverviewPage({ selectedSite }) {
  const [openSiteId, setOpenSiteId] = useState(null);
  const { loading, error, rows, supervisorsBySite } = useRealSiteRows();

  const visibleRows = selectedSite === "All" ? rows : rows.filter(r => r.name === selectedSite);
  const openRow = rows.find(r => r.id === openSiteId);

  return (
    <div>
      <Card>
        <SectionLabel>{selectedSite === "All" ? "All Sites" : selectedSite}</SectionLabel>
        {loading ? (
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft, padding: "16px 4px" }}>Loading sites…</div>
        ) : error ? (
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.danger, padding: "16px 4px" }}>Couldn't load sites: {error}</div>
        ) : rows.length === 0 ? (
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft, padding: "16px 4px" }}>
            No sites found yet — add one from "Add Location".
          </div>
        ) : (
          <Table
            columns={["Site", "Supervisor(s)", "Present / Budget", "Task Completion (Demo)", "Open Grievances (Demo)", ""]}
            rows={visibleRows.map(r => [
              r.name,
              (supervisorsBySite[r.id] || []).join(", ") || "Not yet assigned",
              `${r.present}/${r.budget}`,
              "—",
              <Stamp key={"g" + r.id} text="—" tone="neutral" />,
              <button key={"btn" + r.id} onClick={() => setOpenSiteId(r.id)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
            ])}
          />
        )}
      </Card>

      {openRow && (
        <Modal title={openRow.name} onClose={() => setOpenSiteId(null)}>
          {[
            ["Supervisors", (supervisorsBySite[openRow.id] || []).join(", ") || "Not yet assigned"],
            ["Budgeted Headcount", openRow.budget],
            ["Present Today", openRow.present],
            ["Task Completion", "No data source yet"],
            ["Open Grievances", "No data source yet"],
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

export default SitesOverviewPage;