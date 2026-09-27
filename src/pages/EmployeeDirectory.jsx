import { useState, useEffect } from "react";
import { UserRound, Search, FileText } from "lucide-react";
import { C, bodyFont, monoFont, ORG_DIRECTORY, calcTenure, Card, SectionLabel, Table, selectStyle, inputStyle, Field2, Modal, supabaseClient } from "../common";

function EmployeeDirectoryPage({ selectedSite }) {
  const [query, setQuery] = useState("");
  const [openCode, setOpenCode] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [sitesList, setSitesList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [lookupError, setLookupError] = useState("");

  // Add Employee form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newSiteId, setNewSiteId] = useState("");
  const [newDesignationId, setNewDesignationId] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newContact, setNewContact] = useState("");
  const [newDoj, setNewDoj] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadEmployees = () => {
    setLoading(true);
    setFetchError("");
    return supabaseClient
      .from("employees")
      .select("*, sites(name), designations(name)")
      .then(({ data, error }) => {
        if (error) {
          setFetchError(error.message);
          setLoading(false);
          return;
        }
        // Adapt Supabase's real field names/joins to the shape the rest of
        // this page already expects (matches the old ORG_DIRECTORY shape).
        const mapped = (data || []).map(e => ({
          name: e.name,
          code: e.employee_code,
          designation: e.designations?.name || "—",
          site: e.sites?.name || "—",
          doj: e.date_of_joining,
          contact: e.contact || "—",
          aadhaar: e.aadhaar || "Not on file",
          pan: e.pan || "Not on file",
        }));
        setEmployees(mapped);
        setLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    loadEmployees();
    // Sites/Designations power the Add Employee dropdowns — need the real
    // IDs from the database, not just names, since that's what the
    // employees table actually stores as foreign keys.
    supabaseClient.from("sites").select("*").then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setLookupError(prev => prev + (prev ? " | " : "") + "Sites: " + error.message); return; }
      setSitesList(data || []);
    });
    supabaseClient.from("designations").select("*").then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setLookupError(prev => prev + (prev ? " | " : "") + "Designations: " + error.message); return; }
      setDesignationsList(data || []);
    });
    return () => { cancelled = true; };
  }, []);

  const resetAddForm = () => {
    setNewCode(""); setNewName(""); setNewSiteId(""); setNewDesignationId("");
    setNewRole("user"); setNewContact(""); setNewDoj(""); setSaveError("");
  };

  const submitNewEmployee = async () => {
    if (!newCode.trim() || !newName.trim() || !newSiteId || !newDesignationId) {
      setSaveError("Employee Code, Name, Site, and Designation are required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    const { error } = await supabaseClient.from("employees").insert({
      employee_code: newCode.trim(),
      name: newName.trim(),
      site_id: newSiteId,
      designation_id: newDesignationId,
      role: newRole,
      contact: newContact.trim() || null,
      date_of_joining: newDoj || null,
      active: true,
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    resetAddForm();
    setShowAddForm(false);
    loadEmployees(); // refresh the list so the new employee shows up immediately
  };

  const filtered = employees.filter(e => {
    const q = query.toLowerCase();
    const okQ = !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q);
    const okSite = selectedSite === "All" || e.site === selectedSite;
    return okQ && okSite;
  });
  const openEmp = employees.find(e => e.code === openCode);

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field2 label="Search by name, code, or designation">
              <input style={inputStyle} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Ramesh, EMP-2291, Technician" />
            </Field2>
          </div>
          <button onClick={() => setShowAddForm(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "10px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><UserRound size={14} /> Add Employee</button>
        </div>
      </Card>

      {loading ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Loading employees from the database...</div>
        </Card>
      ) : fetchError ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.danger }}>Couldn't load employees: {fetchError}</div>
        </Card>
      ) : (
        <Card>
          <SectionLabel>{filtered.length} of {employees.length} Employees {selectedSite !== "All" && `— ${selectedSite}`}</SectionLabel>
          <Table
            columns={["Name", "Code", "Designation", "Site", "DOJ", "Tenure", "Contact", "Documents"]}
            rows={filtered.map(e => [
              e.name, e.code, e.designation, e.site,
              e.doj ? new Date(e.doj).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
              e.doj ? calcTenure(e.doj) : "—", e.contact,
              <button key={e.code} onClick={() => setOpenCode(e.code)} style={{
                display: "flex", alignItems: "center", gap: 5, background: C.primaryTint, border: "none", borderRadius: 7,
                padding: "5px 10px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer",
              }}><FileText size={13} /> View</button>,
            ])}
          />
          {filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No employees yet — this will fill in as people are added to the system.</div>
          )}
        </Card>
      )}

      {showAddForm && (
        <Modal title="Add Employee" onClose={() => { setShowAddForm(false); resetAddForm(); }} width={440}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lookupError && (
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, background: C.dangerTint, padding: "10px 12px", borderRadius: 8 }}>
                Couldn't load Site/Designation options: {lookupError}
              </div>
            )}
            {!lookupError && sitesList.length === 0 && (
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, background: C.accentTint, padding: "10px 12px", borderRadius: 8 }}>
                No sites found in the database yet — the dropdown will stay empty until some exist.
              </div>
            )}
            <Field2 label="Employee Code"><input style={inputStyle} value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. EMP-0002" /></Field2>
            <Field2 label="Name"><input style={inputStyle} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" /></Field2>
            <Field2 label="Site">
              <select style={selectStyle} value={newSiteId} onChange={e => setNewSiteId(e.target.value)}>
                <option value="">Select a site</option>
                {sitesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field2>
            <Field2 label="Designation">
              <select style={selectStyle} value={newDesignationId} onChange={e => setNewDesignationId(e.target.value)}>
                <option value="">Select a designation</option>
                {designationsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field2>
            <Field2 label="Role">
              <select style={selectStyle} value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="user">Worker</option>
                <option value="supervisor_admin">Supervisor Admin</option>
                <option value="master_admin">Master Admin</option>
              </select>
            </Field2>
            <Field2 label="Contact"><input style={inputStyle} value={newContact} onChange={e => setNewContact(e.target.value)} placeholder="+91 XXXXX XXXXX" /></Field2>
            <Field2 label="Date of Joining"><input type="date" style={inputStyle} value={newDoj} onChange={e => setNewDoj(e.target.value)} /></Field2>
            {saveError && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger }}>{saveError}</div>}
            <button onClick={submitNewEmployee} disabled={saving} style={{
              width: "100%", background: saving ? C.inkSoft : C.primary, border: "none", borderRadius: 9, padding: "12px 0",
              color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: saving ? "default" : "pointer", marginTop: 4,
            }}>{saving ? "Saving..." : "Save Employee"}</button>
          </div>
        </Modal>
      )}

      {openEmp && (
        <Modal title={`${openEmp.name} — Documents`} onClose={() => setOpenCode(null)} width={420}>
          {[
            { label: "Aadhaar Card", value: openEmp.aadhaar },
            { label: "PAN Card", value: openEmp.pan },
          ].map(doc => (
            <div key={doc.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div>
                <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5 }}>{doc.label}</div>
                <div style={{ fontFamily: monoFont, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{doc.value}</div>
              </div>
              <button style={{
                display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 8,
                padding: "8px 14px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, cursor: "pointer",
              }}>Download</button>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   COMPLIANCE
   ============================================================ */

export default EmployeeDirectoryPage;
