import { useState, useEffect } from "react";
import { C, bodyFont, Stamp, Card, SectionLabel, Table, selectStyle, inputStyle, PrimaryButton, Field2, PriorityTag, supabaseClient } from "../common";

let lastTicketSeq = 300;
function nextTicketId() { lastTicketSeq += 1; return `MT-${lastTicketSeq}`; }

function useRealSupervisors() {
  const [state, setState] = useState({ loading: true, supervisors: [] });
  useEffect(() => {
    let cancelled = false;
    supabaseClient.from("employees").select("id, name, role, designations(name)").eq("active", true)
      .then(({ data, error }) => {
        if (cancelled) return;
        const supervisors = (data || [])
          .filter(e => e.role && String(e.role).toLowerCase().includes("supervisor"))
          .map(e => ({ id: e.id, name: e.name, designation: e.designations?.name || e.role }));
        setState({ loading: false, supervisors: error ? [] : supervisors });
      });
    return () => { cancelled = true; };
  }, []);
  return state;
}

function RaiseTicketPage() {
  const { loading, supervisors } = useRealSupervisors();
  const [supervisorId, setSupervisorId] = useState(null);
  useEffect(() => { if (supervisors.length > 0 && supervisorId == null) setSupervisorId(supervisors[0].id); }, [supervisors, supervisorId]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("P2");
  // Tickets are session-only for now — there's no real ticketing table in
  // Supabase yet, so these won't show up in the mobile app or persist on refresh.
  const [tickets, setTickets] = useState([]);

  const canSubmit = subject && description && supervisorId;
  const submit = () => {
    const sup = supervisors.find(s => s.id === supervisorId);
    setTickets([{ id: nextTicketId(), supervisor: sup?.name || "—", subject, description, priority, date: new Date().toISOString().slice(0, 10), status: "Open" }, ...tickets]);
    setSubject(""); setDescription("");
  };

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Card style={{ width: 420, flexShrink: 0 }}>
        <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>Tickets aren't stored in Supabase yet</span>}>
          Raise a Ticket
        </SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field2 label="Send To (Supervisor)">
            {loading ? (
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft }}>Loading supervisors…</div>
            ) : supervisors.length === 0 ? (
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft }}>No employees with a "supervisor" role found yet.</div>
            ) : (
              <select style={{ ...selectStyle, width: "100%" }} value={supervisorId ?? ""} onChange={e => setSupervisorId(Number(e.target.value))}>
                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name} — {s.designation}</option>)}
              </select>
            )}
          </Field2>
          <Field2 label="Subject"><input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief subject line" /></Field2>
          <Field2 label="Description"><textarea style={{ ...inputStyle, minHeight: 90 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what needs attention" /></Field2>
          <Field2 label="Priority">
            <div style={{ display: "flex", gap: 8 }}>
              {["P1", "P2", "P3"].map(p => (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: "9px 6px", borderRadius: 8, fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5,
                  border: `1.5px solid ${priority === p ? C.primary : C.border}`,
                  background: priority === p ? C.primaryTint : C.paper, cursor: "pointer",
                }}>{p}</button>
              ))}
            </div>
          </Field2>
          <PrimaryButton full disabled={!canSubmit} onClick={submit}>Send Ticket</PrimaryButton>
        </div>
      </Card>
      <Card style={{ flex: 1 }}>
        <SectionLabel>Tickets Raised</SectionLabel>
        {tickets.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No tickets raised yet.</div>
        ) : (
          <Table
            columns={["Ticket", "To", "Subject", "Priority", "Date", "Status"]}
            rows={tickets.map(t => [t.id, t.supervisor, t.subject, <PriorityTag key={t.id} p={t.priority} />, t.date, <Stamp key={"s" + t.id} text={t.status} tone="accent" />])}
          />
        )}
      </Card>
    </div>
  );
}


export default RaiseTicketPage;
