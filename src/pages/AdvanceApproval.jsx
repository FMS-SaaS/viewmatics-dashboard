import { useState } from "react";
import { C, bodyFont, ORG_DIRECTORY, advanceOverallStatus, advanceRequestsSeed, Stamp, Card, SectionLabel, Table, PrimaryButton } from "../common";

function AdvanceApprovalPage({ selectedSite }) {
  const [advances, setAdvances] = useState(advanceRequestsSeed);
  const [tab, setTab] = useState("pending");
  const act = (id, decision) => setAdvances(prev => prev.map(a => a.id === id ? { ...a, l2Status: decision } : a));
  const siteOf = (code) => ORG_DIRECTORY.find(e => e.code === code)?.site;
  const scoped = selectedSite === "All" ? advances : advances.filter(a => siteOf(a.code) === selectedSite);
  const pending = scoped.filter(a => a.l1Status === "approved" && a.l2Status === "pending");
  const decided = scoped.filter(a => a.l2Status !== "pending");

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["pending", "Pending"], ["history", "History"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "8px 16px", borderRadius: 8, fontFamily: bodyFont, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${tab === k ? C.primary : C.border}`, background: tab === k ? C.primaryTint : C.paper, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>
      <Card>
        {tab === "pending" ? (
          <>
            <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>Demo data — no advance-request table in Supabase yet</span>}>
              Awaiting Your Sign-off (already approved by Supervisor)
            </SectionLabel>
            <Table
              columns={["Employee", "Code", "Designation", "Days", "Amount", "Date", ""]}
              rows={pending.map(a => [
                a.name, a.code, a.designation, a.days, a.amount, a.date,
                <div key={a.id} style={{ display: "flex", gap: 8 }}>
                  <PrimaryButton onClick={() => act(a.id, "approved")}>Approve</PrimaryButton>
                  <PrimaryButton tone="danger" onClick={() => act(a.id, "rejected")}>Reject</PrimaryButton>
                </div>,
              ])}
            />
            {pending.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>Nothing awaiting approval.</div>}
          </>
        ) : (
          <>
            <SectionLabel>Decided</SectionLabel>
            <Table
              columns={["Employee", "Code", "Days", "Amount", "Date", "Status"]}
              rows={decided.map(a => [a.name, a.code, a.days, a.amount, a.date, <Stamp key={a.id} text={advanceOverallStatus(a)} tone={a.l2Status === "approved" ? "success" : "danger"} />])}
            />
          </>
        )}
      </Card>
    </div>
  );
}

/* ============================================================
   EXPENSE APPROVAL
   ============================================================ */

export default AdvanceApprovalPage;
