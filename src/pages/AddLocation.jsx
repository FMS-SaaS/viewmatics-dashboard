import { useState } from "react";
import { MapPin } from "lucide-react";
import { C, bodyFont, Stamp, Card, inputStyle, PrimaryButton, Field2, supabaseClient } from "../common";

function AddLocationPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(150);
  const [justAdded, setJustAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6));
    });
  };
  const canSubmit = name.trim() && lat.trim() && lng.trim() && radius;

  const submit = async () => {
    setSaving(true);
    setError("");
    // Matches the mobile app's "Add Location" schema exactly — same `sites` table,
    // same columns — so a site added here shows up in the mobile app immediately
    // and vice versa.
    const { error: insertError } = await supabaseClient.from("sites").insert({
      name: name.trim(),
      address: address.trim() || null,
      state: state.trim() || null,
      latitude: Number(lat),
      longitude: Number(lng),
      geofence_radius_meters: Number(radius),
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setJustAdded(true);
  };

  const resetForm = () => {
    setName(""); setAddress(""); setState(""); setLat(""); setLng(""); setRadius(150); setJustAdded(false);
  };

  return (
    <Card style={{ maxWidth: 480 }}>
      {justAdded ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Stamp text="Location Added" tone="success" />
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginTop: 12, marginBottom: 16 }}>
            {name} has been added to your Supabase `sites` table — it'll show up in both the dashboard's site
            picker and the mobile app right away.
          </div>
          <PrimaryButton full onClick={resetForm}>Add Another</PrimaryButton>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field2 label="Site Name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cyber Hub — Tower D" /></Field2>
          <Field2 label="Address"><textarea style={{ ...inputStyle, minHeight: 60 }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full site address" /></Field2>
          <Field2 label="State"><input style={inputStyle} value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Haryana" /></Field2>
          <Field2 label="Coordinates (for geofencing)">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude" />
              <input style={inputStyle} value={lng} onChange={e => setLng(e.target.value)} placeholder="Longitude" />
            </div>
            <button onClick={useCurrentLocation} style={{ width: "100%", background: C.primaryTint, border: "none", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, color: C.primary, cursor: "pointer" }}>
              <MapPin size={14} /> Use Current Location
            </button>
          </Field2>
          <Field2 label="Geofence Radius (meters)"><input type="number" style={inputStyle} value={radius} onChange={e => setRadius(e.target.value)} /></Field2>
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.danger }}>{error}</div>}
          <PrimaryButton full disabled={!canSubmit || saving} onClick={submit}>{saving ? "Adding…" : "Add Location"}</PrimaryButton>
        </div>
      )}
    </Card>
  );
}

export default AddLocationPage;