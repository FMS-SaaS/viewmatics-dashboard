import { useState, useEffect } from "react";
import { C, bodyFont, SITES, ORG_DIRECTORY, Stamp, Card, SectionLabel, Table, supabaseClient } from "../common";

function LiveAttendanceReal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    return supabaseClient
      .from("employees")
      .select("id, name, employee_code, sites(name), attendance(date, punch_in, punch_out, status)")
      .then(({ data, error }) => {
        if (error) { setFetchError(error.message); setLoading(false); return; }
        const mapped = (data || []).map(e => {
          const todayRecord = (e.attendance || []).find(a => a.date === today);
          return {
            id: e.id, name: e.name, code: e.employee_code, site: e.sites?.name || "—",
            punchIn: todayRecord?.punch_in || null,
            punchOut: todayRecord?.punch_out || null,
            status: todayRecord?.status || null,
          };
        });
        setRows(mapped);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadToday();
    // Real-time: whenever ANY attendance row changes (insert or update,
    // from anyone, on any device), refetch automatically — this is what
    // makes punching in on the App show up here without refreshing.
    const channel = supabaseClient
      .channel("attendance-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        loadToday();
        setLastUpdate(new Date());
      })
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, []);

  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
  const presentCount = rows.filter(r => r.punchIn && !r.punchOut).length;
  const doneCount = rows.filter(r => r.punchOut).length;

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel>Live Attendance (Real)</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 11, color: C.inkSoft }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.success }} />
          Live{lastUpdate ? ` · updated ${lastUpdate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </div>
      </div>
      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>Loading real attendance...</div>
      ) : fetchError ? (
        <div style={{ padding: 20, textAlign: "center", color: C.danger, fontFamily: bodyFont, fontSize: 13 }}>Couldn't load attendance: {fetchError}</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
            <div><b style={{ color: C.success }}>{presentCount}</b> <span style={{ color: C.inkSoft, fontSize: 12.5 }}>currently punched in</span></div>
            <div><b style={{ color: C.ink }}>{doneCount}</b> <span style={{ color: C.inkSoft, fontSize: 12.5 }}>completed today</span></div>
          </div>
          <Table
            columns={["Name", "Code", "Site", "Punch In", "Punch Out", "Status"]}
            rows={rows.map(r => [
              r.name, r.code, r.site, formatTime(r.punchIn), formatTime(r.punchOut),
              r.punchOut ? <Stamp key={r.id} text="Done" tone="neutral" /> :
              r.punchIn ? <Stamp key={r.id} text="Punched In" tone="success" /> :
              <Stamp key={r.id} text="Not yet" tone="accent" />,
            ])}
          />
          {rows.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 12.5 }}>No employees yet.</div>
          )}
        </>
      )}
    </Card>
  );
}

// Real, live org-wide numbers for the "All Sites" view — Budget/Present Headcount/
// Org Attendance/New Hired. Replaces the SITES/ORG_DIRECTORY mock for exactly this
// slice, since it's the one figure management actually looks at first. Per-site
// drill-down below (shift split, OT, cost accrual) stays on mock data for now —
// that needs shift assignment + cost-rate data that doesn't exist in Supabase yet.

export default LiveAttendanceReal;
