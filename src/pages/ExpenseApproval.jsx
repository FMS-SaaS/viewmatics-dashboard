import { useState } from "react";
import { AlertTriangle, Search, CheckCircle2 } from "lucide-react";
import { C, bodyFont, ORG_DIRECTORY, EXPENSE_TYPES, expensesSeed, Stamp, Card, Table, selectStyle, inputStyle, PrimaryButton, Field2, Modal } from "../common";

function ExpenseApprovalPage({ selectedSite }) {
  const [expenses, setExpenses] = useState(expensesSeed);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [checked, setChecked] = useState({});
  const [openId, setOpenId] = useState(null);
  const siteOf = (code) => ORG_DIRECTORY.find(e => e.code === code)?.site;

  const filtered = expenses.filter(e => {
    const q = query.toLowerCase();
    const okQ = !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q);
    const okType = typeFilter === "All" || e.type === typeFilter;
    const okStatus = statusFilter === "All" || e.status === statusFilter;
    const okSite = selectedSite === "All" || siteOf(e.code) === selectedSite;
    return okQ && okType && okStatus && okSite;
  });
  const selectedIds = Object.keys(checked).filter(id => checked[id]);
  const [blockedMsg, setBlockedMsg] = useState(null);
  const bulk = (status) => {
    if (status === "Rejected") {
      const alreadyApproved = expenses.filter(e => selectedIds.includes(e.id) && e.status === "Approved");
      if (alreadyApproved.length > 0) {
        setBlockedMsg(`${alreadyApproved.length} of the selected expense(s) are already approved and can't be rejected. The rest will still be processed.`);
      }
      setExpenses(prev => prev.map(e => selectedIds.includes(e.id) && e.status !== "Approved" ? { ...e, status } : e));
      setChecked({});
      return;
    }
    setExpenses(prev => prev.map(e => selectedIds.includes(e.id) ? { ...e, status } : e));
    setChecked({});
  };
  const single = (id, status) => {
    const exp = expenses.find(e => e.id === id);
    if (status === "Rejected" && exp && exp.status === "Approved") {
      setBlockedMsg("Already approved, can't be rejected.");
      return;
    }
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    setOpenId(null);
  };
  const openExpense = expenses.find(e => e.id === openId);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}><Field2 label="Search by employee name / code"><input style={inputStyle} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Priya or EMP-2200" /></Field2></div>
          <div style={{ width: 220 }}>
            <Field2 label="Expense Type">
              <select style={{ ...selectStyle, width: "100%" }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All</option>{EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field2>
          </div>
          <div style={{ width: 160 }}>
            <Field2 label="Status">
              <select style={{ ...selectStyle, width: "100%" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </Field2>
          </div>
        </div>
      </Card>

      {selectedIds.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <PrimaryButton onClick={() => bulk("Approved")}>Approve Selected ({selectedIds.length})</PrimaryButton>
          <PrimaryButton tone="danger" onClick={() => bulk("Rejected")}>Reject Selected</PrimaryButton>
        </div>
      )}

      <Card>
        <div style={{ textAlign: "right", marginBottom: 8, fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>
          Demo data — no expense-claim table in Supabase yet
        </div>
        <Table
          columns={["", "Employee", "Code", "Type", "Date", "Amount", "Status"]}
          rows={filtered.map(e => [
            <button key={"c" + e.id} onClick={() => setChecked({ ...checked, [e.id]: !checked[e.id] })} style={{ background: "none", border: "none", cursor: "pointer" }}>
              {checked[e.id] ? <CheckCircle2 size={18} color={C.primary} /> : <div style={{ width: 18, height: 18, border: `1.5px solid ${C.border}`, borderRadius: 5 }} />}
            </button>,
            <button key={"n" + e.id} onClick={() => setOpenId(e.id)} style={{ background: "none", border: "none", color: C.primary, fontWeight: 600, fontFamily: bodyFont, fontSize: 13, cursor: "pointer" }}>{e.name}</button>,
            e.code, e.type, e.date, `₹${e.amount.toLocaleString("en-IN")}`,
            <Stamp key={"s" + e.id} text={e.status} tone={e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "accent"} />,
          ])}
        />
      </Card>

      {openExpense && (
        <Modal title={openExpense.id} onClose={() => setOpenId(null)}>
          {[
            ["Employee", `${openExpense.name} (${openExpense.code})`], ["Amount", `₹${openExpense.amount.toLocaleString("en-IN")}`],
            ["Date", openExpense.date], ["Expense Type", openExpense.type], ["Invoice", openExpense.invoice], ["Remark", openExpense.remark],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontFamily: bodyFont, fontSize: 13.5 }}>
              <span style={{ color: C.inkSoft }}>{k}</span><b style={{ textAlign: "right", maxWidth: "60%" }}>{v}</b>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontFamily: bodyFont, fontSize: 13.5 }}>
            <span style={{ color: C.inkSoft }}>Status</span>
            <Stamp text={openExpense.status} tone={openExpense.status === "Approved" ? "success" : openExpense.status === "Rejected" ? "danger" : "accent"} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <PrimaryButton onClick={() => single(openExpense.id, "Approved")}>Accepted</PrimaryButton>
            <PrimaryButton tone="danger" onClick={() => single(openExpense.id, "Rejected")}>Rejected</PrimaryButton>
          </div>
        </Modal>
      )}
      {blockedMsg && (
        <Modal title="Can't Reject" onClose={() => setBlockedMsg(null)} width={360}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "8px 4px 4px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.dangerTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <AlertTriangle size={22} color={C.danger} />
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.ink, marginBottom: 16 }}>{blockedMsg}</div>
            <PrimaryButton full onClick={() => setBlockedMsg(null)}>OK</PrimaryButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   ADD LOCATION
   ============================================================ */

export default ExpenseApprovalPage;
