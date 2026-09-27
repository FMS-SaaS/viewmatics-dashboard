import { useState, useEffect } from "react";
import { C, bodyFont, SITES, DESIGNATIONS, shiftBudgetSeed, Card, SectionLabel, Table, selectStyle, inputStyle, PrimaryButton, Field2 } from "../common";

function ShiftBudgetPage({ selectedSite }) {
  const [shiftBudgets, setShiftBudgets] = useState(shiftBudgetSeed);
  const site = selectedSite === "All" ? SITES[0].name : selectedSite;
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [morning, setMorning] = useState(0);
  const [evening, setEvening] = useState(0);
  const [night, setNight] = useState(0);

  useEffect(() => {
    const existing = shiftBudgets.find(b => b.site === site && b.designation === designation);
    setMorning(existing?.morning ?? 0); setEvening(existing?.evening ?? 0); setNight(existing?.night ?? 0);
  }, [site, designation]);

  const save = () => {
    setShiftBudgets(prev => {
      const others = prev.filter(b => !(b.site === site && b.designation === designation));
      return [...others, { site, designation, morning: Number(morning) || 0, evening: Number(evening) || 0, night: Number(night) || 0 }];
    });
  };

  const visibleBudgets = selectedSite === "All" ? shiftBudgets : shiftBudgets.filter(b => b.site === selectedSite);

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Card style={{ width: 380 }}>
        <SectionLabel>Set Budget — {site}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {selectedSite === "All" && (
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, background: C.accentTint, padding: "8px 10px", borderRadius: 8 }}>
              Pick a specific site from the top bar to set its budget — showing {site} for now.
            </div>
          )}
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: "100%" }} value={designation} onChange={e => setDesignation(e.target.value)}>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><Field2 label="Morning"><input type="number" style={inputStyle} value={morning} onChange={e => setMorning(e.target.value)} /></Field2></div>
            <div style={{ flex: 1 }}><Field2 label="Evening"><input type="number" style={inputStyle} value={evening} onChange={e => setEvening(e.target.value)} /></Field2></div>
            <div style={{ flex: 1 }}><Field2 label="Night"><input type="number" style={inputStyle} value={night} onChange={e => setNight(e.target.value)} /></Field2></div>
          </div>
          <PrimaryButton full onClick={save}>Save Budget</PrimaryButton>
        </div>
      </Card>
      <Card style={{ flex: 1 }}>
        <SectionLabel>Budget by Site</SectionLabel>
        <Table
          columns={["Site", "Designation", "Morning", "Evening", "Night", "Total"]}
          rows={visibleBudgets.map((b, i) => [b.site, b.designation, b.morning, b.evening, b.night, b.morning + b.evening + b.night])}
        />
      </Card>
    </div>
  );
}

/* ============================================================
   REPORTS
   ============================================================ */

export default ShiftBudgetPage;
