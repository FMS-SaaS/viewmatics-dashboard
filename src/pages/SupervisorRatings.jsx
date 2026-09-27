import { useState, useEffect } from "react";
import { C, displayFont, bodyFont, RATING_DURATIONS, Stamp, Card, SectionLabel, Table, selectStyle, inputStyle, PrimaryButton, Field2, Modal, supabaseClient } from "../common";

// There's no real "supervisor ratings" table in Supabase yet, so ratings you
// submit here only live in this browser tab for now (they reset on refresh).
// The supervisor list itself, though, is real — pulled from `employees` where
// role mentions "supervisor" — so you're always rating an actual person.
function useRealSupervisors() {
  const [state, setState] = useState({ loading: true, error: "", supervisors: [] });
  useEffect(() => {
    let cancelled = false;
    supabaseClient.from("employees").select("id, name, role, site_id, sites(name), designations(name)").eq("active", true)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setState({ loading: false, error: error.message, supervisors: [] }); return; }
        const supervisors = (data || [])
          .filter(e => e.role && String(e.role).toLowerCase().includes("supervisor"))
          .map(e => ({
            id: e.id,
            name: e.name,
            designation: e.designations?.name || e.role,
            site: e.sites?.name || "—",
          }));
        setState({ loading: false, error: "", supervisors });
      });
    return () => { cancelled = true; };
  }, []);
  return state;
}

function SupervisorRatingsPage({ selectedSite }) {
  const [tab, setTab] = useState("rating");
  const { loading, error, supervisors } = useRealSupervisors();
  // Session-only ratings map: { [supervisorId]: { rating, duration, remark } } — not
  // persisted to Supabase since there's no ratings table there yet.
  const [ratings, setRatings] = useState({});

  const designations = [...new Set(supervisors.map(s => s.designation))];
  const [designation, setDesignation] = useState("");
  useEffect(() => { if (designations.length > 0 && !designation) setDesignation(designations[0]); }, [designations, designation]);

  const namesForDesignation = supervisors.filter(s => s.designation === designation);
  const [supervisorId, setSupervisorId] = useState(null);
  useEffect(() => { if (namesForDesignation.length > 0 && supervisorId == null) setSupervisorId(namesForDesignation[0].id); }, [namesForDesignation, supervisorId]);

  const [rating, setRating] = useState(4);
  const [duration, setDuration] = useState("Monthly");
  const [remark, setRemark] = useState("");
  const [justRated, setJustRated] = useState(false);
  const [openId, setOpenId] = useState(null);

  const visibleScorecard = selectedSite === "All" ? supervisors : supervisors.filter(s => s.site === selectedSite);
  const openSup = supervisors.find(s => s.id === openId);
  const selectedName = supervisors.find(s => s.id === supervisorId)?.name || "";

  const submit = () => {
    setRatings(prev => ({ ...prev, [supervisorId]: { rating: Number(rating), duration, remark } }));
    setJustRated(true);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["rating", "Give Rating"], ["scorecard", "Scorecard"]].map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); setJustRated(false); }} style={{
            padding: "8px 16px", borderRadius: 8, fontFamily: bodyFont, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${tab === k ? C.primary : C.border}`, background: tab === k ? C.primaryTint : C.paper, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <Card><div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft, padding: "16px 4px" }}>Loading supervisors…</div></Card>
      ) : error ? (
        <Card><div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.danger, padding: "16px 4px" }}>Couldn't load supervisors: {error}</div></Card>
      ) : supervisors.length === 0 ? (
        <Card><div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft, padding: "16px 4px" }}>No employees with a "supervisor" role found yet.</div></Card>
      ) : (
        <>
          {tab === "rating" && (
            <Card style={{ maxWidth: 460 }}>
              {justRated ? (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <Stamp text="Rating Submitted" tone="success" />
                  <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginTop: 12, marginBottom: 16 }}>
                    {selectedName}'s {duration} rating is now {rating}/5. This is saved in this browser tab only — there's
                    no real ratings table in Supabase yet, so it won't show up on the app or another device.
                  </div>
                  <PrimaryButton full onClick={() => setJustRated(false)}>Rate Another</PrimaryButton>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Field2 label="Designation">
                    <select style={{ ...selectStyle, width: "100%" }} value={designation} onChange={e => {
                      setDesignation(e.target.value);
                      const first = supervisors.find(s => s.designation === e.target.value);
                      setSupervisorId(first?.id ?? null);
                    }}>
                      {designations.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </Field2>
                  <Field2 label="Select Name">
                    <select style={{ ...selectStyle, width: "100%" }} value={supervisorId ?? ""} onChange={e => setSupervisorId(Number(e.target.value))}>
                      {namesForDesignation.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field2>
                  <Field2 label="Rating (1–5)">
                    <div style={{ display: "flex", gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setRating(n)} style={{
                          flex: 1, padding: "9px 6px", borderRadius: 8, fontFamily: bodyFont, fontWeight: 700, fontSize: 13,
                          border: `1.5px solid ${rating === n ? C.accentDeep : C.border}`,
                          background: rating === n ? C.accentTint : C.paper, color: rating === n ? C.accentDeep : C.ink, cursor: "pointer",
                        }}>{n}</button>
                      ))}
                    </div>
                  </Field2>
                  <Field2 label="Duration">
                    <select style={{ ...selectStyle, width: "100%" }} value={duration} onChange={e => setDuration(e.target.value)}>
                      {RATING_DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </Field2>
                  <Field2 label="Remark"><textarea style={{ ...inputStyle, minHeight: 64 }} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Notes on this rating" /></Field2>
                  <PrimaryButton full disabled={!supervisorId} onClick={submit}>Submit</PrimaryButton>
                </div>
              )}
            </Card>
          )}

          {tab === "scorecard" && (
            <Card>
              <SectionLabel right={<span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>Attendance/Task/Resolution columns are demo data</span>}>
                {selectedSite === "All" ? "All Supervisors" : `Supervisors at ${selectedSite}`}
              </SectionLabel>
              <Table
                columns={["Supervisor", "Site", "Attendance", "Task Completion", "Avg Resolution", "Rating", ""]}
                rows={visibleScorecard.map(s => {
                  const r = ratings[s.id];
                  return [
                    s.name, s.site, "—", "—", "—",
                    r ? <span key={s.id} style={{ fontFamily: displayFont, fontWeight: 700, color: C.accentDeep }}>{r.rating}</span> : <span key={s.id} style={{ color: C.inkSoft, fontFamily: bodyFont, fontSize: 12 }}>Not yet rated</span>,
                    <button key={"v" + s.id} onClick={() => setOpenId(s.id)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
                  ];
                })}
              />
            </Card>
          )}
        </>
      )}

      {openSup && (
        <Modal title={openSup.name} onClose={() => setOpenId(null)}>
          {[
            ["Designation", openSup.designation], ["Site", openSup.site],
            ["Rating", ratings[openSup.id] ? `${ratings[openSup.id].rating} / 5 (${ratings[openSup.id].duration})` : "Not yet rated"],
            ["Remark", ratings[openSup.id]?.remark || "—"],
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

export default SupervisorRatingsPage;