import { useState } from "react";
import { C, bodyFont, escalationsSeed, Stamp, Card, SectionLabel, Table, PriorityTag } from "../common";

function EscalationsPage({ selectedSite }) {
  const [sent, setSent] = useState({});
  const visible = selectedSite === "All" ? escalationsSeed : escalationsSeed.filter(e => e.site === selectedSite);
  return (
    <Card>
      <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>Demo data — no escalations table in Supabase yet</span>}>
        {selectedSite === "All" ? "Open Escalations" : `Open Escalations — ${selectedSite}`}
      </SectionLabel>
      <Table
        columns={["Type", "Ref", "Site", "Supervisor", "Details", "Priority", "Days Open", ""]}
        rows={visible.map(e => [
          e.type, e.ref, e.site, e.supervisor, e.details, <PriorityTag key={e.id} p={e.priority} />,
          <Stamp key={"d" + e.id} text={`${e.daysOpen}d`} tone="danger" />,
          sent[e.id] ? <Stamp key={"s" + e.id} text="Reminder Sent" tone="success" /> : (
            <button key={"b" + e.id} onClick={() => setSent({ ...sent, [e.id]: true })} style={{
              background: C.accent, border: "none", borderRadius: 7, padding: "6px 12px",
              fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer",
            }}>Send Reminder</button>
          ),
        ])}
      />
      {visible.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No escalations here.</div>}
    </Card>
  );
}

/* ============================================================
   ADVANCE APPROVAL (L2)
   ============================================================ */

export default EscalationsPage;
