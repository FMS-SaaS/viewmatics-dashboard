import React, { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Home, Fingerprint, Calendar, ClipboardList, TrendingUp, Wallet, HandCoins,
  MessageSquareWarning, Clock, ShieldCheck, UserRound, Users, Building2,
  MapPin, AlertTriangle, Search, Bell, ChevronDown, LogOut, Settings,
  FileText, CheckCircle2, ArrowUpRight, ArrowDownRight, Check, Pencil, Menu, Eye, EyeOff,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList,
} from "recharts";
import * as XLSX from "xlsx";

/* ============================================================
   SUPABASE — real backend connection. The publishable key below
   is safe to have here: it's specifically designed for client-side
   use and is protected by the Row Level Security policies already
   set up on the database (see viewmatics-rls-policies.sql).
   ============================================================ */
const supabaseUrl = "https://yaqdhlmwelydptxkjalw.supabase.co";
const supabaseKey = "sb_publishable_0Smw2gBNoYgOjFdPweJ9AA_h_qZ-0p8";
const supabaseClient = createClient(supabaseUrl, supabaseKey);

/* ============================================================
   DESIGN SYSTEM — extends the Viewmatics mobile app identity
   (steel-blue + safety-amber, ink-stamp status badges) into a
   desktop console: fixed dark sidebar, light content, dense tables.
   ============================================================ */
const C = {
  bg: "#F3F1EA",
  paper: "#FFFFFF",
  ink: "#1E2A32",
  inkSoft: "#5B6670",
  primary: "#24476B",
  primaryDeep: "#182F49",
  primaryDeeper: "#101E30",
  primaryTint: "#DCE6EE",
  accent: "#E0932E",
  accentDeep: "#B5721A",
  accentTint: "#FBEBD4",
  success: "#3E8A5B",
  successTint: "#E1EFE5",
  danger: "#C1473E",
  dangerTint: "#F7E3E1",
  border: "#E4E0D4",
};
const displayFont = "'Barlow Semi Condensed', 'Archivo Narrow', sans-serif";
const bodyFont = "'IBM Plex Sans', system-ui, sans-serif";
const monoFont = "'IBM Plex Mono', monospace";
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap";

const MOD_COLORS = [
  { bg: "#E4ECF7", fg: "#2C5A8C" }, { bg: "#E7F3EA", fg: "#3E8A5B" },
  { bg: "#F7ECD9", fg: "#B5721A" }, { bg: "#F1E7F6", fg: "#7A4F9E" },
  { bg: "#E2F1F1", fg: "#2E7D7D" }, { bg: "#FBE7E9", fg: "#C1473E" },
];

/* ============================================================
   STATUS PILL — flat, dot-indicator status chip. The mobile app's
   tilted "ink stamp" reads as playful at desktop scale; this reads
   as a serious ops tool while keeping the same tone colors.
   ============================================================ */
function Stamp({ text, tone = "neutral" }) {
  const tones = {
    success: { c: C.success, t: C.successTint }, danger: { c: C.danger, t: C.dangerTint },
    accent: { c: C.accentDeep, t: C.accentTint }, neutral: { c: C.inkSoft, t: "#EEECE5" },
    primary: { c: C.primary, t: C.primaryTint },
  };
  const tn = tones[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontWeight: 600,
      color: tn.c, background: tn.t, borderRadius: 6, padding: "4px 10px 4px 8px", fontSize: 12,
      whiteSpace: "nowrap", letterSpacing: "0.01em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tn.c, flexShrink: 0 }} />
      {text}
    </span>
  );
}

/* ============================================================
   MOCK DATA — condensed, desktop-relevant slices of the same
   Viewmatics world modeled in the mobile app.
   ============================================================ */
const MASTER = { name: "Arvind Kapoor", title: "Operations Head — Client" };

const SITES = [
  { id: 1, name: "DLF Cyber Hub — Tower B", budget: 30, present: 23, absent: 2, onLeave: 3, weekOff: 2, taskCompletion: 82, openGrievances: 2, cost: 742000 },
  { id: 2, name: "DLF Cyber Hub — Tower A", budget: 22, present: 19, absent: 1, onLeave: 1, weekOff: 1, taskCompletion: 91, openGrievances: 0, cost: 566000 },
  { id: 3, name: "One Horizon Center", budget: 18, present: 15, absent: 1, onLeave: 1, weekOff: 1, taskCompletion: 75, openGrievances: 3, cost: 441000 },
  { id: 4, name: "Cyber City — Block C", budget: 14, present: 12, absent: 0, onLeave: 1, weekOff: 1, taskCompletion: 88, openGrievances: 1, cost: 320000 },
];

// Per-employee punch-in status for today — used by the Live Report to show who's
// actually on site right now, by designation, per site.
const LIVE_PUNCH_SEED = [
  { code: "EMP-2200", punchedIn: true, time: "08:55 AM", shift: "G" },
  { code: "EMP-2291", punchedIn: true, time: "09:02 AM", shift: "G" },
  { code: "EMP-2308", punchedIn: true, time: "02:10 PM", shift: "A" },
  { code: "EMP-2312", punchedIn: true, time: "10:05 PM", shift: "C" },
  { code: "EMP-2305", punchedIn: true, time: "09:00 AM", shift: "G" },
  { code: "EMP-2310", punchedIn: false, time: null, shift: null },
  { code: "EMP-2271", punchedIn: true, time: "09:10 AM", shift: "G" },
  { code: "EMP-2274", punchedIn: true, time: "08:45 AM", shift: "G" },
  { code: "EMP-2201", punchedIn: true, time: "09:00 AM", shift: "G" },
  { code: "EMP-2270", punchedIn: true, time: "08:50 AM", shift: "G" },
  { code: "EMP-2320", punchedIn: true, time: "09:05 AM", shift: "G" },
  { code: "EMP-2360", punchedIn: false, time: null, shift: null },
  { code: "EMP-2202", punchedIn: true, time: "09:00 AM", shift: "G" },
  { code: "EMP-2272", punchedIn: false, time: null, shift: null },
  { code: "EMP-2331", punchedIn: true, time: "02:15 PM", shift: "A" },
  { code: "EMP-2355", punchedIn: true, time: "09:00 AM", shift: "G" },
  { code: "EMP-2273", punchedIn: true, time: "08:55 AM", shift: "G" },
  { code: "EMP-2340", punchedIn: true, time: "09:00 AM", shift: "G" },
];
function getLivePunch(code) {
  return LIVE_PUNCH_SEED.find(p => p.code === code) || { punchedIn: false, time: null, shift: null };
}

// Real per-designation present count for today, per site — used for Budget vs Actual
// manpower and the day-to-day cost calculation, instead of a ratio-based estimate.
const PRESENT_TODAY_SEED = [
  { site: "DLF Cyber Hub — Tower B", designation: "Housekeeping Supervisor", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "DLF Cyber Hub — Tower B", designation: "Technician", shiftG: 1, shiftA: 1, shiftC: 1 },
  { site: "DLF Cyber Hub — Tower B", designation: "Housekeeping", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "DLF Cyber Hub — Tower B", designation: "Security", shiftG: 0, shiftA: 0, shiftC: 0 },
  { site: "DLF Cyber Hub — Tower B", designation: "Carpenter", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "DLF Cyber Hub — Tower B", designation: "Gardener", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "DLF Cyber Hub — Tower A", designation: "Technical Supervisor", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "DLF Cyber Hub — Tower A", designation: "Pantry", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "DLF Cyber Hub — Tower A", designation: "Housekeeping", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "One Horizon Center", designation: "Security Supervisor", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "One Horizon Center", designation: "Painter", shiftG: 0, shiftA: 0, shiftC: 0 },
  { site: "One Horizon Center", designation: "Security", shiftG: 0, shiftA: 1, shiftC: 0 },
  { site: "One Horizon Center", designation: "Technician", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "Cyber City — Block C", designation: "Cafe Boy", shiftG: 1, shiftA: 0, shiftC: 0 },
  { site: "Cyber City — Block C", designation: "Housekeeping", shiftG: 1, shiftA: 0, shiftC: 0 },
];
function getPresentByShift(site, designation) {
  const row = PRESENT_TODAY_SEED.find(p => p.site === site && p.designation === designation);
  return row ? { G: row.shiftG, A: row.shiftA, C: row.shiftC } : { G: 0, A: 0, C: 0 };
}
function getPresentToday(site, designation) {
  const { G, A, C } = getPresentByShift(site, designation);
  return G + A + C;
}
// Deterministic pseudo-random variation, seeded by date + site + designation, so the
// Budget vs Actual date filter shows different (but reproducible) attendance per day.
function seededVariation(dateISO, site, designation, base, spread) {
  let hash = 0;
  const str = dateISO + site + designation;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 997;
  const delta = (hash % (spread * 2 + 1)) - spread;
  return Math.max(base + delta, 0);
}
function getPresentByShiftForDate(dateISO, site, designation, budgeted) {
  // "Today" uses the real recorded snapshot. Any other date is estimated from the
  // budgeted headcount (not today's value) — otherwise a designation that happens
  // to show 0 present today would incorrectly show 0 for every other date too.
  if (dateISO === "2026-07-22") return getPresentByShift(site, designation);
  if (!budgeted) return { G: 0, A: 0, C: 0 };
  const budgetShifts = splitBudgetByShift(designation, budgeted);
  const spread = Math.min(1, budgeted);
  const variedTotal = seededVariation(dateISO, site, designation, budgeted, spread);
  const G = Math.round((budgetShifts.G / budgeted) * variedTotal);
  const A = Math.round((budgetShifts.A / budgeted) * variedTotal);
  const C = Math.max(variedTotal - G - A, 0);
  return { G, A, C };
}

const DESIGNATIONS = [
  "Housekeeping Supervisor", "Technical Supervisor", "Technician", "Housekeeping",
  "Pantry", "Carpenter", "Painter", "Security Supervisor", "Security", "Cafe Boy", "Gardener",
];
const SUPERVISOR_DESIGNATIONS = ["Housekeeping Supervisor", "Technical Supervisor", "Security Supervisor"];
const DESIGNATION_ROLE = {
  "Housekeeping Supervisor": "supervisor", "Technical Supervisor": "supervisor", "Security Supervisor": "supervisor",
  "Technician": "user", "Housekeeping": "user", "Pantry": "user", "Carpenter": "user",
  "Painter": "user", "Security": "user", "Cafe Boy": "user", "Gardener": "user",
};

const ORG_DIRECTORY = [
  { code: "EMP-2200", name: "Priya Nair", designation: "Housekeeping Supervisor", site: "DLF Cyber Hub — Tower B", contact: "+91 98110 22001", doj: "2021-04-12", pan: "ABCPN1234K", aadhaar: "XXXX-XXXX-4821" },
  { code: "EMP-2201", name: "Ravi Shastri", designation: "Technical Supervisor", site: "DLF Cyber Hub — Tower A", contact: "+91 98110 22002", doj: "2020-09-03", pan: "ABCPR5678L", aadhaar: "XXXX-XXXX-5932" },
  { code: "EMP-2202", name: "Rajendra Singh", designation: "Security Supervisor", site: "One Horizon Center", contact: "+91 98110 22003", doj: "2022-01-18", pan: "ABCPS9012M", aadhaar: "XXXX-XXXX-6043" },
  { code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", site: "DLF Cyber Hub — Tower B", contact: "+91 98765 43210", doj: "2023-03-14", pan: "ABCPK3456N", aadhaar: "XXXX-XXXX-4821" },
  { code: "EMP-2305", name: "Sita Devi", designation: "Housekeeping", site: "DLF Cyber Hub — Tower B", contact: "+91 91234 56780", doj: "2022-11-02", pan: "ABCPD7890P", aadhaar: "XXXX-XXXX-7154" },
  { code: "EMP-2308", name: "Anil Yadav", designation: "Technician", site: "DLF Cyber Hub — Tower B", contact: "+91 99887 65432", doj: "2026-07-22", pan: "ABCPY1235Q", aadhaar: "XXXX-XXXX-8265" },
  { code: "EMP-2310", name: "Manoj Tiwari", designation: "Security", site: "DLF Cyber Hub — Tower B", contact: "+91 97001 22334", doj: "2021-06-10", pan: "ABCPT4568R", aadhaar: "XXXX-XXXX-9376" },
  { code: "EMP-2312", name: "Deepak Singh", designation: "Technician", site: "DLF Cyber Hub — Tower B", contact: "+91 90011 22556", doj: "2023-09-05", pan: "ABCPS7891S", aadhaar: "XXXX-XXXX-0487" },
  { code: "EMP-2270", name: "Meena Kumari", designation: "Pantry", site: "DLF Cyber Hub — Tower A", contact: "+91 98220 11223", doj: "2023-05-22", pan: "ABCPK2346T", aadhaar: "XXXX-XXXX-1598" },
  { code: "EMP-2271", name: "Suresh Verma", designation: "Carpenter", site: "DLF Cyber Hub — Tower B", contact: "+91 98220 11224", doj: "2022-08-14", pan: "ABCPV5679U", aadhaar: "XXXX-XXXX-2609" },
  { code: "EMP-2272", name: "Ajay Mehta", designation: "Painter", site: "One Horizon Center", contact: "+91 98220 11225", doj: "2023-02-09", pan: "ABCPM8902V", aadhaar: "XXXX-XXXX-3710" },
  { code: "EMP-2273", name: "Vikas Sharma", designation: "Cafe Boy", site: "Cyber City — Block C", contact: "+91 98220 11226", doj: "2024-04-01", pan: "ABCPS1237W", aadhaar: "XXXX-XXXX-4821" },
  { code: "EMP-2274", name: "Baburao Patil", designation: "Gardener", site: "DLF Cyber Hub — Tower B", contact: "+91 98220 11227", doj: "2020-12-11", pan: "ABCPP4570X", aadhaar: "XXXX-XXXX-5932" },
  { code: "EMP-2320", name: "Reena Kapoor", designation: "Housekeeping", site: "DLF Cyber Hub — Tower A", contact: "+91 98220 11228", doj: "2023-07-19", pan: "ABCPK7893Y", aadhaar: "XXXX-XXXX-6043" },
  { code: "EMP-2331", name: "Farhan Ali", designation: "Security", site: "One Horizon Center", contact: "+91 98220 11229", doj: "2022-03-25", pan: "ABCPA0125Z", aadhaar: "XXXX-XXXX-7154" },
  { code: "EMP-2340", name: "Suresh Pillai", designation: "Housekeeping", site: "Cyber City — Block C", contact: "+91 98220 11230", doj: "2023-10-30", pan: "ABCPP3458A", aadhaar: "XXXX-XXXX-8265" },
  { code: "EMP-2355", name: "Vikram Rathi", designation: "Technician", site: "One Horizon Center", contact: "+91 98220 11231", doj: "2021-11-08", pan: "ABCPR6781B", aadhaar: "XXXX-XXXX-9376" },
  { code: "EMP-2360", name: "Neha Joshi", designation: "Housekeeping", site: "DLF Cyber Hub — Tower A", contact: "+91 98220 11232", doj: "2024-02-17", pan: "ABCPJ9014C", aadhaar: "XXXX-XXXX-0487" },
];

function calcTenure(dojISO, todayISO = "2026-07-22") {
  const doj = new Date(dojISO), today = new Date(todayISO);
  let years = today.getFullYear() - doj.getFullYear();
  let months = today.getMonth() - doj.getMonth();
  if (today.getDate() < doj.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return `${years}y ${months}m`;
}

const SUPERVISOR_SCORECARD = [
  { name: "Priya Nair", designation: "Housekeeping Supervisor", sites: 2, headcount: 44, attendancePct: 82, taskCompletionPct: 85, avgResolutionDays: 1.5, rating: 4.3 },
  { name: "Ravi Shastri", designation: "Technical Supervisor", sites: 1, headcount: 22, attendancePct: 86, taskCompletionPct: 91, avgResolutionDays: 0.8, rating: 4.6 },
  { name: "Rajendra Singh", designation: "Security Supervisor", sites: 1, headcount: 18, attendancePct: 83, taskCompletionPct: 75, avgResolutionDays: 3.2, rating: 3.7 },
];
const RATING_DURATIONS = ["W1", "W2", "W3", "W4", "Monthly"];

const COMPLIANCE_SUMMARY = { bgvVerified: 62, bgvTotal: 67, docsComplete: 60, docsTotal: 67, pfEsiCompliant: 65, pfEsiTotal: 67 };
const COMPLIANCE_PENDING_ITEMS = [
  { category: "bgv", code: "EMP-2331", name: "Farhan Ali", site: "One Horizon Center", issue: "BGV pending" },
  { category: "bgv", code: "EMP-2355", name: "Vikram Rathi", site: "One Horizon Center", issue: "BGV pending" },
  { category: "bgv", code: "EMP-2360", name: "Neha Joshi", site: "DLF Cyber Hub — Tower A", issue: "BGV pending" },
  { category: "bgv", code: "EMP-2340", name: "Suresh Pillai", site: "Cyber City — Block C", issue: "BGV pending" },
  { category: "bgv", code: "EMP-2320", name: "Reena Kapoor", site: "DLF Cyber Hub — Tower A", issue: "BGV pending" },
  { category: "docs", code: "EMP-2355", name: "Vikram Rathi", site: "One Horizon Center", issue: "PAN not on file" },
  { category: "docs", code: "EMP-2360", name: "Neha Joshi", site: "DLF Cyber Hub — Tower A", issue: "Aadhaar not on file" },
  { category: "docs", code: "EMP-2271", name: "Suresh Verma", site: "DLF Cyber Hub — Tower B", issue: "Bank details missing" },
  { category: "docs", code: "EMP-2272", name: "Ajay Mehta", site: "One Horizon Center", issue: "PAN not on file" },
  { category: "docs", code: "EMP-2273", name: "Vikas Sharma", site: "Cyber City — Block C", issue: "Aadhaar not on file" },
  { category: "docs", code: "EMP-2274", name: "Baburao Patil", site: "DLF Cyber Hub — Tower B", issue: "Bank details missing" },
  { category: "docs", code: "EMP-2270", name: "Meena Kumari", site: "DLF Cyber Hub — Tower A", issue: "PAN not on file" },
  { category: "pfEsi", code: "EMP-2360", name: "Neha Joshi", site: "DLF Cyber Hub — Tower A", issue: "PF not enrolled" },
  { category: "pfEsi", code: "EMP-2340", name: "Suresh Pillai", site: "Cyber City — Block C", issue: "ESI not enrolled" },
];

function advanceOverallStatus(req) {
  if (req.l1Status === "rejected" || req.l2Status === "rejected") return "Rejected";
  if (req.l1Status === "approved" && req.l2Status === "approved") return "Approved";
  return "Pending — Master Admin";
}
const advanceRequestsSeed = [
  { id: "AD-041", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", days: 6, amount: "₹5,690", date: "20 Jul 2026", l1Status: "approved", l2Status: "pending" },
  { id: "AD-038", code: "EMP-2308", name: "Anil Yadav", designation: "Technician", days: 4, amount: "₹3,200", date: "12 Jul 2026", l1Status: "approved", l2Status: "approved" },
  { id: "AD-035", code: "EMP-2305", name: "Sita Devi", designation: "Housekeeping", days: 5, amount: "₹2,900", date: "05 Jul 2026", l1Status: "approved", l2Status: "rejected" },
];

const EXPENSE_TYPES = ["Travel & Transportation", "Food & Meals", "Recharges", "Accommodation", "Office & Stationery", "Tools & Equipment", "Material Purchase", "Others"];
const expensesSeed = [
  { id: "EXP-198", code: "EMP-2200", name: "Priya Nair", designation: "Housekeeping Supervisor", site: "DLF Cyber Hub — Tower B", dateISO: "2026-07-10", date: "10 Jul 2026", type: "Food & Meals", amount: 420, invoice: "invoice_food_198.jpg", remark: "Team lunch during audit visit", status: "Approved" },
  { id: "EXP-201", code: "EMP-2200", name: "Priya Nair", designation: "Housekeeping Supervisor", site: "DLF Cyber Hub — Tower B", dateISO: "2026-07-19", date: "19 Jul 2026", type: "Travel & Transportation", amount: 850, invoice: "invoice_travel_201.jpg", remark: "Cab fare — inter-site visit", status: "Pending" },
  { id: "EXP-204", code: "EMP-2201", name: "Ravi Shastri", designation: "Technical Supervisor", site: "DLF Cyber Hub — Tower A", dateISO: "2026-07-21", date: "21 Jul 2026", type: "Tools & Equipment", amount: 2100, invoice: "invoice_tools_204.jpg", remark: "Replacement multimeter", status: "Pending" },
  { id: "EXP-207", code: "EMP-2202", name: "Rajendra Singh", designation: "Security Supervisor", site: "One Horizon Center", dateISO: "2026-07-15", date: "15 Jul 2026", type: "Recharges", amount: 300, invoice: "invoice_recharge_207.jpg", remark: "Walkie-talkie top-up", status: "Approved" },
  { id: "EXP-209", code: "EMP-2200", name: "Priya Nair", designation: "Housekeeping Supervisor", site: "DLF Cyber Hub — Tower B", dateISO: "2026-07-05", date: "05 Jul 2026", type: "Material Purchase", amount: 1200, invoice: "invoice_material_209.jpg", remark: "Cleaning chemicals restock", status: "Rejected" },
  { id: "EXP-211", code: "EMP-2201", name: "Ravi Shastri", designation: "Technical Supervisor", site: "DLF Cyber Hub — Tower A", dateISO: "2026-06-28", date: "28 Jun 2026", type: "Accommodation", amount: 1800, invoice: "invoice_hotel_211.jpg", remark: "Overnight stay — night shift audit", status: "Approved" },
];

// --- Grievance dataset (dashboard-side, for the Grievance Report) ---
const GRIEVANCE_CATEGORIES = ["Attendance", "Leave", "Salary & Benefits", "Duty & Shift", "Supervisor Related", "Uniform & PPE", "Tools & Equipment", "Health & Safety", "IT & Mobile App"];
const grievanceReportSeed = [
  { id: "GRV-109", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", site: "DLF Cyber Hub — Tower B", category: "Salary & Benefits", subcategory: "Overtime Payment Pending", dateISO: "2026-07-02", date: "02 Jul 2026", priority: "P2", status: "Closed" },
  { id: "GRV-114", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", site: "DLF Cyber Hub — Tower B", category: "Tools & Equipment", subcategory: "Tool Damaged", dateISO: "2026-07-15", date: "15 Jul 2026", priority: "P2", status: "In Progress" },
  { id: "GRV-115", code: "EMP-2308", name: "Anil Yadav", designation: "Technician", site: "DLF Cyber Hub — Tower B", category: "Duty & Shift", subcategory: "Shift Change Request", dateISO: "2026-07-20", date: "20 Jul 2026", priority: "P3", status: "Pending" },
  { id: "GRV-118", code: "EMP-2355", name: "Vikram Rathi", designation: "Technician", site: "One Horizon Center", category: "Uniform & PPE", subcategory: "Safety Shoes Required", dateISO: "2026-07-11", date: "11 Jul 2026", priority: "P3", status: "Closed" },
  { id: "GRV-121", code: "EMP-2360", name: "Neha Joshi", designation: "Housekeeping", site: "DLF Cyber Hub — Tower A", category: "Health & Safety", subcategory: "Slip / Trip Hazard", dateISO: "2026-07-18", date: "18 Jul 2026", priority: "P1", status: "In Progress" },
  { id: "GRV-124", code: "EMP-2340", name: "Suresh Pillai", designation: "Housekeeping", site: "Cyber City — Block C", category: "IT & Mobile App", subcategory: "Attendance Not Syncing", dateISO: "2026-06-25", date: "25 Jun 2026", priority: "P3", status: "Closed" },
];

// --- Task dataset (for Task History / Open Task Details) ---
const taskSeed = [
  { id: "TSK-501", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", site: "DLF Cyber Hub — Tower B", task: "Inspect Fire Extinguishers – East Wing", priority: "P1", assignedDateISO: "2026-07-22", assignedDate: "22 Jul 2026", status: "Open" },
  { id: "TSK-502", code: "EMP-2308", name: "Anil Yadav", designation: "Technician", site: "DLF Cyber Hub — Tower B", task: "Check HVAC Systems – Room 304", priority: "P2", assignedDateISO: "2026-07-22", assignedDate: "22 Jul 2026", status: "Open" },
  { id: "TSK-497", code: "EMP-2305", name: "Sita Devi", designation: "Housekeeping", site: "DLF Cyber Hub — Tower B", task: "Lobby Deep Clean", priority: "P2", assignedDateISO: "2026-07-21", assignedDate: "21 Jul 2026", completedDateISO: "2026-07-21", completedDate: "21 Jul 2026", status: "Completed" },
  { id: "TSK-489", code: "EMP-2355", name: "Vikram Rathi", designation: "Technician", site: "One Horizon Center", task: "Elevator Log Check", priority: "P3", assignedDateISO: "2026-07-19", assignedDate: "19 Jul 2026", completedDateISO: "2026-07-20", completedDate: "20 Jul 2026", status: "Completed" },
  { id: "TSK-503", code: "EMP-2340", name: "Suresh Pillai", designation: "Housekeeping", site: "Cyber City — Block C", task: "Pantry Restocking", priority: "P3", assignedDateISO: "2026-07-22", assignedDate: "22 Jul 2026", status: "Open" },
  { id: "TSK-475", code: "EMP-2272", name: "Ajay Mehta", designation: "Painter", site: "One Horizon Center", task: "Wall Touch-up – Reception", priority: "P3", assignedDateISO: "2026-07-14", assignedDate: "14 Jul 2026", completedDateISO: "2026-07-16", completedDate: "16 Jul 2026", status: "Completed" },
];

// --- Attendance history (per employee, ~30 days) for the Attendance Report ---
function generateAttendanceReport(days = 30) {
  const base = new Date("2026-07-22T00:00:00");
  const rows = [];
  ORG_DIRECTORY.forEach((emp, ei) => {
    for (let i = 0; i < days; i++) {
      const d = new Date(base); d.setDate(d.getDate() - i);
      const dateISO = d.toISOString().slice(0, 10);
      const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const dow = d.getDay();
      let status = "P";
      if (dow === 0) status = "WO";
      else if ((i + ei) % 11 === 0) status = "L";
      else if ((i + ei) % 17 === 0) status = "A";
      rows.push({
        code: emp.code, name: emp.name, designation: emp.designation, site: emp.site,
        dateISO, date, status,
        inTime: status === "P" ? `0${9 + (i % 2)}:0${i % 6} AM` : "—",
        outTime: status === "P" ? `0${6 + (i % 2)}:${10 + (i % 5) * 5} PM` : "—",
      });
    }
  });
  return rows;
}
const attendanceReportSeed = generateAttendanceReport(30);

// Single source of truth for a site's Budget/Present/Absent on a given date — real
// ORG_DIRECTORY headcount + real per-employee attendance status, not the old static
// SITES.present/.budget/.absent fields (which had drifted completely disconnected
// from real data). Absent = the full gap (Budget - Present), i.e. includes anyone on
// leave or week off, not split into separate categories.
function getSiteAttendanceSummary(siteName, dateISO) {
  const budget = ORG_DIRECTORY.filter(e => e.site === siteName).length;
  const dayRecords = attendanceReportSeed.filter(r => r.site === siteName && r.dateISO === dateISO);
  const present = dayRecords.filter(r => r.status === "P").length;
  const absent = budget - present;
  return { budget, present, absent, pct: budget ? Math.round((present / budget) * 100) : 0 };
}

// OT (Overtime) records — logged on a subset of Present days across the same range
// Parses "09:03 AM" / "07:10 PM" style strings into decimal hours (e.g. 9.05, 19.17)
function parseTimeToHours(str) {
  const m = String(str).match(/(\d+):(\d+)\s?(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + min / 60;
}
function computeDutyHours(punchIn, punchOut) {
  const inH = parseTimeToHours(punchIn);
  const outH = parseTimeToHours(punchOut);
  if (inH === null || outH === null) return 0;
  let diff = outH - inH;
  if (diff < 0) diff += 24;
  return diff;
}
// Converts decimal hours (e.g. 2.3) into an "H:MM" duration string (e.g. "2:18")
function hoursToHHMM(decimalHours) {
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

// Combines a date (dateISO) with a time string ("09:03 AM") into "dd/mm/yy hh:mm:ss"
function formatPunchDateTime(dateISO, timeStr, seedSeconds) {
  const hours = parseTimeToHours(timeStr);
  if (hours === null) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const d = new Date(dateISO + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(h).padStart(2, "0");
  const mi = String(m).padStart(2, "0");
  const ss = String(seedSeconds % 60).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}:${ss}`;
}

function generateOTReport() {
  const rows = [];
  const SHIFT_HRS = 9; // assigned shift length used for OT calculation
  attendanceReportSeed.forEach((r, i) => {
    if (r.status !== "P") return;
    const roll = (r.code.charCodeAt(r.code.length - 1) + i) % 6;
    if (roll !== 0) return; // only some present days have logged OT
    const otApplied = [1, 1.5, 2, 2.5, 3][roll % 5] || 1.5;
    const actualDutyHrs = Math.round(computeDutyHours(r.inTime, r.outTime) * 10) / 10;
    // Additional Hr = actually worked time beyond the assigned shift. Actual OT as per
    // system = whichever is smaller: what was applied for, or this Additional Hr figure
    // (can't get OT for hours not worked).
    const additionalHrs = Math.round(Math.max(actualDutyHrs - SHIFT_HRS, 0) * 10) / 10;
    const actualOT = Math.round(Math.min(otApplied, additionalHrs) * 10) / 10;
    rows.push({
      code: r.code, name: r.name, designation: r.designation, site: r.site,
      dateISO: r.dateISO,
      punchIn: formatPunchDateTime(r.dateISO, r.inTime, i * 7),
      punchOut: formatPunchDateTime(r.dateISO, r.outTime, i * 13),
      shiftHrs: SHIFT_HRS, actualDutyHrs, additionalHrs, otApplied, actualOT,
    });
  });
  return rows;
}
const otReportSeed = generateOTReport();

const BASE_RATES = {
  "Housekeeping Supervisor": 32000, "Technical Supervisor": 34000, "Technician": 24000,
  "Housekeeping": 16000, "Pantry": 15000, "Carpenter": 20000, "Painter": 19000,
  "Security Supervisor": 30000, "Security": 18000, "Cafe Boy": 15500, "Gardener": 14000,
};
const SITE_RATE_MULTIPLIER = {
  "DLF Cyber Hub — Tower B": 1.0, "DLF Cyber Hub — Tower A": 0.97,
  "One Horizon Center": 1.03, "Cyber City — Block C": 0.95,
};
const RATE_CHART_SEED = SITES.flatMap(s =>
  DESIGNATIONS.map(d => ({
    site: s.name, designation: d,
    monthlyRate: Math.round((BASE_RATES[d] * (SITE_RATE_MULTIPLIER[s.name] || 1)) / 100) * 100,
  }))
);
function computeSiteCost(siteName, rates) {
  return ORG_DIRECTORY.filter(e => e.site === siteName).reduce((sum, e) => {
    const r = rates.find(x => x.site === siteName && x.designation === e.designation);
    return sum + (r ? r.monthlyRate : 0);
  }, 0);
}

const SHIFTS = ["Morning", "Evening", "Night"];
const shiftBudgetSeed = [
  { site: "DLF Cyber Hub — Tower B", designation: "Housekeeping", morning: 6, evening: 4, night: 2 },
  { site: "DLF Cyber Hub — Tower B", designation: "Security", morning: 2, evening: 2, night: 2 },
  { site: "One Horizon Center", designation: "Security", morning: 3, evening: 2, night: 2 },
];
// Splits a designation's budgeted headcount across G/A/C shifts. Security-type roles need
// round-the-clock coverage; everything else is weighted toward the day (G) shift.
function splitBudgetByShift(designation, budgeted) {
  if (budgeted <= 0) return { G: 0, A: 0, C: 0 };
  if (designation.includes("Security")) {
    const G = Math.ceil(budgeted / 3);
    const A = Math.ceil((budgeted - G) / 2);
    const C = Math.max(budgeted - G - A, 0);
    return { G, A, C };
  }
  const G = Math.max(Math.ceil(budgeted * 0.6), 1);
  const A = Math.max(Math.ceil((budgeted - G) * 0.6), budgeted - G > 0 ? 1 : 0);
  const C = Math.max(budgeted - G - A, 0);
  return { G, A, C };
}

// Monthly OT hours & cost per site — logged by supervisors, added on top of attendance-based cost
const otCostSeed = [
  { site: "DLF Cyber Hub — Tower B", otHours: 48, otCost: 21600 },
  { site: "DLF Cyber Hub — Tower A", otHours: 22, otCost: 9900 },
  { site: "One Horizon Center", otHours: 36, otCost: 16200 },
  { site: "Cyber City — Block C", otHours: 14, otCost: 6300 },
];

const escalationsSeed = [
  { id: "ESC-01", type: "Grievance", ref: "GRV-115", site: "One Horizon Center", supervisor: "Rajendra Singh", details: "Shift Change Request pending 5+ days", daysOpen: 6, priority: "P2" },
  { id: "ESC-02", type: "Advance Salary", ref: "AD-041", site: "DLF Cyber Hub — Tower B", supervisor: "Priya Nair", details: "Advance salary request pending approval 4+ days", daysOpen: 4, priority: "P3" },
];
const costPie = SITES.map((s, i) => ({ name: s.name, value: s.cost, color: MOD_COLORS[i % MOD_COLORS.length].fg }));

/* ============================================================
   REPORTS DATA
   ============================================================ */
const shortageDataSeed = [
  { site: "DLF Cyber Hub — Tower B", designation: "Housekeeping", budgeted: 12, present: 9, wo: 1, leave: 2 },
  { site: "DLF Cyber Hub — Tower B", designation: "Security", budgeted: 6, present: 6, wo: 0, leave: 0 },
  { site: "DLF Cyber Hub — Tower A", designation: "Technician", budgeted: 8, present: 8, wo: 0, leave: 0 },
  { site: "DLF Cyber Hub — Tower A", designation: "Pantry", budgeted: 3, present: 2, wo: 1, leave: 0 },
  { site: "One Horizon Center", designation: "Security", budgeted: 7, present: 5, wo: 1, leave: 1 },
  { site: "One Horizon Center", designation: "Painter", budgeted: 2, present: 1, wo: 0, leave: 1 },
  { site: "Cyber City — Block C", designation: "Housekeeping", budgeted: 5, present: 3, wo: 1, leave: 1 },
  { site: "Cyber City — Block C", designation: "Cafe Boy", budgeted: 2, present: 2, wo: 0, leave: 0 },
];
// Fill in WO/Leave for every real site+designation combination in ORG_DIRECTORY — the
// hand-seeded list above only covered 8 of 15, so toggling WO/Leave had no visible
// effect on the other 7 (nothing to subtract). Deterministic by name, not random.
function generateShortageData() {
  const seen = new Set(shortageDataSeed.map(r => r.site + "|" + r.designation));
  const rows = [...shortageDataSeed];
  const combos = new Map();
  ORG_DIRECTORY.forEach(e => {
    const key = e.site + "|" + e.designation;
    combos.set(key, (combos.get(key) || 0) + 1);
  });
  combos.forEach((budgeted, key) => {
    if (seen.has(key)) return;
    const [site, designation] = key.split("|");
    const hash = seededVariation(designation, site, "wl", 0, 1000);
    const wo = hash % 3;
    const leave = Math.floor(hash / 3) % 2;
    const present = Math.max(budgeted - wo - leave - (hash % 2), 0);
    rows.push({ site, designation, budgeted, present, wo, leave });
  });
  return rows;
}
const shortageData = generateShortageData();

// Daily shortage trend per site, so the chart can respond to a From/To date filter
function generateShortageTrend(days = 30) {
  const base = new Date("2026-07-22T00:00:00");
  const siteBudget = { "DLF Cyber Hub — Tower B": 30, "DLF Cyber Hub — Tower A": 22, "One Horizon Center": 18, "Cyber City — Block C": 14 };
  const rows = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(base); d.setDate(d.getDate() - i);
    const dateISO = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    Object.entries(siteBudget).forEach(([site, budgeted], si) => {
      const wo = d.getDay() === 0 ? Math.round(budgeted * 0.15) : Math.round(budgeted * 0.03);
      const leave = 1 + ((i + si) % 4);
      const absentOther = (i + si) % 5 === 0 ? 1 : 0;
      const present = Math.max(budgeted - wo - leave - absentOther, 0);
      rows.push({ dateISO, date, dayName, site, budgeted, present, wo, leave });
    });
  }
  return rows.reverse();
}
const shortageTrendSeed = generateShortageTrend(30);

const monthlyReportData = [
  { month: "Apr 2026", avgAttendance: 85, totalCost: 1912000, taskCompletion: 81, escalationsResolved: 5 },
  { month: "May 2026", avgAttendance: 87, totalCost: 1980000, taskCompletion: 84, escalationsResolved: 6 },
  { month: "Jun 2026", avgAttendance: 89, totalCost: 2010000, taskCompletion: 86, escalationsResolved: 4 },
  { month: "Jul 2026", avgAttendance: 91, totalCost: 2069000, taskCompletion: 84, escalationsResolved: 5 },
];

// Attrition — employees who have exited, across the last few months
const attritionRaw = [
  { code: "EMP-2401", name: "Rakesh Yadav", designation: "Security", site: "DLF Cyber Hub — Tower B", doj: "2023-02-10", dol: "2026-07-15", reason: "Resigned", voluntary: true },
  { code: "EMP-2402", name: "Sunita Rani", designation: "Housekeeping", site: "DLF Cyber Hub — Tower A", doj: "2022-11-05", dol: "2026-07-08", reason: "Resigned", voluntary: true },
  { code: "EMP-2403", name: "Vinod Kumar", designation: "Technician", site: "One Horizon Center", doj: "2024-03-18", dol: "2026-06-30", reason: "Performance", voluntary: false },
  { code: "EMP-2404", name: "Kiran Bala", designation: "Cafe Boy", site: "Cyber City — Block C", doj: "2023-08-22", dol: "2026-06-20", reason: "Resigned", voluntary: true },
  { code: "EMP-2405", name: "Mahesh Chand", designation: "Security", site: "One Horizon Center", doj: "2021-05-14", dol: "2026-06-12", reason: "Relocation", voluntary: true },
  { code: "EMP-2406", name: "Pooja Devi", designation: "Housekeeping", site: "Cyber City — Block C", doj: "2024-01-09", dol: "2026-06-05", reason: "Resigned", voluntary: true },
  { code: "EMP-2407", name: "Sanjay Rawat", designation: "Carpenter", site: "DLF Cyber Hub — Tower B", doj: "2022-07-27", dol: "2026-05-28", reason: "Contract Ended", voluntary: false },
  { code: "EMP-2408", name: "Neetu Sharma", designation: "Pantry", site: "DLF Cyber Hub — Tower A", doj: "2023-10-11", dol: "2026-05-15", reason: "Resigned", voluntary: true },
  { code: "EMP-2409", name: "Om Prakash", designation: "Technician", site: "DLF Cyber Hub — Tower B", doj: "2020-09-02", dol: "2026-05-02", reason: "Retired", voluntary: true },
  { code: "EMP-2410", name: "Kavita Joshi", designation: "Housekeeping", site: "DLF Cyber Hub — Tower B", doj: "2024-02-14", dol: "2026-04-20", reason: "Performance", voluntary: false },
  { code: "EMP-2411", name: "Deepak Nair", designation: "Painter", site: "One Horizon Center", doj: "2023-06-06", dol: "2026-04-10", reason: "Resigned", voluntary: true },
  { code: "EMP-2412", name: "Ramesh Gowda", designation: "Security", site: "Cyber City — Block C", doj: "2022-04-19", dol: "2026-03-25", reason: "Resigned", voluntary: true },
  // Structural Change — role eliminated when site budget was scaled back, not a personal
  // exit. Kept separate from real attrition so seasonal headcount swings don't distort
  // the attrition rate (see reasonCategory below).
  { code: "EMP-2413", name: "Ashok Mehra", designation: "Security", site: "DLF Cyber Hub — Tower B", doj: "2025-06-01", dol: "2026-07-20", reason: "Structural Change", voluntary: false },
  { code: "EMP-2414", name: "Suman Lata", designation: "Housekeeping", site: "DLF Cyber Hub — Tower B", doj: "2025-06-01", dol: "2026-07-20", reason: "Structural Change", voluntary: false },
  { code: "EMP-2415", name: "Girish Rao", designation: "Technician", site: "DLF Cyber Hub — Tower B", doj: "2025-06-05", dol: "2026-07-18", reason: "Structural Change", voluntary: false },
];
function monthsBetween(d1ISO, d2ISO) {
  const d1 = new Date(d1ISO + "T00:00:00"), d2 = new Date(d2ISO + "T00:00:00");
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}
// Billing — vendor raises a recurring Month-on-Month bill per site, line-itemed by
// designation (headcount x monthly rate). Covers the last 3 billing periods so there's
// real history to browse, not just the current month.
const BILLING_PERIODS = ["2026-05", "2026-06", "2026-07"];
function billingPeriodLabel(period) {
  const [y, m] = period.split("-");
  return new Date(`${y}-${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function shortPeriodLabel(period) {
  const [y, m] = period.split("-");
  const mon = new Date(`${y}-${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
  return `${mon} '${y.slice(-2)}`;
}

// Budget History — MoM budgeted headcount per site+designation. Current month always
// matches real ORG_DIRECTORY exactly (single source of truth). Earlier months use a
// small deterministic variation, not random noise, so the same site+month always shows
// the same number.
// Budget Report gets its own longer history (12 months) — decoupled from BILLING_PERIODS
// (which is only 3 months, sized for invoice history, not multi-month budget trends).
const BUDGET_PERIODS = (() => {
  const periods = [];
  let d = new Date("2026-07-01T00:00:00");
  for (let i = 0; i < 12; i++) {
    periods.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return periods;
})();
function generateBudgetHistory() {
  const rows = [];
  const currentBudgets = new Map();
  ORG_DIRECTORY.forEach(e => {
    const key = e.site + "|" + e.designation;
    currentBudgets.set(key, (currentBudgets.get(key) || 0) + 1);
  });
  const currentPeriod = BUDGET_PERIODS[BUDGET_PERIODS.length - 1];
  currentBudgets.forEach((currentBudget, key) => {
    const [site, designation] = key.split("|");
    // Walk backward from today's real value, one small deterministic step per month,
    // so the trend looks like a genuine gradual change rather than independent noise.
    const valuesByPeriod = { [currentPeriod]: currentBudget };
    let value = currentBudget;
    for (let i = BUDGET_PERIODS.length - 2; i >= 0; i--) {
      const period = BUDGET_PERIODS[i];
      // Raw hash (not seededVariation's clamped output — that returns 0 about half the
      // time with base=0, which biased every roll toward the same bucket).
      let hash = 0;
      const str = period + site + designation;
      for (let c = 0; c < str.length; c++) hash = (hash * 31 + str.charCodeAt(c)) % 997;
      // Most months stay flat (60%), occasional real movement (20% down, 20% up) —
      // matches how staffing budgets actually behave, rather than constant churn.
      const roll = hash % 10;
      const delta = roll < 2 ? -1 : roll >= 8 ? 1 : 0;
      value = Math.max(value - delta, 0);
      valuesByPeriod[period] = value;
    }
    BUDGET_PERIODS.forEach(period => {
      const budget = valuesByPeriod[period];
      if (budget === 0) return;
      rows.push({ site, designation, period, periodLabel: billingPeriodLabel(period), budget });
    });
  });
  return rows;
}
const budgetHistorySeed = generateBudgetHistory();
const RATE_PER_USER = 249; // ₹ per user, per month — the SaaS subscription price
function generateBillingSeed() {
  const bills = [];
  let invoiceCounter = 1041;
  BILLING_PERIODS.forEach(period => {
    SITES.forEach(site => {
      const userCount = ORG_DIRECTORY.filter(e => e.site === site.name).length;
      if (userCount === 0) return;
      const totalAmount = userCount * RATE_PER_USER;
      invoiceCounter += 1;
      const isCurrentPeriod = period === BILLING_PERIODS[BILLING_PERIODS.length - 1];
      const status = isCurrentPeriod ? "Pending" : (invoiceCounter % 7 === 0 ? "Overdue" : "Paid");
      const [y, m] = period.split("-");
      const raisedOn = `${y}-${m}-01`;
      const dueDate = new Date(`${y}-${m}-01T00:00:00`); dueDate.setDate(dueDate.getDate() + 15);
      bills.push({
        invoiceNo: `INV-${invoiceCounter}`,
        site: site.name, period, periodLabel: billingPeriodLabel(period),
        userCount, ratePerUser: RATE_PER_USER, totalAmount, status,
        raisedOn, dueDate: dueDate.toISOString().slice(0, 10),
      });
    });
  });
  return bills;
}
const billingSeed = generateBillingSeed();

const attritionSeed = attritionRaw.map(r => ({
  ...r,
  dojDisplay: new Date(r.doj).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  dolDisplay: new Date(r.dol).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  tenureMonths: monthsBetween(r.doj, r.dol),
  // "Attrition" = a real, individual exit (resigned, performance, relocation, retired,
  // contract ended). "Structural" = the role itself was eliminated (budget reduction) —
  // not counted toward the attrition rate, since it isn't a retention signal.
  reasonCategory: r.reason === "Structural Change" ? "Structural" : "Attrition",
}));

const escalationsReportData = [
  { ref: "GRV-108", site: "DLF Cyber Hub — Tower B", type: "Grievance", raisedOn: "2026-06-10", resolvedOn: "2026-06-14", daysToResolve: 4, status: "Resolved" },
  { ref: "AD-039", site: "One Horizon Center", type: "Advance Salary", raisedOn: "2026-06-20", resolvedOn: "2026-06-25", daysToResolve: 5, status: "Resolved" },
  { ref: "GRV-111", site: "Cyber City — Block C", type: "Grievance", raisedOn: "2026-07-01", resolvedOn: "2026-07-05", daysToResolve: 4, status: "Resolved" },
  { ref: "GRV-115", site: "One Horizon Center", type: "Grievance", raisedOn: "2026-07-15", resolvedOn: null, daysToResolve: 6, status: "Open" },
  { ref: "AD-041", site: "DLF Cyber Hub — Tower B", type: "Advance Salary", raisedOn: "2026-07-18", resolvedOn: null, daysToResolve: 4, status: "Open" },
];

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */
function Card({ children, style }) {
  return (
    <div style={{
      background: C.paper, borderRadius: 12, padding: 20,
      boxShadow: "0 1px 2px rgba(20,24,28,0.04), 0 1px 8px rgba(20,24,28,0.04)",
      border: `1px solid rgba(228,224,212,0.6)`, ...style,
    }}>{children}</div>
  );
}
function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5, letterSpacing: "0.01em", color: C.ink }}>{children}</div>
      {right}
    </div>
  );
}
function Kpi({ label, value, sub, trend, tone = "primary" }) {
  const color = { primary: C.primary, success: C.success, accent: C.accentDeep, danger: C.danger }[tone];
  return (
    <Card style={{ flex: 1, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>{label}</div>
        {trend != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, color: trend >= 0 ? C.success : C.danger, fontFamily: bodyFont, fontSize: 11.5, fontWeight: 600 }}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 28, color: C.ink, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginTop: 6 }}>{sub}</div>}
      <div style={{ width: 28, height: 3, borderRadius: 2, background: color, marginTop: 12 }} />
    </Card>
  );
}
function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: "auto", margin: "-4px -4px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: bodyFont, fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#F3F1EA" }}>
            {columns.map((c, ci) => (
              <th key={ci} style={{
                padding: "10px 14px", fontWeight: 700, color: C.ink, fontSize: 11.5, letterSpacing: "0.04em",
                textTransform: "uppercase", borderBottom: `2px solid ${C.border}`,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? "#FAF9F5" : "transparent" }}>
              {r.map((cell, j) => <td key={j} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.ink }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const selectStyle = {
  border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontFamily: bodyFont,
  fontSize: 13, color: C.ink, background: C.paper,
};
const inputStyle = {
  width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px",
  fontFamily: bodyFont, fontSize: 13, color: C.ink, background: "#FBFAF7",
};
function PrimaryButton({ children, onClick, tone = "primary", disabled, full }) {
  const bg = tone === "primary" ? C.primary : tone === "accent" ? C.accent : C.danger;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#C9C6BB" : bg, color: "#fff", border: "none", borderRadius: 9,
      padding: "10px 16px", fontFamily: bodyFont, fontWeight: 600, fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto",
    }}>{children}</button>
  );
}

function Field2({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}

function PriorityTag({ p }) {
  const map = { P1: C.danger, P2: C.accentDeep, P3: C.inkSoft };
  const c = map[p] || C.inkSoft;
  return (
    <span style={{
      display: "inline-block", fontFamily: monoFont, fontWeight: 600, fontSize: 11,
      color: c, background: "transparent", border: `1px solid ${c}66`, borderRadius: 5, padding: "2px 7px",
    }}>{p}</span>
  );
}

function Modal({ title, onClose, children, width = 440 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,24,28,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div style={{ width, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", background: C.paper, borderRadius: 12, padding: 24, boxShadow: "0 20px 50px rgba(20,24,28,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 15.5, color: C.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   COMING SOON — an invitation to build the next section, not a
   generic placeholder.
   ============================================================ */
function ComingSoon({ page }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: C.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <FileText size={24} color={C.primary} />
      </div>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.ink, marginBottom: 6 }}>{page} is next up</div>
      <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft, maxWidth: 380 }}>
        This section mirrors the {page} module from the mobile app. Tell Claude to build it and it'll be added here next.
      </div>
    </div>
  );
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const NAV_SECTIONS = [
  {
    section: "Main",
    items: [
      { key: "overview", label: "Overview", icon: Home },
      { key: "sites", label: "Sites Overview", icon: Building2 },
      { key: "supervisorRatings", label: "Supervisor Ratings", icon: Users },
      { key: "directory", label: "Employee Directory", icon: UserRound },
      { key: "compliance", label: "Compliance", icon: ShieldCheck },
      { key: "escalations", label: "Escalations", icon: AlertTriangle },
      { key: "advanceApproval", label: "Advance Approval", icon: HandCoins },
      { key: "expenseApproval", label: "Expense Approval", icon: Wallet },
      { key: "addLocation", label: "Add Location", icon: MapPin },
      { key: "rateChart", label: "Rate Chart", icon: Wallet },
      { key: "billing", label: "Billing", icon: HandCoins },
      { key: "cost", label: "Cost", icon: TrendingUp },
      { key: "shiftBudget", label: "Shift Budget", icon: Clock },
      { key: "raiseTicket", label: "Raise Ticket", icon: MessageSquareWarning },
    ],
  },
  {
    section: "Reports",
    items: [
      { key: "attendanceReport", label: "Attendance/OT Report", icon: FileText },
      { key: "shortageReport", label: "Shortage Report", icon: AlertTriangle },
      { key: "monthlyReport", label: "Monthly Report", icon: FileText },
      { key: "attritionReport", label: "Attrition Report", icon: FileText },
      { key: "budgetReport", label: "Budget Report", icon: FileText },
      { key: "escalationsReport", label: "Escalations Report", icon: FileText },
      { key: "grievanceReport", label: "Grievance Report", icon: FileText },
      { key: "taskHistoryReport", label: "Task History", icon: FileText },
      { key: "expenseReport", label: "Expense Report", icon: FileText },
    ],
  },
];
const NAV = NAV_SECTIONS.flatMap(s => s.items);

/* ============================================================
   OVERVIEW PAGE
   ============================================================ */
function MasterOverview({ selectedSite, rates }) {
  const DAYS_IN_MONTH = 30;
  const [asOfDate, setAsOfDate] = useState("2026-07-22");
  const [liveSelected, setLiveSelected] = useState(null); // { designation, shift }
  const [otDate, setOtDate] = useState("2026-07-22");
  const [sitesDate, setSitesDate] = useState("2026-07-22");
  const [donutHovered, setDonutHovered] = useState(false);
  useEffect(() => { setLiveSelected(null); }, [selectedSite]);

  const sites = selectedSite === "All" ? SITES : SITES.filter(s => s.name === selectedSite);
  const pie = selectedSite === "All" ? costPie : costPie.filter(c => c.name === selectedSite);
  const totalBudget = sites.reduce((s, x) => s + getSiteAttendanceSummary(x.name, "2026-07-22").budget, 0);
  const totalPresent = sites.reduce((s, x) => s + getSiteAttendanceSummary(x.name, "2026-07-22").present, 0);
  const orgAttendance = totalBudget ? Math.round((totalPresent / totalBudget) * 100) : 0;
  const totalCost = sites.reduce((s, x) => s + x.cost, 0);

  const site = sites[0];

  // Budget vs Actual manpower, by designation — budgeted = assigned headcount (ORG_DIRECTORY),
  // actual = present count as of the selected date. When Shiftwise is checked, both budget
  // and actual are additionally split into G (General) / A (Afternoon) / C (Night) shifts.
  const manpowerByDesignation = site
    ? Object.entries(
        ORG_DIRECTORY.filter(e => e.site === site.name).reduce((acc, e) => {
          acc[e.designation] = (acc[e.designation] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([designation, budgeted]) => {
          const shifts = getPresentByShiftForDate(asOfDate, site.name, designation, budgeted);
          const actual = shifts.G + shifts.A + shifts.C;
          const budgetShifts = splitBudgetByShift(designation, budgeted);
          return {
            designation, budgeted, actual, remaining: Math.max(budgeted - actual, 0),
            shiftG: shifts.G, shiftA: shifts.A, shiftC: shifts.C,
            budgetG: budgetShifts.G, budgetA: budgetShifts.A, budgetC: budgetShifts.C,
            pctPresent: budgeted ? Math.round((actual / budgeted) * 100) : 0,
          };
        })
        .sort((a, b) => b.budgeted - a.budgeted)
    : [];

  // Click-to-drill-down for the Live Report table — same pattern as Designation
  // Summary Report: "today" shows real punched-in employees, other dates estimate
  // deterministically from the roster since there's no real per-day history.
  const liveEmployeesFor = (designation, shiftKey, targetCount) => {
    if (designation === "ALL") {
      return manpowerByDesignation.flatMap(m => liveEmployeesFor(m.designation, shiftKey, m[`shift${shiftKey}`] || 0));
    }
    if (asOfDate === "2026-07-22") {
      return ORG_DIRECTORY.filter(e => e.site === site.name && e.designation === designation)
        .map(e => ({ ...e, ...getLivePunch(e.code) }))
        .filter(e => e.punchedIn && e.shift === shiftKey);
    }
    const roster = ORG_DIRECTORY.filter(e => e.site === site.name && e.designation === designation)
      .map(e => ({ ...e, shift: shiftKey, time: "—", h: seededVariation(asOfDate, site.name, e.code, 0, 1000) }))
      .sort((a, b) => a.h - b.h);
    return roster.slice(0, targetCount);
  };
  const liveTotalRow = {
    designation: "ALL",
    budgeted: manpowerByDesignation.reduce((s, m) => s + m.budgeted, 0),
    actual: manpowerByDesignation.reduce((s, m) => s + m.actual, 0),
    shiftG: manpowerByDesignation.reduce((s, m) => s + m.shiftG, 0), budgetG: manpowerByDesignation.reduce((s, m) => s + m.budgetG, 0),
    shiftA: manpowerByDesignation.reduce((s, m) => s + m.shiftA, 0), budgetA: manpowerByDesignation.reduce((s, m) => s + m.budgetA, 0),
    shiftC: manpowerByDesignation.reduce((s, m) => s + m.shiftC, 0), budgetC: manpowerByDesignation.reduce((s, m) => s + m.budgetC, 0),
  };
  const liveRowFor = (designation) => designation === "ALL" ? liveTotalRow : manpowerByDesignation.find(m => m.designation === designation);

  // OT summary, by designation, for the selected date
  const otByDesignation = site
    ? Object.values(
        otReportSeed
          .filter(r => r.site === site.name && r.dateISO === otDate)
          .reduce((acc, r) => {
            if (!acc[r.designation]) acc[r.designation] = { designation: r.designation, applied: 0, actual: 0 };
            acc[r.designation].applied += r.otApplied;
            acc[r.designation].actual += r.actualOT;
            return acc;
          }, {})
      ).sort((a, b) => b.actual - a.actual)
    : [];
  const otTotals = otByDesignation.reduce((acc, r) => ({
    applied: acc.applied + r.applied, actual: acc.actual + r.actual,
  }), { applied: 0, actual: 0 });

  const liveSelectedList = liveSelected
    ? (liveSelected.shift === "ALL"
        ? ["G", "A", "C"].flatMap(sk => liveEmployeesFor(liveSelected.designation, sk, liveRowFor(liveSelected.designation)?.[`shift${sk}`] || 0))
        : liveEmployeesFor(liveSelected.designation, liveSelected.shift, liveRowFor(liveSelected.designation)?.[`shift${liveSelected.shift}`] || 0))
    : [];
  const liveSelectedRow = liveSelected ? liveRowFor(liveSelected.designation) : null;
  const LIVE_SHIFT_LABEL = { G: "General", A: "Afternoon", C: "Night", ALL: "All Shifts" };

  // Cost by designation — CostPerDay = Present(designation) × (MonthlyRate / 30). Accrued cost
  // is a running total: the actual present count is looked up for EVERY day from the 1st of
  // the month through the selected date, and each day's cost is summed. This guarantees accrued
  // cost only ever goes up (or stays flat) as the date moves forward — it can't drop just
  // because one particular day happened to have lower attendance than the day before it.
  const monthStart = new Date(asOfDate + "T00:00:00");
  monthStart.setDate(1);
  const daysUpToSelected = [];
  { let d = new Date(monthStart); const end = new Date(asOfDate + "T00:00:00");
    while (d <= end) { daysUpToSelected.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); } }

  const costByDesignation = site
    ? manpowerByDesignation
        .map(m => {
          const r = rates.find(x => x.site === site.name && x.designation === m.designation);
          const monthlyRate = r ? r.monthlyRate : 0;
          const monthlyCost = monthlyRate * m.budgeted;
          const dailyRate = monthlyRate / DAYS_IN_MONTH;
          const costToday = Math.round(m.actual * dailyRate);
          const runningTotal = daysUpToSelected.reduce((sum, dISO) => {
            if (dISO === asOfDate) return sum + m.actual * dailyRate;
            const shifts = getPresentByShiftForDate(dISO, site.name, m.designation, m.budgeted);
            return sum + (shifts.G + shifts.A + shifts.C) * dailyRate;
          }, 0);
          const accruedCost = Math.min(Math.round(runningTotal), monthlyCost);
          return {
            designation: m.designation, headcount: m.budgeted, cost: monthlyCost,
            actual: m.actual, costToday, accruedCost, remainingCost: Math.max(monthlyCost - accruedCost, 0),
          };
        })
        .sort((a, b) => b.cost - a.cost)
    : [];
  const siteDesignationCostTotal = costByDesignation.reduce((s, c) => s + c.cost, 0);
  const siteDesignationAccruedTotal = costByDesignation.reduce((s, c) => s + c.accruedCost, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Kpi label="Budget" value={selectedSite === "All" ? totalBudget : liveTotalRow.budgeted} tone="primary" />
        <Kpi label="Present Headcount" value={selectedSite === "All" ? totalPresent : liveTotalRow.actual} tone="primary" sub={selectedSite === "All" ? undefined : "Present today"} />
        {selectedSite === "All" ? (
          <Kpi label="Org Attendance" value={`${orgAttendance}%`} trend={1} tone="success" />
        ) : (
          <Card style={{ flex: 1, padding: "18px 20px" }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500, marginBottom: 10 }}>Shift Attendance</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {["G", "A", "C"].map(sk => {
                const pct = liveTotalRow[`budget${sk}`] ? Math.round((liveTotalRow[`shift${sk}`] / liveTotalRow[`budget${sk}`]) * 100) : 0;
                return (
                  <div key={sk} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 12, color: C.inkSoft, width: 14 }}>{sk}</span>
                    <span style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15, color: C.ink }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        <Kpi label="Open Escalations" value={escalationsReportData.filter(e => e.status === "Open" && (selectedSite === "All" || e.site === selectedSite)).length} tone="danger" />
        <Kpi
          label="New Hired"
          value={ORG_DIRECTORY.filter(e => e.doj === "2026-07-22" && (selectedSite === "All" || e.site === selectedSite)).length}
          tone="accent" sub="Joined today"
        />
      </div>

      {selectedSite === "All" ? (
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <Card style={{ flex: 1 }}>
            <SectionLabel>Task Completion by Site</SectionLabel>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[...sites].sort((a, b) => b.taskCompletion - a.taskCompletion).map(s => ({ ...s, shortName: s.name.replace(/^DLF Cyber Hub — /, "") }))}
                margin={{ top: 16, left: 0, right: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="shortName" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: bodyFont, fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="taskCompletion" fill={C.success} radius={[10, 10, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="taskCompletion" position="top" formatter={(v) => `${v}%`} style={{ fontFamily: bodyFont, fontSize: 11, fill: C.ink, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ flex: 1 }}>
            <SectionLabel>Cost Share by Site</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...pie].sort((a, b) => b.value - a.value)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontFamily: bodyFont, fontSize: 10.5 }} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {pie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  <LabelList dataKey="value" position="right" formatter={(v) => `₹${(v / 1000).toFixed(0)}k`} style={{ fontFamily: bodyFont, fontSize: 10.5, fill: C.inkSoft }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
              Total: <b style={{ color: C.ink }}>₹{totalCost.toLocaleString("en-IN")}</b>
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <Card style={{ flex: 1.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <SectionLabel>Live Report</SectionLabel>
              <Field2 label="As of Date">
                <input type="date" style={{ ...inputStyle, width: 140 }} value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
              </Field2>
            </div>

            {/* Overall donut summary */}
            {(() => {
              const totalBudgeted = manpowerByDesignation.reduce((s, m) => s + m.budgeted, 0);
              const totalActual = manpowerByDesignation.reduce((s, m) => s + m.actual, 0);
              const overBudget = totalBudgeted > 0 && totalActual > totalBudgeted;
              const pct = totalBudgeted ? Math.round((totalActual / totalBudgeted) * 100) : 0;
              return (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, color: C.ink, marginBottom: 10 }}>Overall Summary</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div
                      onMouseEnter={() => setDonutHovered(true)}
                      onMouseLeave={() => setDonutHovered(false)}
                      style={{
                        position: "relative", width: 140, height: 140, flexShrink: 0, borderRadius: "50%",
                        boxShadow: donutHovered ? `0 0 0 5px ${overBudget ? "#6B3FA044" : `${C.success}44`}` : "none",
                        transition: "box-shadow 0.15s ease",
                      }}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={[{ v: totalActual }, { v: Math.max(totalBudgeted - totalActual, 0) }]} dataKey="v" innerRadius={46} outerRadius={66} startAngle={90} endAngle={-270}>
                            <Cell fill={overBudget ? "#6B3FA0" : C.success} /><Cell fill="#ECEAE1" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: overBudget ? "#6B3FA0" : C.ink }}>{pct}%</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9, color: C.inkSoft }}>Fulfillment</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.success }}>{totalActual}</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Actual</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.ink }}>{totalBudgeted}</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Budget</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.danger }}>{getSiteAttendanceSummary(site.name, "2026-07-22").absent}</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Absent</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5, color: C.ink, marginBottom: 8 }}>Budget vs Actual</div>
            <ResponsiveContainer width="100%" height={Math.max(manpowerByDesignation.length * 34 + 40, 190)}>
              <BarChart data={manpowerByDesignation} layout="vertical" margin={{ left: 20, right: 16, top: 4, bottom: 4 }} barCategoryGap={10} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickCount={6} tick={{ fontFamily: bodyFont, fontSize: 11 }} />
                <YAxis type="category" dataKey="designation" width={130} tick={{ fontFamily: bodyFont, fontSize: 10.5, fontWeight: 500 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ fontFamily: bodyFont, fontSize: 12, background: C.paper, borderRadius: 8, border: `1px solid ${C.border}`, padding: "8px 12px" }}>
                        <div style={{ fontWeight: 700, marginBottom: 3 }}>{d.designation}</div>
                        <div style={{ color: C.inkSoft }}>Actual {d.actual} / Budget {d.budgeted}</div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: bodyFont, fontSize: 11 }} />
                <Bar dataKey="actual" name="Actual" stackId="manpower" fill="#2C5A8C" radius={[8, 0, 0, 8]}>
                  <LabelList dataKey="actual" position="center" formatter={(v) => v > 0 ? v : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#fff", fontWeight: 600 }} />
                </Bar>
                <Bar dataKey="remaining" name="Vacant" stackId="manpower" fill="#8FA6BC" radius={[0, 8, 8, 0]}>
                  <LabelList dataKey="remaining" position="center" formatter={(v) => v > 0 ? v : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#fff", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {/* Clickable table — every shift cell and the Total cell drill down on the right */}
              <div style={{ flex: 1.2, overflowX: "auto" }}>
                <Table
                  columns={["Designation", "G", "A", "C", "Total", "Fulfillment"]}
                  rows={manpowerByDesignation.map(m => {
                    const CellBtn = ({ shiftKey, actualV, budgetV }) => {
                      const active = liveSelected && liveSelected.designation === m.designation && liveSelected.shift === shiftKey;
                      const over = budgetV > 0 && actualV > budgetV;
                      const short = actualV < budgetV;
                      return (
                        <button onClick={() => setLiveSelected({ designation: m.designation, shift: shiftKey })} style={{
                          background: active ? C.primaryTint : "none", border: active ? `1.5px solid ${C.primary}` : "none",
                          borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontFamily: bodyFont, fontWeight: 600, fontSize: 12,
                          color: over ? "#6B3FA0" : short ? C.danger : C.ink,
                        }}>{actualV}/{budgetV}</button>
                      );
                    };
                    const fulfillPct = m.budgeted ? Math.round((m.actual / m.budgeted) * 100) : 0;
                    const fulfillOver = m.budgeted > 0 && m.actual > m.budgeted;
                    const fulfillTone = fulfillPct >= 100 ? "success" : fulfillPct >= 60 ? "accent" : "danger";
                    return [
                      m.designation,
                      <CellBtn key="G" shiftKey="G" actualV={m.shiftG} budgetV={m.budgetG} />,
                      <CellBtn key="A" shiftKey="A" actualV={m.shiftA} budgetV={m.budgetA} />,
                      <CellBtn key="C" shiftKey="C" actualV={m.shiftC} budgetV={m.budgetC} />,
                      <CellBtn key="ALL" shiftKey="ALL" actualV={m.actual} budgetV={m.budgeted} />,
                      fulfillOver ? (
                        <span key="fulfill" style={{
                          display: "inline-flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontWeight: 600,
                          color: "#6B3FA0", background: "#E4D6F0", borderRadius: 6, padding: "4px 10px 4px 8px", fontSize: 12,
                        }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B3FA0", flexShrink: 0 }} />{fulfillPct}%</span>
                      ) : (
                        <Stamp key="fulfill" text={`${fulfillPct}%`} tone={fulfillTone} />
                      ),
                    ];
                  }).concat([(() => {
                    const TotalCellBtn = ({ shiftKey, actualV, budgetV }) => {
                      const active = liveSelected && liveSelected.designation === "ALL" && liveSelected.shift === shiftKey;
                      const over = budgetV > 0 && actualV > budgetV;
                      const short = actualV < budgetV;
                      return (
                        <button onClick={() => setLiveSelected({ designation: "ALL", shift: shiftKey })} style={{
                          background: active ? C.primaryTint : "none", border: active ? `1.5px solid ${C.primary}` : `1px solid ${C.primary}55`,
                          borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontFamily: bodyFont, fontWeight: 700, fontSize: 12,
                          color: over ? "#6B3FA0" : short ? C.danger : C.primary,
                        }}>{actualV}/{budgetV}</button>
                      );
                    };
                    const totalFulfillPct = liveTotalRow.budgeted ? Math.round((liveTotalRow.actual / liveTotalRow.budgeted) * 100) : 0;
                    return [
                      <b key="label" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12 }}>Total (All)</b>,
                      <TotalCellBtn key="G" shiftKey="G" actualV={liveTotalRow.shiftG} budgetV={liveTotalRow.budgetG} />,
                      <TotalCellBtn key="A" shiftKey="A" actualV={liveTotalRow.shiftA} budgetV={liveTotalRow.budgetA} />,
                      <TotalCellBtn key="C" shiftKey="C" actualV={liveTotalRow.shiftC} budgetV={liveTotalRow.budgetC} />,
                      <TotalCellBtn key="ALL" shiftKey="ALL" actualV={liveTotalRow.actual} budgetV={liveTotalRow.budgeted} />,
                      <Stamp key="fulfill" text={`${totalFulfillPct}%`} tone={totalFulfillPct >= 100 ? "success" : totalFulfillPct >= 60 ? "accent" : "danger"} />,
                    ];
                  })()])}
                />
              </div>

              {/* Detail panel — shows drill-down for whichever cell was clicked */}
              <div style={{ flex: 1 }}>
                <Card style={{ padding: 10, background: C.bg }}>
                  {!liveSelected || !liveSelectedRow ? (
                    <div style={{ textAlign: "center", padding: "20px 6px", color: C.inkSoft, fontFamily: bodyFont, fontSize: 11.5 }}>
                      Click any cell to see who's on it.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 4 }}>
                        {liveSelected.designation === "ALL" ? "All Designations" : liveSelected.designation} — {LIVE_SHIFT_LABEL[liveSelected.shift]}
                      </div>
                      <div style={{ display: "flex", gap: 12, marginBottom: 8, fontFamily: bodyFont, fontSize: 11, color: C.inkSoft }}>
                        <span>Actual: <b style={{ color: C.success }}>{liveSelected.shift === "ALL" ? liveSelectedRow.actual : liveSelectedRow[`shift${liveSelected.shift}`]}</b></span>
                        <span>Budget: <b style={{ color: C.ink }}>{liveSelected.shift === "ALL" ? liveSelectedRow.budgeted : liveSelectedRow[`budget${liveSelected.shift}`]}</b></span>
                      </div>
                      {asOfDate !== "2026-07-22" && (
                        <div style={{ fontFamily: bodyFont, fontSize: 10, color: C.inkSoft, background: C.accentTint, padding: "5px 8px", borderRadius: 6, marginBottom: 8 }}>
                          Estimated roster for {asOfDate} — only today's punch data is exact.
                        </div>
                      )}
                      {liveSelectedList.length === 0 ? (
                        <div style={{ textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 11.5, padding: 10 }}>No one punched in.</div>
                      ) : (
                        liveSelectedList.map(e => (
                          <div key={e.code + (e.shift || "")} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 11.5 }}>{e.name}</span>
                              <span style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft }}>{e.time}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: monoFont, fontSize: 10, color: C.inkSoft }}>
                              <span>{e.code} · {e.designation}</span><span>Shift {e.shift}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </Card>
              </div>
            </div>
          </Card>
          <Card style={{ flex: 1.4 }}>
            <SectionLabel>Cost by Designation</SectionLabel>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginBottom: 10 }}>
              Each bar is the full monthly budgeted cost. The dark segment is what's been accrued so far this month, calculated as Present × (Monthly Rate ÷ 30) per day.
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={costByDesignation} layout="vertical" margin={{ left: 20, right: 12 }} barCategoryGap={14} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fontFamily: bodyFont, fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="designation" width={140} tick={{ fontFamily: bodyFont, fontSize: 11.5, fontWeight: 500 }} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontFamily: bodyFont, fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
                <Legend wrapperStyle={{ fontFamily: bodyFont, fontSize: 11.5 }} />
                <Bar dataKey="accruedCost" name="Accrued (Till Date)" stackId="cost" fill="#6B3FA0" radius={[4, 0, 0, 4]}>
                  <LabelList dataKey="accruedCost" position="center" formatter={(v) => v > 0 ? `₹${(v / 1000).toFixed(1)}k` : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#fff", fontWeight: 600 }} />
                </Bar>
                <Bar dataKey="remainingCost" name="Remaining of Budget" stackId="cost" fill="#E4D6F0" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="remainingCost" position="center" formatter={(v) => v > 0 ? `₹${(v / 1000).toFixed(1)}k` : ""} style={{ fontFamily: bodyFont, fontSize: 10, fill: "#6B3FA0", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10 }}>
              <Table
                columns={["Designation", "Headcount", "Monthly Cost", "Cost (Till Date)", "% Used"]}
                rows={costByDesignation.map(c => {
                  const pctUsed = c.cost ? Math.round((c.accruedCost / c.cost) * 100) : 0;
                  return [
                    c.designation, c.headcount, `₹${c.cost.toLocaleString("en-IN")}`, `₹${c.accruedCost.toLocaleString("en-IN")}`,
                    <Stamp key={c.designation} text={`${pctUsed}%`} tone={pctUsed >= 90 ? "danger" : pctUsed >= 60 ? "accent" : "success"} />,
                  ];
                })}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, marginTop: 10 }}>
              <span>Monthly Total: <b style={{ color: C.ink }}>₹{siteDesignationCostTotal.toLocaleString("en-IN")}</b></span>
              <span>Accrued Till Date: <b style={{ color: C.ink }}>₹{siteDesignationAccruedTotal.toLocaleString("en-IN")}</b></span>
            </div>
          </Card>
        </div>
      )}

      {selectedSite === "All" && (
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <Card style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <SectionLabel>Sites</SectionLabel>
              <Field2 label="Date"><input type="date" min="2026-06-23" max="2026-07-22" style={{ ...inputStyle, width: 140 }} value={sitesDate} onChange={e => setSitesDate(e.target.value)} /></Field2>
            </div>
            <Table
              columns={["Site", "Budget", "Present", "Absent", "Present %", "OT Applied"]}
              rows={SITES.map(s => {
                const { budget, present, absent, pct } = getSiteAttendanceSummary(s.name, sitesDate);
                const otApplied = otReportSeed.filter(r => r.site === s.name && r.dateISO === sitesDate).reduce((sum, r) => sum + r.otApplied, 0);
                return [
                  s.name, budget, present, absent,
                  <Stamp key={s.id} text={`${pct}%`} tone={pct >= 90 ? "success" : pct >= 70 ? "accent" : "danger"} />,
                  hoursToHHMM(otApplied),
                ];
              })}
            />
          </Card>
        </div>
      )}

      <div style={{ display: "flex", gap: 16 }}>
          <Card style={{ flex: 1.3 }}>
            <SectionLabel>Escalations</SectionLabel>
            {(() => {
              const openEsc = escalationsReportData.filter(e => e.status === "Open" && (selectedSite === "All" ? true : e.site === selectedSite));
              const byType = Object.values(
                openEsc.reduce((acc, e) => {
                  if (!acc[e.type]) acc[e.type] = { name: e.type, value: 0 };
                  acc[e.type].value += 1;
                  return acc;
                }, {})
              );
              const avgDaysOpen = openEsc.length ? Math.round(openEsc.reduce((s, e) => s + e.daysToResolve, 0) / openEsc.length) : 0;
              const ESC_COLORS = [C.danger, C.accentDeep, C.primary, "#6B3FA0", "#1F7A6C"];
              return openEsc.length === 0 ? (
                <div style={{ padding: "24px 8px", textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No open escalations{selectedSite !== "All" ? " at this site" : ""}.</div>
              ) : (
                <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
                    <ResponsiveContainer width={108} height={108}>
                      <PieChart>
                        <Pie data={byType} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={3}>
                          {byType.map((entry, i) => <Cell key={i} fill={ESC_COLORS[i % ESC_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.ink }}>{openEsc.length}</div>
                      <div style={{ fontFamily: bodyFont, fontSize: 8.5, color: C.inkSoft }}>Open</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {byType.map((t, i) => (
                      <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 11.5, color: C.ink }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: ESC_COLORS[i % ESC_COLORS.length], flexShrink: 0 }} />
                        {t.name}: <b>{t.value}</b>
                      </div>
                    ))}
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Avg {avgDaysOpen}d open</div>
                  </div>
                </div>
              );
            })()}
            <Table
              columns={["Type", "Ref", "Site", "Days Open"]}
              rows={escalationsReportData.filter(e => e.status === "Open" && (selectedSite === "All" || e.site === selectedSite)).map(e => [e.type, e.ref, e.site, <Stamp key={e.ref} text={`${e.daysToResolve}d`} tone="danger" />])}
            />
          </Card>
          {selectedSite !== "All" && (
            <Card style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <SectionLabel>OT Summary</SectionLabel>
                <Field2 label="Date"><input type="date" style={{ ...inputStyle, width: 140 }} value={otDate} onChange={e => setOtDate(e.target.value)} /></Field2>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.ink }}>{hoursToHHMM(otTotals.applied)}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Applied OT</div>
                </div>
                <div>
                  <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.success }}>{hoursToHHMM(otTotals.actual)}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 9.5, color: C.inkSoft }}>Actual OT (System)</div>
                </div>
              </div>
              <Table
                columns={["Designation", "Applied OT", "Actual OT (System)"]}
                rows={otByDesignation.map(r => [
                  r.designation, hoursToHHMM(r.applied),
                  <Stamp key={r.designation} text={hoursToHHMM(r.actual)} tone={r.actual < r.applied ? "accent" : "success"} />,
                ])}
              />
              {otByDesignation.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 12.5 }}>No OT logged on this date.</div>
              )}
            </Card>
          )}
        </div>
    </div>
  );
}

/* ============================================================
   SITES OVERVIEW
   ============================================================ */
function SitesOverviewPage({ selectedSite }) {
  const [openSite, setOpenSite] = useState(null);
  const site = SITES.find(s => s.id === openSite);
  const sups = (name) => ORG_DIRECTORY.filter(e => e.site === name && DESIGNATION_ROLE[e.designation] === "supervisor").map(e => e.name);
  const visibleSites = selectedSite === "All" ? SITES : SITES.filter(s => s.name === selectedSite);

  return (
    <div>
      <Card>
        <SectionLabel>{selectedSite === "All" ? "All Sites" : selectedSite}</SectionLabel>
        <Table
          columns={["Site", "Supervisor(s)", "Present / Budget", "Task Completion", "Open Grievances", ""]}
          rows={visibleSites.map(s => {
            const { budget, present } = getSiteAttendanceSummary(s.name, "2026-07-22");
            return [
              s.name,
              sups(s.name).join(", ") || "Not yet assigned",
              `${present}/${budget}`,
              `${s.taskCompletion}%`,
              s.openGrievances > 0 ? <Stamp key={s.id} text={s.openGrievances} tone="danger" /> : <Stamp key={s.id} text="0" tone="success" />,
              <button key={"btn" + s.id} onClick={() => setOpenSite(s.id)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
            ];
          })}
        />
      </Card>

      {site && (() => {
        const { budget, present, absent } = getSiteAttendanceSummary(site.name, "2026-07-22");
        return (
        <Modal title={site.name} onClose={() => setOpenSite(null)}>
          {[
            ["Supervisors", sups(site.name).join(", ") || "Not yet assigned"],
            ["Budgeted Headcount", budget],
            ["Present Today", present],
            ["Absent (incl. WO/Leave)", absent],
            ["Task Completion", `${site.taskCompletion}%`],
            ["Open Grievances", site.openGrievances],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontFamily: bodyFont, fontSize: 13.5 }}>
              <span style={{ color: C.inkSoft }}>{k}</span><b>{v}</b>
            </div>
          ))}
        </Modal>
        );
      })()}
    </div>
  );
}

/* ============================================================
   SUPERVISOR RATINGS
   ============================================================ */
function SupervisorRatingsPage({ selectedSite }) {
  const [tab, setTab] = useState("rating");
  const [scorecard, setScorecard] = useState(SUPERVISOR_SCORECARD);
  const visibleScorecard = selectedSite === "All"
    ? scorecard
    : scorecard.filter(s => ORG_DIRECTORY.some(e => e.name === s.name && e.site === selectedSite));
  const [designation, setDesignation] = useState(SUPERVISOR_DESIGNATIONS[0]);
  const namesForDesignation = scorecard.filter(s => s.designation === designation);
  const [name, setName] = useState(namesForDesignation[0]?.name || "");
  const [rating, setRating] = useState(4);
  const [duration, setDuration] = useState("Monthly");
  const [remark, setRemark] = useState("");
  const [justRated, setJustRated] = useState(false);
  const [openName, setOpenName] = useState(null);
  const openSup = scorecard.find(s => s.name === openName);

  const submit = () => {
    setScorecard(prev => prev.map(s => s.name === name ? { ...s, rating: Number(rating) } : s));
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

      {tab === "rating" && (
        <Card style={{ maxWidth: 460 }}>
          {justRated ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <Stamp text="Rating Submitted" tone="success" />
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginTop: 12, marginBottom: 16 }}>
                {name}'s {duration} rating is now {rating}/5.
              </div>
              <PrimaryButton full onClick={() => setJustRated(false)}>Rate Another</PrimaryButton>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field2 label="Designation">
                <select style={{ ...selectStyle, width: "100%" }} value={designation} onChange={e => {
                  setDesignation(e.target.value);
                  const first = scorecard.find(s => s.designation === e.target.value);
                  setName(first?.name || "");
                }}>
                  {SUPERVISOR_DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field2>
              <Field2 label="Select Name">
                <select style={{ ...selectStyle, width: "100%" }} value={name} onChange={e => setName(e.target.value)}>
                  {namesForDesignation.map(s => <option key={s.name}>{s.name}</option>)}
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
              <PrimaryButton full disabled={!name} onClick={submit}>Submit</PrimaryButton>
            </div>
          )}
        </Card>
      )}

      {tab === "scorecard" && (
        <Card>
          <SectionLabel>{selectedSite === "All" ? "All Supervisors" : `Supervisors at ${selectedSite}`}</SectionLabel>
          <Table
            columns={["Supervisor", "Sites", "Headcount", "Attendance", "Task Completion", "Avg Resolution", "Rating", ""]}
            rows={visibleScorecard.map(s => [
              s.name, s.sites, s.headcount, `${s.attendancePct}%`, `${s.taskCompletionPct}%`, `${s.avgResolutionDays}d`,
              <span key={s.name} style={{ fontFamily: displayFont, fontWeight: 700, color: C.accentDeep }}>{s.rating}</span>,
              <button key={"v" + s.name} onClick={() => setOpenName(s.name)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
            ])}
          />
        </Card>
      )}

      {openSup && (
        <Modal title={openSup.name} onClose={() => setOpenName(null)}>
          {[
            ["Designation", openSup.designation], ["Sites Managed", openSup.sites], ["Total Headcount", openSup.headcount],
            ["Attendance", `${openSup.attendancePct}%`], ["Task Completion", `${openSup.taskCompletionPct}%`],
            ["Avg Grievance Resolution", `${openSup.avgResolutionDays} days`], ["Rating", `${openSup.rating} / 5`],
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

/* ============================================================
   EMPLOYEE DIRECTORY
   ============================================================ */
function EmployeeDirectoryPage({ selectedSite }) {
  const [query, setQuery] = useState("");
  const [openCode, setOpenCode] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError("");
    supabaseClient
      .from("employees")
      .select("*, sites(name), designations(name)")
      .then(({ data, error }) => {
        if (cancelled) return;
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
    return () => { cancelled = true; };
  }, []);

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
        <Field2 label="Search by name, code, or designation">
          <input style={inputStyle} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Ramesh, EMP-2291, Technician" />
        </Field2>
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
function CompliancePage({ selectedSite }) {
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const [activeCategory, setActiveCategory] = useState(null);

  const siteEmployees = selectedSite === "All" ? ORG_DIRECTORY : ORG_DIRECTORY.filter(e => e.site === selectedSite);
  const sitePending = selectedSite === "All" ? COMPLIANCE_PENDING_ITEMS : COMPLIANCE_PENDING_ITEMS.filter(p => p.site === selectedSite);
  const totalHere = siteEmployees.length;
  const countPending = (cat) => sitePending.filter(p => p.category === cat).length;

  const rows = selectedSite === "All"
    ? [
        { key: "bgv", label: "BGV Verified", done: COMPLIANCE_SUMMARY.bgvVerified, total: COMPLIANCE_SUMMARY.bgvTotal },
        { key: "docs", label: "Document Compliance", done: COMPLIANCE_SUMMARY.docsComplete, total: COMPLIANCE_SUMMARY.docsTotal },
        { key: "pfEsi", label: "PF / ESI Compliant", done: COMPLIANCE_SUMMARY.pfEsiCompliant, total: COMPLIANCE_SUMMARY.pfEsiTotal },
      ]
    : [
        { key: "bgv", label: "BGV Verified", done: totalHere - countPending("bgv"), total: totalHere },
        { key: "docs", label: "Document Compliance", done: totalHere - countPending("docs"), total: totalHere },
        { key: "pfEsi", label: "PF / ESI Compliant", done: totalHere - countPending("pfEsi"), total: totalHere },
      ];
  const visible = activeCategory ? sitePending.filter(p => p.category === activeCategory) : sitePending;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {rows.map(r => (
          <button key={r.key} onClick={() => setActiveCategory(activeCategory === r.key ? null : r.key)} style={{ flex: 1, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
            <Card style={{ border: `1.5px solid ${activeCategory === r.key ? C.primary : "rgba(228,224,212,0.6)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13.5 }}>{r.label}</div>
                <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 17, color: pct(r.done, r.total) >= 90 ? C.success : C.accentDeep }}>{pct(r.done, r.total)}%</div>
              </div>
              <div style={{ background: "#ECEAE1", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${pct(r.done, r.total)}%`, height: "100%", background: pct(r.done, r.total) >= 90 ? C.success : C.accent }} />
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft }}>{r.done} of {r.total} · tap to filter</div>
            </Card>
          </button>
        ))}
      </div>
      <Card>
        <SectionLabel>{activeCategory ? `${rows.find(r => r.key === activeCategory).label} — Remaining` : "All Pending Items"} {selectedSite !== "All" && `(${selectedSite})`}</SectionLabel>
        <Table
          columns={["S.No", "Name", "Code", "Site", "Issue"]}
          rows={visible.map((p, i) => [i + 1, p.name, p.code, p.site, <Stamp key={i} text={p.issue} tone="accent" />])}
        />
        {visible.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>Everyone here is compliant.</div>}
      </Card>
    </div>
  );
}

/* ============================================================
   ESCALATIONS
   ============================================================ */
function EscalationsPage({ selectedSite }) {
  const [sent, setSent] = useState({});
  const visible = selectedSite === "All" ? escalationsSeed : escalationsSeed.filter(e => e.site === selectedSite);
  return (
    <Card>
      <SectionLabel>{selectedSite === "All" ? "Open Escalations" : `Open Escalations — ${selectedSite}`}</SectionLabel>
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
            <SectionLabel>Awaiting Your Sign-off (already approved by Supervisor)</SectionLabel>
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
function AddLocationPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(150);
  const [budget, setBudget] = useState(10);
  const [justAdded, setJustAdded] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6));
    });
  };
  const canSubmit = name && address && lat && lng;
  const submit = () => {
    SITES.push({ id: Math.max(...SITES.map(s => s.id)) + 1, name, address, lat: Number(lat), lng: Number(lng), radiusMeters: Number(radius), budget: Number(budget), present: 0, absent: 0, onLeave: 0, weekOff: 0, taskCompletion: 0, openGrievances: 0, cost: 0 });
    setJustAdded(true);
  };

  return (
    <Card style={{ maxWidth: 480 }}>
      {justAdded ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Stamp text="Location Added" tone="success" />
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginTop: 12, marginBottom: 16 }}>{name} is now live in Sites Overview.</div>
          <PrimaryButton full onClick={() => setJustAdded(false)}>Add Another</PrimaryButton>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field2 label="Site Name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cyber Hub — Tower D" /></Field2>
          <Field2 label="Address"><textarea style={{ ...inputStyle, minHeight: 60 }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full site address" /></Field2>
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
          <Field2 label="Budgeted Headcount"><input type="number" style={inputStyle} value={budget} onChange={e => setBudget(e.target.value)} /></Field2>
          <PrimaryButton full disabled={!canSubmit} onClick={submit}>Add Location</PrimaryButton>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   RATE CHART
   ============================================================ */
/* ============================================================
   BILLING
   ============================================================ */
function BillingPage({ selectedSite }) {
  const [period, setPeriod] = useState(BILLING_PERIODS[BILLING_PERIODS.length - 1]);
  const [openInvoiceNo, setOpenInvoiceNo] = useState(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const openInvoice = billingSeed.find(b => b.invoiceNo === openInvoiceNo);

  const scopedBills = billingSeed.filter(b => selectedSite === "All" || b.site === selectedSite);
  const periodBills = scopedBills.filter(b => b.period === period);
  const singleSiteBill = selectedSite !== "All" ? periodBills.find(b => b.site === selectedSite) : null;

  const totalBilled = periodBills.reduce((s, b) => s + b.totalAmount, 0);
  const paidAmount = periodBills.filter(b => b.status === "Paid").reduce((s, b) => s + b.totalAmount, 0);
  const pendingAmount = periodBills.filter(b => b.status === "Pending").reduce((s, b) => s + b.totalAmount, 0);
  const overdueAmount = periodBills.filter(b => b.status === "Overdue").reduce((s, b) => s + b.totalAmount, 0);

  const statusTone = (s) => s === "Paid" ? "success" : s === "Overdue" ? "danger" : "accent";

  const doExport = () => exportToExcelColored(
    "Billing_History",
    ["Invoice No", "Site", "Billing Period", "Raised On", "Due Date", "User Count", "Rate/User", "Amount", "Status"],
    scopedBills.map(b => [b.invoiceNo, b.site, b.periodLabel, b.raisedOn, b.dueDate, b.userCount, b.ratePerUser, b.totalAmount, { text: b.status, tone: statusTone(b.status) }])
  );
  const downloadInvoice = (b) => exportToExcelColored(
    `Invoice_${b.invoiceNo}`,
    ["Invoice No", "Site", "Billing Period", "Raised On", "Due Date", "User Count", "Rate per User", "Amount", "Status"],
    [[b.invoiceNo, b.site, b.periodLabel, b.raisedOn, b.dueDate, b.userCount, b.ratePerUser, b.totalAmount, { text: b.status, tone: statusTone(b.status) }]]
  );

  const historyRows = [...scopedBills]
    .filter(b => historyStatusFilter === "All" || b.status === historyStatusFilter)
    .sort((a, b) => b.period.localeCompare(a.period));

  return (
    <div>
      <ReportHeader sub="Recurring Month-on-Month SaaS billing, based on active user count per site" onDownload={doExport} />

      <Card style={{ marginBottom: 20 }}>
        <Field2 label="Billing Period">
          <select style={{ ...selectStyle, width: 220 }} value={period} onChange={e => setPeriod(e.target.value)}>
            {BILLING_PERIODS.map(p => <option key={p} value={p}>{billingPeriodLabel(p)}</option>)}
          </select>
        </Field2>
      </Card>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Kpi label="Total Billed" value={`₹${totalBilled.toLocaleString("en-IN")}`} tone="primary" sub={billingPeriodLabel(period)} />
        <Kpi label="Paid" value={`₹${paidAmount.toLocaleString("en-IN")}`} tone="success" />
        <Kpi label="Pending" value={`₹${pendingAmount.toLocaleString("en-IN")}`} tone="accent" />
        <Kpi label="Overdue" value={`₹${overdueAmount.toLocaleString("en-IN")}`} tone="danger" />
      </div>

      {singleSiteBill ? (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <SectionLabel>Invoice — {singleSiteBill.invoiceNo}</SectionLabel>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft }}>{singleSiteBill.site} · {singleSiteBill.periodLabel}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Stamp text={singleSiteBill.status} tone={statusTone(singleSiteBill.status)} />
              <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginTop: 6 }}>Raised {singleSiteBill.raisedOn} · Due {singleSiteBill.dueDate}</div>
            </div>
          </div>
          <Table
            columns={["User Count", "Rate per User (Monthly)", "Amount"]}
            rows={[[singleSiteBill.userCount, `₹${singleSiteBill.ratePerUser.toLocaleString("en-IN")}`, `₹${singleSiteBill.totalAmount.toLocaleString("en-IN")}`]]}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: `1.5px solid ${C.border}` }}>
            <div style={{ fontFamily: bodyFont, fontSize: 14, color: C.ink }}>
              Total: <b style={{ fontFamily: displayFont, fontSize: 18, color: C.primary }}>₹{singleSiteBill.totalAmount.toLocaleString("en-IN")}</b>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel>Invoices — {billingPeriodLabel(period)}</SectionLabel>
          <Table
            columns={["Site", "Invoice No", "User Count", "Amount", "Status", "Due Date"]}
            rows={periodBills.map(b => [b.site, b.invoiceNo, b.userCount, `₹${b.totalAmount.toLocaleString("en-IN")}`, <Stamp key={b.invoiceNo} text={b.status} tone={statusTone(b.status)} />, b.dueDate])}
          />
        </Card>
      )}

      <Card>
        <SectionLabel right={
          <Field2 label="Status">
            <select style={{ ...selectStyle, width: 150 }} value={historyStatusFilter} onChange={e => setHistoryStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
          </Field2>
        }>Billing History{selectedSite !== "All" ? ` — ${selectedSite}` : ""}</SectionLabel>
        <Table
          columns={["S.No", "Invoice No", "Site", "Period", "Raised On", "Due Date", "Amount", "Status", "", ""]}
          rows={historyRows.map((b, i) => [
            i + 1, b.invoiceNo, b.site, b.periodLabel, b.raisedOn, b.dueDate, `₹${b.totalAmount.toLocaleString("en-IN")}`,
            <Stamp key={b.invoiceNo} text={b.status} tone={statusTone(b.status)} />,
            <button key={"v" + b.invoiceNo} onClick={() => setOpenInvoiceNo(b.invoiceNo)} style={{
              background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px",
              fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer",
            }}>View</button>,
            <button key={"i" + b.invoiceNo} onClick={() => downloadInvoice(b)} style={{
              display: "flex", alignItems: "center", gap: 5, background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px",
              fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer",
            }}><FileText size={12} /> Invoice</button>,
          ])}
        />
        {historyRows.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", fontFamily: bodyFont, fontSize: 13, color: C.inkSoft }}>No invoices match this status.</div>
        )}
      </Card>

      {openInvoice && (
        <Modal title={`Invoice — ${openInvoice.invoiceNo}`} onClose={() => setOpenInvoiceNo(null)} width={520}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.inkSoft }}>{openInvoice.site} · {openInvoice.periodLabel}</div>
            <div style={{ textAlign: "right" }}>
              <Stamp text={openInvoice.status} tone={statusTone(openInvoice.status)} />
              <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginTop: 6 }}>Raised {openInvoice.raisedOn} · Due {openInvoice.dueDate}</div>
            </div>
          </div>
          <Table
            columns={["User Count", "Rate per User (Monthly)", "Amount"]}
            rows={[[openInvoice.userCount, `₹${openInvoice.ratePerUser.toLocaleString("en-IN")}`, `₹${openInvoice.totalAmount.toLocaleString("en-IN")}`]]}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: `1.5px solid ${C.border}` }}>
            <div style={{ fontFamily: bodyFont, fontSize: 14, color: C.ink }}>
              Total: <b style={{ fontFamily: displayFont, fontSize: 18, color: C.primary }}>₹{openInvoice.totalAmount.toLocaleString("en-IN")}</b>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RateChartPage({ rates, setRates, selectedSite }) {
  const site = selectedSite === "All" ? SITES[0].name : selectedSite;
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [draft, setDraft] = useState("");

  const siteRates = rates.filter(r => r.site === site);
  const save = () => {
    setRates(rates.map(r => (r.site === site && r.designation === editingDesignation) ? { ...r, monthlyRate: Number(draft) || 0 } : r));
    setEditingDesignation(null);
  };

  return (
    <div>
      {selectedSite === "All" && (
        <Card style={{ marginBottom: 16, background: C.accentTint, border: `1px solid ${C.accent}55` }}>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.ink }}>
            Rates are set per site. Showing <b>{site}</b> — pick a specific site from the top bar to edit a different one.
          </div>
        </Card>
      )}
      <Card>
        <SectionLabel>Rates by Designation — {site}</SectionLabel>
        <Table
          columns={["Designation", "Monthly Rate"]}
          rows={siteRates.map(r => [
            r.designation,
            editingDesignation === r.designation ? (
              <div key={r.designation} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="number" style={{ ...inputStyle, width: 100 }} value={draft} onChange={e => setDraft(e.target.value)} />
                <button onClick={save} style={{ background: C.primary, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}><Check size={13} color="#fff" /></button>
              </div>
            ) : (
              <button key={r.designation} onClick={() => { setEditingDesignation(r.designation); setDraft(String(r.monthlyRate)); }} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <span style={{ fontFamily: displayFont, fontWeight: 700 }}>₹{r.monthlyRate.toLocaleString("en-IN")}</span>
                <Pencil size={12} color={C.inkSoft} />
              </button>
            ),
          ])}
        />
      </Card>

    </div>
  );
}

/* ============================================================
   SHIFT BUDGET
   ============================================================ */
/* ============================================================
   COST — Budgeted vs Actual (attendance-based) + OT, per site
   ============================================================ */
function avgSiteRate(siteName, rates) {
  const siteRates = rates.filter(r => r.site === siteName);
  if (!siteRates.length) return 0;
  return siteRates.reduce((s, r) => s + r.monthlyRate, 0) / siteRates.length;
}

function CostPage({ rates, selectedSite }) {
  const sitesToShow = selectedSite === "All" ? SITES : SITES.filter(s => s.name === selectedSite);
  const rows = sitesToShow.map(s => {
    const { budget, present } = getSiteAttendanceSummary(s.name, "2026-07-22");
    const budgetedCost = Math.round(avgSiteRate(s.name, rates) * budget);
    const attendanceCost = Math.round(budgetedCost * (budget ? present / budget : 0));
    const ot = otCostSeed.find(o => o.site === s.name);
    const otCost = ot ? ot.otCost : 0;
    const totalActual = attendanceCost + otCost;
    return { site: s.name, budgetedCost, attendanceCost, otCost, otHours: ot?.otHours || 0, totalActual, variance: totalActual - budgetedCost };
  });
  const totalBudgeted = rows.reduce((s, r) => s + r.budgetedCost, 0);
  const totalActual = rows.reduce((s, r) => s + r.totalActual, 0);
  const totalOt = rows.reduce((s, r) => s + r.otCost, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Kpi label="Total Budgeted Cost" value={`₹${(totalBudgeted / 100000).toFixed(1)}L`} tone="primary" />
        <Kpi label="Total Actual Cost" value={`₹${(totalActual / 100000).toFixed(1)}L`} tone={totalActual > totalBudgeted ? "danger" : "success"} />
        <Kpi label="Total OT Cost" value={`₹${totalOt.toLocaleString("en-IN")}`} tone="accent" />
        <Kpi label="Variance" value={`${totalActual >= totalBudgeted ? "+" : ""}₹${(totalActual - totalBudgeted).toLocaleString("en-IN")}`} tone={totalActual > totalBudgeted ? "danger" : "success"} />
      </div>
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Budgeted vs Actual by Site</SectionLabel>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="site" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} interval={0} angle={-12} textAnchor="end" height={60} />
            <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
            <Bar dataKey="budgetedCost" name="Budgeted" fill={C.primaryTint} stroke={C.primary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalActual" name="Actual (incl. OT)" fill={C.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SectionLabel>Cost Detail by Site</SectionLabel>
        <Table
          columns={["Site", "Budgeted Cost", "Actual (Attendance)", "OT Hours", "OT Cost", "Total Actual", "Variance"]}
          rows={rows.map(r => [
            r.site,
            `₹${r.budgetedCost.toLocaleString("en-IN")}`,
            `₹${r.attendanceCost.toLocaleString("en-IN")}`,
            r.otHours,
            `₹${r.otCost.toLocaleString("en-IN")}`,
            <b key={r.site}>₹{r.totalActual.toLocaleString("en-IN")}</b>,
            <Stamp key={"v" + r.site} text={`${r.variance >= 0 ? "+" : ""}₹${r.variance.toLocaleString("en-IN")}`} tone={r.variance > 0 ? "danger" : "success"} />,
          ])}
        />
      </Card>
    </div>
  );
}

/* ============================================================
   RAISE TICKET — Master Admin raises a ticket to a Supervisor
   ============================================================ */
let lastTicketSeq = 300;
function nextTicketId() { lastTicketSeq += 1; return `MT-${lastTicketSeq}`; }

function RaiseTicketPage() {
  const [supervisor, setSupervisor] = useState(SUPERVISOR_SCORECARD[0].name);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("P2");
  const [tickets, setTickets] = useState([]);

  const canSubmit = subject && description;
  const submit = () => {
    setTickets([{ id: nextTicketId(), supervisor, subject, description, priority, date: "22 Jul 2026", status: "Open" }, ...tickets]);
    setSubject(""); setDescription("");
  };

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Card style={{ width: 420, flexShrink: 0 }}>
        <SectionLabel>Raise a Ticket</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field2 label="Send To (Supervisor)">
            <select style={{ ...selectStyle, width: "100%" }} value={supervisor} onChange={e => setSupervisor(e.target.value)}>
              {SUPERVISOR_SCORECARD.map(s => <option key={s.name}>{s.name} — {s.designation}</option>)}
            </select>
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
function exportToExcel(filename, columns, rows) {
  const data = [columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// The free (community) build of the xlsx/SheetJS library — the only Excel library
// available in this environment — silently drops cell colors/styles when writing real
// .xlsx files; verified directly (wrote a styled file, inspected styles.xml, found zero
// style data despite no errors). Full style support is a paid-tier-only feature of that
// library. So for exports that need real background colors, we build the file as HTML
// with inline styling instead, saved with an Excel-recognized extension — Excel opens
// and renders this with full color support. (Excel may show a one-time "format doesn't
// match extension" prompt; choosing "Yes"/"Open anyway" opens it normally.)
const EXCEL_TONE_COLORS = {
  success: { bg: "#E1EFE5", color: "#3E8A5B" },
  danger: { bg: "#F7E3E1", color: "#C1473E" },
  accent: { bg: "#FBEBD4", color: "#B5721A" },
  primary: { bg: "#DCE6EE", color: "#24476B" },
  neutral: { bg: "#EEECE5", color: "#5B6670" },
};
function escapeHtmlForExcel(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// rows: each cell is either a plain value, or { text, tone } to get a colored background
// matching the on-screen Stamp colors (tone: "success" | "danger" | "accent" | "primary" | "neutral").
function exportToExcelColored(filename, columns, rows) {
  const header = columns.map(c =>
    `<th style="background:#F3F1EA;font-weight:bold;padding:6px 10px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;text-align:left;">${escapeHtmlForExcel(c)}</th>`
  ).join("");
  const body = rows.map(row => {
    const cells = row.map(cell => {
      if (cell && typeof cell === "object" && "text" in cell) {
        const t = EXCEL_TONE_COLORS[cell.tone] || EXCEL_TONE_COLORS.neutral;
        return `<td style="background:${t.bg};color:${t.color};font-weight:bold;padding:6px 10px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;">${escapeHtmlForExcel(cell.text)}</td>`;
      }
      return `<td style="padding:6px 10px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;">${escapeHtmlForExcel(cell)}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="UTF-8"></head><body><table>` +
    `<thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Calendar-format export — one row per employee, one column per date (e.g. "26-Tue"),
// with the day's status letter in each cell, matching the standard monthly attendance
// register layout (Code, Name, Location, Designation, DOJ, then a column per day).
const ATTENDANCE_LETTER_TONE = { P: "success", A: "danger", L: "accent", WO: "neutral" };
function exportAttendanceCalendar(filename, companyName, employees, dateCols, attendanceMap) {
  const dayHeaders = dateCols.map(d => `<th style="background:#F3F1EA;font-weight:bold;padding:6px 8px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;text-align:center;">${escapeHtmlForExcel(d.label)}</th>`).join("");
  const fixedHeaders = ["Employee Code", "Employee Name", "Location", "Designation", "Date of Joining"]
    .map(h => `<th style="background:#F3F1EA;font-weight:bold;padding:6px 10px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;text-align:left;">${escapeHtmlForExcel(h)}</th>`).join("");
  const summaryHeaders = ["Present", "Absent", "Leave", "WO"]
    .map(h => `<th style="background:#F3F1EA;font-weight:bold;padding:6px 10px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;text-align:center;">${escapeHtmlForExcel(h)}</th>`).join("");

  const bodyRows = employees.map(e => {
    const days = dateCols.map(d => (attendanceMap[e.code] && attendanceMap[e.code][d.dateISO]) || "");
    const count = (letter) => days.filter(d => d === letter).length;
    const fixedCells = [
      e.code, e.name, e.site, e.designation,
      new Date(e.doj).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-"),
    ].map(v => `<td style="padding:6px 10px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;white-space:nowrap;">${escapeHtmlForExcel(v)}</td>`).join("");
    const dayCells = days.map(letter => {
      const t = EXCEL_TONE_COLORS[ATTENDANCE_LETTER_TONE[letter]] || { bg: "#fff", color: "#000" };
      return `<td style="background:${t.bg};color:${t.color};font-weight:bold;text-align:center;padding:6px 8px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;">${escapeHtmlForExcel(letter)}</td>`;
    }).join("");
    const summaryCells = [count("P"), count("A"), count("L"), count("WO")]
      .map(v => `<td style="text-align:center;padding:6px 10px;border:1px solid #E4E0D4;font-family:Calibri,sans-serif;">${v}</td>`).join("");
    return `<tr>${fixedCells}${dayCells}${summaryCells}</tr>`;
  }).join("");

  const totalCols = 5 + dateCols.length + 4;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="UTF-8"></head><body><table>` +
    `<tr><td colspan="${totalCols}" style="font-weight:bold;font-size:14px;padding:6px 10px;font-family:Calibri,sans-serif;">${escapeHtmlForExcel(companyName)}</td></tr>` +
    `<thead><tr>${fixedHeaders}${dayHeaders}${summaryHeaders}</tr></thead>` +
    `<tbody>${bodyRows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ReportHeader({ title, sub, onDownload }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
      <div>
        <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft }}>{sub}</div>
      </div>
      {onDownload && (
        <button onClick={onDownload} style={{
          display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
          padding: "10px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          <FileText size={15} /> Export to Excel
        </button>
      )}
    </div>
  );
}

function ShortageReport({ selectedSite }) {
  const [fromDate, setFromDate] = useState(shortageTrendSeed[0].dateISO);
  const [toDate, setToDate] = useState(shortageTrendSeed[shortageTrendSeed.length - 1].dateISO);
  const [designationFilter, setDesignationFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All"); // "All" | "G" | "A" | "C"
  const [woChecked, setWoChecked] = useState(false);
  const [leaveChecked, setLeaveChecked] = useState(false);
  const [unit, setUnit] = useState("no"); // "no" | "pct"
  const [viewMode, setViewMode] = useState("withBudget"); // table-only: "withBudget" | "shortageOnly"
  const [tableMode, setTableMode] = useState("shortage"); // table-only: "shortage" | "surplus" | "overall"
  const [selectedPoint, setSelectedPoint] = useState(null);

  const sitesInScope = selectedSite === "All" ? SITES.map(s => s.name) : [selectedSite];
  const designationsInScope = designationFilter === "All" ? DESIGNATIONS : [designationFilter];

  // Budgeted headcount for a site+designation, from the actual assigned roster
  const budgetFor = (site, designation) => ORG_DIRECTORY.filter(e => e.site === site && e.designation === designation).length;

  // WO/Leave aren't tracked per-shift in the source data — when a specific shift is
  // selected, split the aggregate WO/Leave count proportionally to that shift's share
  // of the budget (same ratio used to split headcount itself).
  const woLeaveFor = (site, designation) => {
    const base = shortageData.find(r => r.site === site && r.designation === designation);
    return { wo: base ? base.wo : 0, leave: base ? base.leave : 0 };
  };

  // Budget + Present (before WO/Leave adjustment) for one site+designation, on one date,
  // for either a specific shift or the "All" (combined) view.
  const dayBudgetPresent = (dateISO, site, designation, shiftKey) => {
    const budgetedTotal = budgetFor(site, designation);
    if (shiftKey === "All") {
      const shifts = getPresentByShiftForDate(dateISO, site, designation, budgetedTotal);
      return { budgeted: budgetedTotal, present: shifts.G + shifts.A + shifts.C, ratio: 1 };
    }
    const budgetShifts = splitBudgetByShift(designation, budgetedTotal);
    const presentShifts = getPresentByShiftForDate(dateISO, site, designation, budgetedTotal);
    const ratio = budgetedTotal ? budgetShifts[shiftKey] / budgetedTotal : 0;
    return { budgeted: budgetShifts[shiftKey], present: presentShifts[shiftKey], ratio };
  };

  // Default: Shortage = Budget − Present (raw gap). Checking WO/Leave subtracts that
  // factor out (treated as accounted-for), split proportionally when a shift is selected.
  const shortageFor = (dateISO, site, designation, shiftKey) => {
    const { budgeted, present, ratio } = dayBudgetPresent(dateISO, site, designation, shiftKey);
    const { wo, leave } = woLeaveFor(site, designation);
    let no = budgeted - present;
    if (woChecked) no -= wo * ratio;
    if (leaveChecked) no -= leave * ratio;
    no = Math.round(no * 10) / 10;
    const pct = budgeted ? Math.round((no / budgeted) * 1000) / 10 : 0;
    return { budgeted, present, no, pct };
  };

  const excludedParts = [woChecked && "WO", leaveChecked && "Leave"].filter(Boolean);
  const metricLabel = excludedParts.length === 0 ? "Shortage" : `Shortage (excl. ${excludedParts.join(" & ")})`;

  // --- Table: pivot/matrix format — one row per Site × Designation, with each date's
  // Budget/Present/Shortage spread across columns (grouped by metric, then by date).
  const dateList = [];
  { let d = new Date(fromDate + "T00:00:00"); const end = new Date(toDate + "T00:00:00");
    while (d <= end) { dateList.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); } }
  const dateColLabel = (dISO) => {
    const d = new Date(dISO + "T00:00:00");
    return `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}`;
  };

  const matrixRows = sitesInScope.flatMap(site =>
    designationsInScope
      .map(designation => ({
        site, designation,
        perDay: dateList.map(dISO => shortageFor(dISO, site, designation, shiftFilter)),
      }))
      .filter(r => r.perDay.some(d => d.budgeted > 0)) // no budget anywhere in range = not applicable at this site, hide the row
  );
  const anyShortInRow = (r) => r.perDay.some(d => (unit === "no" ? d.no : d.pct) > 0);
  const visibleMatrixRows = matrixRows;
  const flatForKpis = matrixRows.flatMap(r => r.perDay.map(d => ({ budgeted: d.budgeted, shortageNo: d.no, shortagePct: d.pct })));
  const totalBudget = flatForKpis.reduce((s, r) => s + r.budgeted, 0);
  const totalShortageNo = flatForKpis.reduce((s, r) => s + Math.max(r.shortageNo, 0), 0);
  const avgShortagePctOverall = flatForKpis.length ? (flatForKpis.reduce((s, r) => s + Math.max(r.shortagePct, 0), 0) / flatForKpis.length).toFixed(1) : 0;
  const avgShortageNoOverall = flatForKpis.length ? (flatForKpis.reduce((s, r) => s + Math.max(r.shortageNo, 0), 0) / flatForKpis.length).toFixed(1) : 0;

  // --- Trend: one point per day, summed across the filtered sites/designations/shift ---
  const trendData = dateList.map(dISO => {
    let noSum = 0, budgetSum = 0;
    sitesInScope.forEach(site => designationsInScope.forEach(designation => {
      const r = shortageFor(dISO, site, designation, shiftFilter);
      noSum += Math.max(r.no, 0); budgetSum += r.budgeted;
    }));
    const d = new Date(dISO + "T00:00:00");
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    return {
      dateISO: dISO, date, dayName, label: `${dayName} ${date}`,
      no: Math.round(noSum * 10) / 10, budget: budgetSum,
      pct: budgetSum ? Number(((noSum / budgetSum) * 100).toFixed(1)) : 0,
    };
  });

  return (
    <div>
      <ReportHeader sub="Budgeted vs. actual headcount, by site, designation, and shift" />
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Kpi label="Total Budget" value={totalBudget} tone="primary" />
        <Kpi label={`Total ${unit === "no" ? metricLabel + " (No.)" : metricLabel + " (%)"}`} value={unit === "no" ? totalShortageNo : `${avgShortagePctOverall}%`} tone="danger" sub={selectedSite === "All" ? "Across all sites" : selectedSite} />
        <Kpi label={`Average ${unit === "no" ? "Shortage (No.)" : "Shortage (%)"}`} value={unit === "no" ? avgShortageNoOverall : `${avgShortagePctOverall}%`} tone="accent" sub="Per row, over the date range" />
        <Kpi label="Sites Affected" value={new Set(matrixRows.filter(anyShortInRow).map(r => r.site)).size} tone="accent" />
        <Kpi label="Designations Affected" value={new Set(matrixRows.filter(anyShortInRow).map(r => r.designation)).size} tone="primary" />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Filters (apply to both trend and table)</SectionLabel>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Date Range</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" style={{ ...inputStyle, width: 145 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <input type="date" style={{ ...inputStyle, width: 145 }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Designation</div>
            <select style={{ ...selectStyle, width: 180 }} value={designationFilter} onChange={e => setDesignationFilter(e.target.value)}>
              <option>All</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Shift</div>
            <select style={{ ...selectStyle, width: 140 }} value={shiftFilter} onChange={e => setShiftFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="G">G — General</option>
              <option value="A">A — Afternoon</option>
              <option value="C">C — Night</option>
            </select>
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Count as Shortage</div>
            <div style={{ display: "flex", gap: 20 }}>
              {[["wo", "Week Off (WO)", woChecked, setWoChecked], ["leave", "Leave", leaveChecked, setLeaveChecked]].map(([key, label, checked, setChecked]) => (
                <button key={key} onClick={() => setChecked(!checked)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {checked ? <CheckCircle2 size={18} color={C.primary} /> : <div style={{ width: 18, height: 18, border: `1.5px solid ${C.border}`, borderRadius: 5 }} />}
                  <span style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 500, color: C.ink }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Measure</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["no", "By No."], ["pct", "By %"]].map(([k, label]) => (
                <button key={k} onClick={() => setUnit(k)} style={{
                  padding: "7px 14px", borderRadius: 8, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600,
                  border: `1.5px solid ${unit === k ? C.primary : C.border}`, background: unit === k ? C.primaryTint : C.paper, cursor: "pointer",
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>{metricLabel} — Trend ({fromDate} to {toDate})</SectionLabel>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData} onClick={e => { if (e && e.activePayload && e.activePayload.length) setSelectedPoint(e.activePayload[0].payload); }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="label" tick={{ fontFamily: bodyFont, fontSize: 10 }} interval={Math.ceil(trendData.length / 10)} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} unit={unit === "pct" ? "%" : ""} />
            <Tooltip />
            <Line type="monotone" dataKey={unit === "no" ? "no" : "pct"} name={unit === "no" ? "Shortage (No.)" : "Shortage (%)"} stroke={C.danger} strokeWidth={2.5} dot={{ r: 3, cursor: "pointer" }} activeDot={{ r: 6, cursor: "pointer" }} />
          </LineChart>
        </ResponsiveContainer>
        {selectedPoint && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: C.dangerTint, borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 13, color: C.ink }}>
              <b>{selectedPoint.dayName}, {selectedPoint.date}</b> ({selectedPoint.dateISO})
            </span>
            <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.inkSoft }}>
              Budget: <b style={{ color: C.ink }}>{selectedPoint.budget}</b>
            </span>
            <span style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15, color: C.danger }}>
              {unit === "no" ? Math.max(selectedPoint.no, 0) : `${Math.max(selectedPoint.pct, 0)}%`}
            </span>
          </div>
        )}
      </Card>

      <Card>
        <SectionLabel right={
          <div style={{ display: "flex", gap: 6 }}>
            {[["withBudget", "With Budget"], ["shortageOnly", "Shortage Only"]].map(([k, label]) => (
              <button key={k} onClick={() => setViewMode(k)} style={{
                padding: "6px 12px", borderRadius: 8, fontFamily: bodyFont, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${viewMode === k ? C.primary : C.border}`, background: viewMode === k ? C.primaryTint : C.paper, cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        }>Report{shiftFilter !== "All" ? ` — Shift ${shiftFilter}` : ""}</SectionLabel>
        {(() => {
          const metricPrefix = tableMode === "surplus" ? "Surplus" : "Shortage";
          const cellFor = (d) => {
            const val = unit === "no" ? d.no : d.pct;
            if (tableMode === "shortage") {
              const v = Math.max(val, 0);
              return { text: unit === "no" ? `${v}` : `${v}%`, color: v > 0 ? C.danger : C.inkSoft, raw: v };
            }
            if (tableMode === "surplus") {
              const v = Math.max(-val, 0);
              return { text: unit === "no" ? `${v}` : `${v}%`, color: v > 0 ? C.primary : C.inkSoft, raw: v };
            }
            // overall
            if (val > 0) return { text: unit === "no" ? `${val}` : `${val}%`, color: C.danger, raw: val };
            if (val < 0) return { text: unit === "no" ? `+${Math.abs(val)}` : `+${Math.abs(val)}%`, color: C.primary, raw: val };
            return { text: "0", color: C.inkSoft, raw: 0 };
          };
          const showSiteCol = selectedSite === "All";
          const columns = [
            ...(showSiteCol ? ["Site"] : []),
            "Designation",
            ...(viewMode === "withBudget" ? dateList.map(d => `Budget-${dateColLabel(d)}`) : []),
            ...(viewMode === "withBudget" ? dateList.map(d => `Present-${dateColLabel(d)}`) : []),
            ...dateList.map(d => `${metricPrefix}-${dateColLabel(d)}`),
          ];
          const rows = visibleMatrixRows.map(r => [
            ...(showSiteCol ? [r.site] : []),
            r.designation,
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.budgeted) : []),
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.present) : []),
            ...r.perDay.map(d => {
              const c = cellFor(d);
              return <b style={{ color: c.color }}>{c.text}</b>;
            }),
          ]);
          const exportRows = visibleMatrixRows.map(r => [
            ...(showSiteCol ? [r.site] : []),
            r.designation,
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.budgeted) : []),
            ...(viewMode === "withBudget" ? r.perDay.map(d => d.present) : []),
            ...r.perDay.map(d => {
              const c = cellFor(d);
              const tone = c.raw > 0 ? "danger" : c.raw < 0 ? "primary" : "neutral";
              return { text: c.text, tone };
            }),
          ]);
          const doExport = () => exportToExcelColored(`Shortage_Report_${tableMode}`, columns, exportRows);

          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 500 }}>Report Type</div>
                  <select style={{ ...selectStyle, width: 160 }} value={tableMode} onChange={e => setTableMode(e.target.value)}>
                    <option value="shortage">Shortage</option>
                    <option value="surplus">Surplus</option>
                    <option value="overall">Overall</option>
                  </select>
                </div>
                <button onClick={doExport} style={{
                  display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
                  padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}><FileText size={14} /> Export to Excel</button>
              </div>
              <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <table style={{ borderCollapse: "collapse", fontFamily: bodyFont, fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      {columns.map((c, ci) => {
                        const designationColIdx = showSiteCol ? 1 : 0;
                        const frozen = ci === designationColIdx;
                        return (
                          <th key={c} style={{
                            padding: "10px 14px", fontWeight: 700, color: C.ink, fontSize: 11.5, letterSpacing: "0.03em",
                            textTransform: "uppercase", borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap",
                            position: frozen ? "sticky" : "static", left: frozen ? 0 : undefined,
                            background: "#F3F1EA", zIndex: frozen ? 2 : 1,
                            boxShadow: frozen ? "2px 0 4px rgba(0,0,0,0.06)" : "none",
                          }}>{c}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, ri) => {
                      const rowBg = ri % 2 === 1 ? "#FAF9F5" : "#FFFFFF";
                      const designationColIdx = showSiteCol ? 1 : 0;
                      return (
                        <tr key={ri}>
                          {r.map((cell, ci) => {
                            const frozen = ci === designationColIdx;
                            return (
                              <td key={ci} style={{
                                padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.ink, whiteSpace: "nowrap",
                                position: frozen ? "sticky" : "static", left: frozen ? 0 : undefined,
                                background: rowBg, zIndex: frozen ? 1 : 0,
                                boxShadow: frozen ? "2px 0 4px rgba(0,0,0,0.06)" : "none",
                              }}>{cell}</td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {visibleMatrixRows.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", fontFamily: bodyFont, fontSize: 13, color: C.inkSoft }}>No rows match this filter.</div>
              )}
              {tableMode === "overall" && (
                <div style={{ padding: "10px 4px 0", fontFamily: bodyFont, fontSize: 11, color: C.inkSoft }}>
                  A "+N" figure means more people were present than budgeted that day (surplus, not a shortage).
                </div>
              )}
            </>
          );
        })()}
      </Card>
    </div>
  );
}

function MonthlyReport() {
  const [monthIdx, setMonthIdx] = useState(monthlyReportData.length - 1);
  const m = monthlyReportData[monthIdx];

  return (
    <div>
      <ReportHeader sub="Month-over-month org performance and cost summary" onDownload={() => {}} />
      <Card style={{ marginBottom: 20 }}>
        <Field2 label="Select Month">
          <select value={monthIdx} onChange={e => setMonthIdx(Number(e.target.value))} style={selectStyle}>
            {monthlyReportData.map((row, i) => <option key={row.month} value={i}>{row.month}</option>)}
          </select>
        </Field2>
      </Card>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Kpi label="Avg Attendance" value={`${m.avgAttendance}%`} tone="success" />
        <Kpi label="Total Cost" value={`₹${(m.totalCost / 100000).toFixed(1)}L`} tone="primary" />
        <Kpi label="Avg Task Completion" value={`${m.taskCompletion}%`} tone="accent" />
        <Kpi label="Escalations Resolved" value={m.escalationsResolved} tone="primary" />
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Card style={{ flex: 1 }}>
          <SectionLabel>Attendance & Task Completion Trend</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyReportData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontFamily: bodyFont, fontSize: 11 }} />
              <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgAttendance" name="Attendance %" stroke={C.success} strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="taskCompletion" name="Task Completion %" stroke={C.accentDeep} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ flex: 1 }}>
          <SectionLabel>Cost Trend</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyReportData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontFamily: bodyFont, fontSize: 11 }} />
              <YAxis tick={{ fontFamily: bodyFont, fontSize: 12 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="totalCost" fill={C.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   ATTRITION REPORT
   ============================================================ */
/* ============================================================
   BUDGET REPORT
   ============================================================ */
function BudgetReportPage({ selectedSite }) {
  const [designationFilter, setDesignationFilter] = useState("All");
  const [fromMonth, setFromMonth] = useState(BUDGET_PERIODS[BUDGET_PERIODS.length - 6]); // last 6 months by default
  const [toMonth, setToMonth] = useState(BUDGET_PERIODS[BUDGET_PERIODS.length - 1]);
  const [searched, setSearched] = useState(false);

  const scoped = budgetHistorySeed.filter(r =>
    (selectedSite === "All" || r.site === selectedSite) &&
    (designationFilter === "All" || r.designation === designationFilter)
  );

  const fromIdx = BUDGET_PERIODS.indexOf(fromMonth);
  const toIdx = BUDGET_PERIODS.indexOf(toMonth);
  const rangePeriods = fromIdx <= toIdx ? BUDGET_PERIODS.slice(fromIdx, toIdx + 1) : [];

  // Pivot: one row per Site+Designation, one column per period in the selected range.
  // Change = last period in range minus first period in range (handles any range width,
  // not just a single month vs the one before it).
  const rowKeys = [...new Set(scoped.map(r => r.site + "|" + r.designation))];
  const matrixRows = rowKeys.map(key => {
    const [site, designation] = key.split("|");
    const byPeriod = {};
    rangePeriods.forEach(p => {
      const rec = scoped.find(r => r.site === site && r.designation === designation && r.period === p);
      byPeriod[p] = rec ? rec.budget : 0;
    });
    const first = rangePeriods.length ? byPeriod[rangePeriods[0]] : 0;
    const last = rangePeriods.length ? byPeriod[rangePeriods[rangePeriods.length - 1]] : 0;
    const change = rangePeriods.length > 1 ? last - first : null;
    return { site, designation, byPeriod, current: last, change };
  }).sort((a, b) => b.current - a.current);

  const totalCurrent = matrixRows.reduce((s, r) => s + r.current, 0);
  const totalFirst = matrixRows.reduce((s, r) => s + (rangePeriods.length ? r.byPeriod[rangePeriods[0]] : 0), 0);
  const totalChange = rangePeriods.length > 1 ? totalCurrent - totalFirst : null;
  const increased = matrixRows.filter(r => r.change > 0).length;
  const decreased = matrixRows.filter(r => r.change < 0).length;

  // Trend line — total budget across the range, for the current filter scope
  const trendData = rangePeriods.map(p => ({
    label: shortPeriodLabel(p),
    budget: matrixRows.reduce((s, r) => s + (r.byPeriod[p] || 0), 0),
  }));

  const doExport = () => exportToExcelColored(
    "Budget_Report",
    ["Site", "Designation", ...rangePeriods.map(shortPeriodLabel), "Change"],
    matrixRows.map(r => [
      r.site, r.designation, ...rangePeriods.map(p => r.byPeriod[p]),
      r.change === null
        ? { text: "—", tone: "neutral" }
        : { text: r.change > 0 ? `+${r.change}` : `${r.change}`, tone: r.change > 0 ? "primary" : r.change < 0 ? "danger" : "neutral" },
    ])
  );

  return (
    <div>
      <ReportHeader sub="Budgeted headcount over time, by designation and center" onDownload={doExport} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field2 label="From Month">
            <select style={{ ...selectStyle, width: 170 }} value={fromMonth} onChange={e => setFromMonth(e.target.value)}>
              {BUDGET_PERIODS.map(p => <option key={p} value={p}>{shortPeriodLabel(p)}</option>)}
            </select>
          </Field2>
          <Field2 label="To Month">
            <select style={{ ...selectStyle, width: 170 }} value={toMonth} onChange={e => setToMonth(e.target.value)}>
              {BUDGET_PERIODS.map(p => <option key={p} value={p}>{shortPeriodLabel(p)}</option>)}
            </select>
          </Field2>
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: 200 }} value={designationFilter} onChange={e => setDesignationFilter(e.target.value)}>
              <option>All</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
        {fromIdx > toIdx && (
          <div style={{ marginTop: 10, fontFamily: bodyFont, fontSize: 12, color: C.danger }}>"From Month" is after "To Month" — pick a valid range.</div>
        )}
      </Card>

      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see the budget report.</div>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <Kpi label="Total Budget" value={totalCurrent} tone="primary" sub={rangePeriods.length ? shortPeriodLabel(toMonth) : undefined} />
            {rangePeriods.length > 1 ? (
              <Kpi label="Change (Range)" value={totalChange > 0 ? `+${totalChange}` : `${totalChange}`} tone={totalChange > 0 ? "primary" : totalChange < 0 ? "danger" : "accent"} sub={`${shortPeriodLabel(fromMonth)} → ${shortPeriodLabel(toMonth)}`} />
            ) : (
              <Kpi label="Change (Range)" value="—" tone="neutral" sub="Pick more than one month" />
            )}
            <Kpi label="Designations Increased" value={increased} tone="primary" />
            <Kpi label="Designations Decreased" value={decreased} tone="danger" />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginBottom: 20, marginTop: -6 }}>
            <b>Change</b> = budget in the "To Month" minus budget in the "From Month" — for each Site+Designation row, and for the totals above.
            "Designations Increased/Decreased" counts how many of those rows moved up or down over the selected range (0 change doesn't count either way).
          </div>

          {rangePeriods.length > 1 && (
            <Card style={{ marginBottom: 20 }}>
              <SectionLabel>Budget Trend{selectedSite !== "All" ? ` — ${selectedSite}` : ""}{designationFilter !== "All" ? ` — ${designationFilter}` : ""}</SectionLabel>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fontFamily: bodyFont, fontSize: 10.5 }} />
                  <YAxis allowDecimals={false} tick={{ fontFamily: bodyFont, fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="budget" name="Total Budget" stroke={C.primary} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card>
            <SectionLabel>Budget — Designation & Center wise{selectedSite !== "All" ? ` — ${selectedSite}` : ""}</SectionLabel>
            <div style={{ overflowX: "auto" }}>
              <Table
                columns={[
                  ...(selectedSite === "All" ? ["Site"] : []),
                  "Designation", ...rangePeriods.map(shortPeriodLabel), "Change",
                ]}
                rows={matrixRows.map(r => [
                  ...(selectedSite === "All" ? [r.site] : []),
                  r.designation,
                  ...rangePeriods.map(p => r.byPeriod[p]),
                  r.change === null ? (
                    <span key={r.site + r.designation} style={{ color: C.inkSoft, fontFamily: bodyFont, fontSize: 12.5 }}>—</span>
                  ) : (
                    <Stamp
                      key={r.site + r.designation}
                      text={r.change > 0 ? `+${r.change}` : `${r.change}`}
                      tone={r.change > 0 ? "primary" : r.change < 0 ? "danger" : "neutral"}
                    />
                  ),
                ])}
              />
            </div>
            {matrixRows.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No budget records match this filter.</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function AttritionReportPage({ selectedSite }) {
  const [fromDate, setFromDate] = useState("2026-03-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [designation, setDesignation] = useState("All");
  const [reasonFilter, setReasonFilter] = useState("All");
  const [searched, setSearched] = useState(false);

  const REASONS = [...new Set(attritionSeed.map(r => r.reason))];

  const filtered = attritionSeed.filter(r => {
    const okDate = r.dol >= fromDate && r.dol <= toDate;
    const okSite = selectedSite === "All" || r.site === selectedSite;
    const okDesignation = designation === "All" || r.designation === designation;
    const okReason = reasonFilter === "All" || r.reason === reasonFilter;
    return okDate && okSite && okDesignation && okReason;
  });
  // True attrition excludes Structural Change exits — those aren't a
  // retention signal, so they shouldn't move the headline rate. Still visible in the
  // table/export if the Reason filter is set to show them.
  const trueAttrition = filtered.filter(r => r.reasonCategory === "Attrition");
  const structural = filtered.filter(r => r.reasonCategory === "Structural");

  const currentHeadcount = ORG_DIRECTORY.filter(e => selectedSite === "All" || e.site === selectedSite).length;
  const attritionRate = currentHeadcount ? ((trueAttrition.length / (currentHeadcount + trueAttrition.length)) * 100).toFixed(1) : "0.0";
  const avgTenure = trueAttrition.length ? Math.round(trueAttrition.reduce((s, r) => s + r.tenureMonths, 0) / trueAttrition.length) : 0;
  const voluntary = trueAttrition.filter(r => r.voluntary).length;
  const involuntary = trueAttrition.length - voluntary;

  // Monthly trend, by reason, as a % of headcount that month — scoped to the selected
  // date range. Structural exits get their own line too, kept visually distinct.
  const monthKeys = [];
  { const d = new Date(fromDate + "T00:00:00"); d.setDate(1);
    const end = new Date(toDate + "T00:00:00");
    while (d <= end) { monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); d.setMonth(d.getMonth() + 1); } }
  const monthLabel = (mk) => { const [y, m] = mk.split("-"); return new Date(`${y}-${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); };
  const reasonsForChart = reasonFilter === "All" ? REASONS : [reasonFilter];
  const trendData = monthKeys.map(mk => {
    const point = { month: monthLabel(mk) };
    reasonsForChart.forEach(reason => {
      const count = filtered.filter(r => r.reason === reason && r.dol.startsWith(mk)).length;
      point[reason] = currentHeadcount ? Number(((count / (currentHeadcount + count)) * 100).toFixed(1)) : 0;
    });
    return point;
  });
  const TREND_COLORS = [C.danger, C.accentDeep, C.primary, C.success, "#6B3FA0", "#1F7A6C", "#B5721A"];

  const doExport = () => exportToExcelColored(
    "Attrition_Report",
    ["Employee Code", "Employee Name", "Designation", "Site", "Date of Joining", "Date of Leaving", "Tenure (Months)", "Reason", "Category", "Type"],
    filtered.map(r => [r.code, r.name, r.designation, r.site, r.dojDisplay, r.dolDisplay, r.tenureMonths, r.reason, r.reasonCategory,
      { text: r.voluntary ? "Voluntary" : "Involuntary", tone: r.voluntary ? "accent" : "danger" }])
  );

  return (
    <div>
      <ReportHeader sub="Employees who have exited, with tenure and reason" onDownload={doExport} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field2 label="From date (exit)"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date (exit)"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: 180 }} value={designation} onChange={e => setDesignation(e.target.value)}>
              <option>All</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <Field2 label="Reason">
            <select style={{ ...selectStyle, width: 180 }} value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}>
              <option>All</option>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
      </Card>

      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see attrition records.</div>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <Kpi label="Total Attrition" value={trueAttrition.length} tone="danger" sub={selectedSite === "All" ? "Org-wide" : selectedSite} />
            <Kpi label="Attrition Rate" value={`${attritionRate}%`} tone="accent" sub="Excludes budget-driven exits" />
            <Kpi label="Avg Tenure" value={`${avgTenure} mo`} tone="primary" />
            <Kpi label="Voluntary" value={voluntary} tone="success" />
            <Kpi label="Involuntary" value={involuntary} tone="danger" />
            {structural.length > 0 && <Kpi label="Structural Change" value={structural.length} tone="primary" sub="Not counted in rate above" />}
          </div>

          <Card style={{ marginBottom: 20 }}>
            <SectionLabel>Attrition Trend by Reason — % of Headcount</SectionLabel>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fontFamily: bodyFont, fontSize: 11 }} />
                <YAxis tick={{ fontFamily: bodyFont, fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontFamily: bodyFont, fontSize: 11.5 }} />
                {reasonsForChart.map((reason, i) => (
                  <Line key={reason} type="monotone" dataKey={reason} stroke={TREND_COLORS[i % TREND_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <Table
              columns={["S.No", "Code", "Name", "Designation", "Site", "Date of Joining", "Date of Leaving", "Tenure", "Reason", "Type"]}
              rows={filtered.map((r, i) => [
                i + 1, r.code, r.name, r.designation, r.site, r.dojDisplay, r.dolDisplay, `${r.tenureMonths} mo`,
                r.reason,
                <Stamp key={r.code} text={r.voluntary ? "Voluntary" : "Involuntary"} tone={r.voluntary ? "accent" : "danger"} />,
              ])}
            />
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No attrition records in this range.</div>}
          </Card>
        </>
      )}
    </div>
  );
}

function EscalationsReport({ selectedSite }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const scoped = selectedSite === "All" ? escalationsReportData : escalationsReportData.filter(e => e.site === selectedSite);
  const filtered = scoped.filter(e => statusFilter === "All" || e.status === statusFilter);
  const resolved = scoped.filter(e => e.status === "Resolved");
  const avgResolution = resolved.length ? (resolved.reduce((s, e) => s + e.daysToResolve, 0) / resolved.length).toFixed(1) : "—";
  const doExport = () => exportToExcelColored(
    "Escalations_Report",
    ["Ref", "Type", "Site", "Raised On", "Resolved On", "Days", "Status"],
    filtered.map(e => [e.ref, e.type, e.site, e.raisedOn, e.resolvedOn || "—", e.daysToResolve,
      { text: e.status, tone: e.status === "Resolved" ? "success" : "danger" }])
  );

  return (
    <div>
      <ReportHeader sub="Historical view of every escalation — open and resolved" onDownload={doExport} />
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Kpi label="Total Escalations" value={scoped.length} tone="primary" />
        <Kpi label="Open" value={scoped.filter(e => e.status === "Open").length} tone="danger" />
        <Kpi label="Resolved" value={resolved.length} tone="success" />
        <Kpi label="Avg Resolution Time" value={`${avgResolution}d`} tone="accent" />
      </div>
      <Card>
        <SectionLabel right={
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, width: 140 }}>
            <option>All</option><option>Open</option><option>Resolved</option>
          </select>
        }>Escalation History</SectionLabel>
        <Table
          columns={["Ref", "Type", "Site", "Raised On", "Resolved On", "Days", "Status"]}
          rows={filtered.map(e => [
            e.ref, e.type, e.site, e.raisedOn, e.resolvedOn || "—", e.daysToResolve,
            <Stamp key={e.ref} text={e.status} tone={e.status === "Resolved" ? "success" : "danger"} />,
          ])}
        />
      </Card>
    </div>
  );
}

/* ============================================================
   ATTENDANCE REPORT
   ============================================================ */
function AttendanceReportPage({ selectedSite }) {
  const [reportTab, setReportTab] = useState("attendance");
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [designation, setDesignation] = useState("All");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [searched, setSearched] = useState(false);
  const [openCode, setOpenCode] = useState(null);

  const filtered = attendanceReportSeed.filter(r => {
    const okDate = r.dateISO >= fromDate && r.dateISO <= toDate;
    const okSite = selectedSite === "All" || r.site === selectedSite;
    const okDesignation = designation === "All" || r.designation === designation;
    const okCode = !code || r.code.toLowerCase().includes(code.toLowerCase());
    const okName = !name || r.name.toLowerCase().includes(name.toLowerCase());
    return okDate && okSite && okDesignation && okCode && okName;
  });

  // Per-employee summary — one row per employee with attendance counts for the
  // selected range, used both for the list and the Excel export.
  const summary = Object.values(
    filtered.reduce((acc, r) => {
      if (!acc[r.code]) acc[r.code] = { code: r.code, name: r.name, designation: r.designation, site: r.site, present: 0, absent: 0, leave: 0, weekOff: 0 };
      if (r.status === "P") acc[r.code].present += 1;
      else if (r.status === "A") acc[r.code].absent += 1;
      else if (r.status === "L") acc[r.code].leave += 1;
      else if (r.status === "WO") acc[r.code].weekOff += 1;
      return acc;
    }, {})
  );

  // When exactly one employee matches (e.g. searched by code), open their detail directly.
  useEffect(() => {
    if (searched && summary.length === 1) setOpenCode(summary[0].code);
  }, [searched, summary.length === 1 ? summary[0].code : null]);

  const openEmp = summary.find(s => s.code === openCode);
  const openRecords = openCode ? filtered.filter(r => r.code === openCode).sort((a, b) => b.dateISO.localeCompare(a.dateISO)) : [];

  // Export reflects whatever is currently on screen: a single employee's date-wise
  // records (with their summary appended) when drilled in, otherwise the full list.
  // Build one column per date in the selected range, labeled like "26-Tue"
  const dateCols = [];
  {
    let d = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");
    while (d <= end) {
      dateCols.push({ dateISO: d.toISOString().slice(0, 10), label: `${d.getDate()}-${d.toLocaleDateString("en-US", { weekday: "short" })}` });
      d.setDate(d.getDate() + 1);
    }
  }
  // code -> { dateISO: statusLetter }
  const attendanceMap = {};
  filtered.forEach(r => {
    if (!attendanceMap[r.code]) attendanceMap[r.code] = {};
    attendanceMap[r.code][r.dateISO] = r.status;
  });

  const doExport = () => {
    const employees = (openEmp ? [openEmp] : summary)
      .map(s => ORG_DIRECTORY.find(e => e.code === s.code))
      .filter(Boolean);
    exportAttendanceCalendar(
      openEmp ? `Attendance_${openEmp.code}` : "Attendance_Report",
      "Viewmatics",
      employees, dateCols, attendanceMap
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["attendance", "Attendance"], ["ot", "OT Report"]].map(([k, label]) => (
          <button key={k} onClick={() => setReportTab(k)} style={{
            padding: "8px 18px", borderRadius: 8, fontFamily: bodyFont, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${reportTab === k ? C.primary : C.border}`, background: reportTab === k ? C.primaryTint : C.paper, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {reportTab === "ot" ? (
        <OTReportSection selectedSite={selectedSite} />
      ) : (
      <>
      <ReportHeader sub="Day-wise attendance across every employee, filterable and exportable" onDownload={doExport} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
          <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: 180 }} value={designation} onChange={e => setDesignation(e.target.value)}>
              <option>All</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <Field2 label="Employee Code"><input style={{ ...inputStyle, width: 140 }} value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. EMP-2291" /></Field2>
          <Field2 label="Employee Name"><input style={{ ...inputStyle, width: 160 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh" /></Field2>
          <button onClick={() => { setSearched(true); setOpenCode(null); }} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
        {searched && <div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.inkSoft }}>{summary.length} employees match this filter.</div>}
      </Card>

      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see attendance records.</div>
        </Card>
      ) : openEmp ? (
        <>
          {summary.length > 1 && (
            <button onClick={() => setOpenCode(null)} style={{ background: "none", border: "none", color: C.primary, fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>
              ← Back to all {summary.length} employees
            </button>
          )}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 17, color: C.ink }}>{openEmp.name}</div>
            <div style={{ fontFamily: monoFont, fontSize: 12, color: C.inkSoft }}>{openEmp.code} · {openEmp.designation} · {openEmp.site}</div>
          </Card>
          <div style={{ display: "flex", gap: 16 }}>
            <Card style={{ flex: 1.6 }}>
              <SectionLabel>Attendance — Date-wise</SectionLabel>
              <Table
                columns={["Date", "Status", "In", "Out"]}
                rows={openRecords.map(r => [
                  r.date,
                  <Stamp key={r.dateISO} text={r.status} tone={r.status === "P" ? "success" : r.status === "A" ? "danger" : r.status === "WO" ? "neutral" : "accent"} />,
                  r.inTime, r.outTime,
                ])}
              />
            </Card>
            <Card style={{ flex: 1 }}>
              <SectionLabel>Summary</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Present", openEmp.present, "success"],
                  ["Absent", openEmp.absent, "danger"],
                  ["Leave", openEmp.leave, "accent"],
                  ["Week Off", openEmp.weekOff, "neutral"],
                ].map(([label, val, tone]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.ink }}>{label}</span>
                    <Stamp text={val} tone={tone} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <Table
            columns={["Code", "Name", "Designation", "Site", "Present", "Absent", "Leave", "WO", ""]}
            rows={summary.slice(0, 200).map(s => [
              s.code, s.name, s.designation, s.site,
              <Stamp key={s.code + "p"} text={s.present} tone="success" />,
              <Stamp key={s.code + "a"} text={s.absent} tone="danger" />,
              <Stamp key={s.code + "l"} text={s.leave} tone="accent" />,
              <Stamp key={s.code + "w"} text={s.weekOff} tone="neutral" />,
              <button key={"v" + s.code} onClick={() => setOpenCode(s.code)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
            ])}
          />
          {summary.length > 200 && (
            <div style={{ padding: 12, textAlign: "center", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft }}>
              Showing first 200 of {summary.length} — export to Excel for the full set.
            </div>
          )}
        </Card>
      )}
      </>
      )}
    </div>
  );
}

/* ============================================================
   OT REPORT (within Attendance/OT Report)
   ============================================================ */
function OTReportSection({ selectedSite }) {
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [designation, setDesignation] = useState("All");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [searched, setSearched] = useState(false);

  const filtered = otReportSeed.filter(r => {
    const okDate = r.dateISO >= fromDate && r.dateISO <= toDate;
    const okSite = selectedSite === "All" || r.site === selectedSite;
    const okDesignation = designation === "All" || r.designation === designation;
    const okCode = !code || r.code.toLowerCase().includes(code.toLowerCase());
    const okName = !name || r.name.toLowerCase().includes(name.toLowerCase());
    return okDate && okSite && okDesignation && okCode && okName;
  });

  const totalApplied = filtered.reduce((s, r) => s + r.otApplied, 0);
  const totalActualOT = filtered.reduce((s, r) => s + r.actualOT, 0);
  const variance = totalApplied - totalActualOT;

  const doExport = () => exportToExcelColored(
    "OT_Report",
    ["Employee Code", "Employee Name", "Designation", "Site", "Punch In", "Punch Out", "Shift Hr", "Actual Duty Hrs", "Additional Hr", "Applied OT", "Actual OT (System)"],
    filtered.map(r => [r.code, r.name, r.designation, r.site, r.punchIn, r.punchOut, r.shiftHrs, r.actualDutyHrs, r.additionalHrs, r.otApplied,
      { text: hoursToHHMM(r.actualOT), tone: r.actualOT < r.otApplied ? "accent" : "success" }])
  );

  return (
    <div>
      <ReportHeader sub="Overtime hours logged across every employee, filterable and exportable" onDownload={doExport} />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
          <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Designation">
            <select style={{ ...selectStyle, width: 180 }} value={designation} onChange={e => setDesignation(e.target.value)}>
              <option>All</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field2>
          <Field2 label="Employee Code"><input style={{ ...inputStyle, width: 140 }} value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. EMP-2291" /></Field2>
          <Field2 label="Employee Name"><input style={{ ...inputStyle, width: 160 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh" /></Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}><Search size={14} /> Search</button>
        </div>
      </Card>

      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see OT records.</div>
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <Kpi label="Applied OT" value={totalApplied.toFixed(1)} tone="primary" />
            <Kpi label="Actual OT (as per System)" value={hoursToHHMM(totalActualOT)} tone="success" />
            <Kpi label="Variance (Applied − Actual)" value={variance.toFixed(1)} tone={variance > 0 ? "danger" : "accent"} />
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, marginBottom: 10 }}>
            Actual OT = the smaller of Applied OT and (Actual Duty Hrs − Shift Hr) — an employee can't be paid OT for hours they didn't actually work beyond their shift.
          </div>
          <Card>
            <Table
              columns={["S.No", "Code", "Name", "Designation", "Site", "Punch In", "Punch Out", "Shift Hr", "Actual Duty Hrs", "Additional Hr", "Applied OT", "Actual OT (System)"]}
              rows={filtered.slice(0, 200).map((r, i) => [
                i + 1, r.code, r.name, r.designation, r.site, r.punchIn, r.punchOut, r.shiftHrs, r.actualDutyHrs, r.additionalHrs, r.otApplied,
                <Stamp key={r.code + r.dateISO} text={hoursToHHMM(r.actualOT)} tone={r.actualOT < r.otApplied ? "accent" : "success"} />,
              ])}
            />
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No OT records in this range.</div>}
            {filtered.length > 200 && (
              <div style={{ padding: 12, textAlign: "center", fontFamily: bodyFont, fontSize: 12, color: C.inkSoft }}>
                Showing first 200 of {filtered.length} — export to Excel for the full set.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* ============================================================
   EXPENSE REPORT
   ============================================================ */
function ExpenseReportPage({ selectedSite }) {
  const [fromDate, setFromDate] = useState("2026-06-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searched, setSearched] = useState(false);

  const filtered = expensesSeed.filter(e => {
    const okDate = e.dateISO >= fromDate && e.dateISO <= toDate;
    const okSite = selectedSite === "All" || e.site === selectedSite;
    const q = query.toLowerCase();
    const okQuery = !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q);
    const okType = typeFilter === "All" || e.type === typeFilter;
    const okStatus = statusFilter === "All" || e.status === statusFilter;
    return okDate && okSite && okQuery && okType && okStatus;
  });
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const pending = filtered.filter(e => e.status === "Pending").length;
  const approved = filtered.filter(e => e.status === "Approved").length;
  const rejected = filtered.filter(e => e.status === "Rejected").length;

  const doExport = () => exportToExcelColored(
    "Expense_Report",
    ["ID", "Employee", "Code", "Designation", "Site", "Date", "Type", "Amount", "Status", "Remark"],
    filtered.map(e => [e.id, e.name, e.code, e.designation, e.site, e.date, e.type, e.amount,
      { text: e.status, tone: e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "accent" }, e.remark])
  );

  return (
    <div>
      <ReportHeader sub="All expenses raised across the org, with status and totals" onDownload={doExport} />
      {searched && (
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <Kpi label="Total Raised" value={filtered.length} tone="primary" />
          <Kpi label="Total Amount" value={`₹${totalAmount.toLocaleString("en-IN")}`} tone="primary" />
          <Kpi label="Pending" value={pending} tone="accent" />
          <Kpi label="Approved" value={approved} tone="success" />
          <Kpi label="Rejected" value={rejected} tone="danger" />
        </div>
      )}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Search Employee"><input style={{ ...inputStyle, width: 160 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or code" /></Field2>
          <Field2 label="Expense Type">
            <select style={{ ...selectStyle, width: 180 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option>All</option>{EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field2>
          <Field2 label="Status">
            <select style={{ ...selectStyle, width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option>
            </select>
          </Field2>
          <button onClick={() => setSearched(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: C.primary, border: "none", borderRadius: 9,
            padding: "9px 16px", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 13, cursor: "pointer", alignSelf: "flex-end",
          }}><Search size={14} /> Search</button>
        </div>
      </Card>
      {!searched ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.inkSoft }}>Set your filters and click Search to see expense records.</div>
        </Card>
      ) : (
        <Card>
          <Table
            columns={["ID", "Employee", "Code", "Site", "Date", "Type", "Amount", "Status"]}
            rows={filtered.map(e => [
              e.id, e.name, e.code, e.site, e.date, e.type, `₹${e.amount.toLocaleString("en-IN")}`,
              <Stamp key={e.id} text={e.status} tone={e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "accent"} />,
            ])}
          />
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   GRIEVANCE REPORT
   ============================================================ */
function GrievanceReportPage({ selectedSite }) {
  const [fromDate, setFromDate] = useState("2026-06-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = grievanceReportSeed.filter(g => {
    const okDate = g.dateISO >= fromDate && g.dateISO <= toDate;
    const okSite = selectedSite === "All" || g.site === selectedSite;
    const okCategory = category === "All" || g.category === category;
    const okStatus = statusFilter === "All" || g.status === statusFilter;
    const q = query.toLowerCase();
    const okQuery = !q || g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
    return okDate && okSite && okCategory && okStatus && okQuery;
  });
  const open = filtered.filter(g => g.status === "Pending").length;
  const inProgress = filtered.filter(g => g.status === "In Progress").length;
  const closed = filtered.filter(g => g.status === "Closed").length;

  const doExport = () => exportToExcelColored(
    "Grievance_Report",
    ["ID", "Employee", "Code", "Designation", "Site", "Category", "Subcategory", "Date", "Priority", "Status"],
    filtered.map(g => [g.id, g.name, g.code, g.designation, g.site, g.category, g.subcategory, g.date, g.priority,
      { text: g.status, tone: g.status === "Closed" ? "success" : g.status === "In Progress" ? "accent" : "danger" }])
  );

  return (
    <div>
      <ReportHeader sub="All grievances raised across the org, with resolution status" onDownload={doExport} />
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Kpi label="Total Grievances" value={filtered.length} tone="primary" />
        <Kpi label="Pending" value={open} tone="danger" />
        <Kpi label="In Progress" value={inProgress} tone="accent" />
        <Kpi label="Closed" value={closed} tone="success" />
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
          <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
          <Field2 label="Category">
            <select style={{ ...selectStyle, width: 190 }} value={category} onChange={e => setCategory(e.target.value)}>
              <option>All</option>{GRIEVANCE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field2>
          <Field2 label="Status">
            <select style={{ ...selectStyle, width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option><option>Pending</option><option>In Progress</option><option>Closed</option>
            </select>
          </Field2>
          <Field2 label="Search Employee"><input style={{ ...inputStyle, width: 160 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or code" /></Field2>
        </div>
      </Card>
      <Card>
        <Table
          columns={["ID", "Employee", "Code", "Site", "Category", "Subcategory", "Date", "Priority", "Status"]}
          rows={filtered.map(g => [
            g.id, g.name, g.code, g.site, g.category, g.subcategory, g.date, <PriorityTag key={g.id} p={g.priority} />,
            <Stamp key={"s" + g.id} text={g.status} tone={g.status === "Closed" ? "success" : g.status === "In Progress" ? "accent" : "danger"} />,
          ])}
        />
      </Card>
    </div>
  );
}

/* ============================================================
   TASK HISTORY / OPEN TASK DETAILS
   ============================================================ */
function TaskHistoryReportPage({ selectedSite }) {
  const [tab, setTab] = useState("open");
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-07-22");
  const [openId, setOpenId] = useState(null);

  const scoped = taskSeed.filter(t => selectedSite === "All" || t.site === selectedSite);
  const openTasks = scoped.filter(t => t.status === "Open");
  const history = scoped.filter(t =>
    t.status === "Completed" && t.assignedDateISO >= fromDate && t.assignedDateISO <= toDate
  );
  const openTaskDetail = taskSeed.find(t => t.id === openId);

  const doExport = () => exportToExcelColored(
    "Task_History",
    ["ID", "Employee", "Code", "Designation", "Site", "Task", "Priority", "Assigned", "Completed", "Status"],
    history.map(t => [t.id, t.name, t.code, t.designation, t.site, t.task, t.priority, t.assignedDate, t.completedDate || "—",
      { text: t.status, tone: "success" }])
  );

  return (
    <div>
      <ReportHeader sub="Open tasks awaiting action, and completed task history" onDownload={doExport} />
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["open", `Open Tasks (${openTasks.length})`], ["history", "Task History"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "8px 16px", borderRadius: 8, fontFamily: bodyFont, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${tab === k ? C.primary : C.border}`, background: tab === k ? C.primaryTint : C.paper, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {tab === "open" && (
        <Card>
          <Table
            columns={["ID", "Employee", "Code", "Site", "Task", "Priority", "Assigned", ""]}
            rows={openTasks.map(t => [
              t.id, t.name, t.code, t.site, t.task, <PriorityTag key={t.id} p={t.priority} />, t.assignedDate,
              <button key={"v" + t.id} onClick={() => setOpenId(t.id)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer" }}>View</button>,
            ])}
          />
          {openTasks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No open tasks.</div>}
        </Card>
      )}

      {tab === "history" && (
        <>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Field2 label="From date"><input type="date" style={{ ...inputStyle, width: 150 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></Field2>
              <Field2 label="To date"><input type="date" style={{ ...inputStyle, width: 150 }} value={toDate} onChange={e => setToDate(e.target.value)} /></Field2>
            </div>
          </Card>
          <Card>
            <Table
              columns={["ID", "Employee", "Code", "Site", "Task", "Priority", "Assigned", "Completed"]}
              rows={history.map(t => [t.id, t.name, t.code, t.site, t.task, <PriorityTag key={t.id} p={t.priority} />, t.assignedDate, t.completedDate])}
            />
            {history.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.inkSoft, fontFamily: bodyFont, fontSize: 13 }}>No completed tasks in this range.</div>}
          </Card>
        </>
      )}

      {openTaskDetail && (
        <Modal title={openTaskDetail.id} onClose={() => setOpenId(null)}>
          {[
            ["Task", openTaskDetail.task], ["Employee", `${openTaskDetail.name} (${openTaskDetail.code})`],
            ["Designation", openTaskDetail.designation], ["Site", openTaskDetail.site],
            ["Priority", openTaskDetail.priority], ["Assigned On", openTaskDetail.assignedDate],
            ["Status", openTaskDetail.status],
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

/* ============================================================
   ROOT APP — sidebar shell + role switcher + page router
   ============================================================ */
function ForgotPasswordCard({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: employee code, 2: OTP, 3: new password, 4: success
  const [employeeCode, setEmployeeCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const step1Submit = () => {
    if (!employeeCode.trim()) { setError("Please enter your Employee Code."); return; }
    setError("");
    setMobile("+91 XXXXX XX210"); // masked, matches the code's registered contact on file
    setStep(2);
  };
  const otpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 3) otpRefs[i + 1].current?.focus();
  };
  const step2Submit = () => {
    if (otp.join("").length < 4) { setError("Please enter the 4-digit OTP."); return; }
    if (otp.join("") !== "1234") { setError("Incorrect OTP. Please try again."); return; }
    setError("");
    setStep(3);
  };
  const step3Submit = () => {
    if (!newPassword || !confirmPassword) { setError("Please fill in both password fields."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setStep(4);
  };

  return (
    <div style={{ width: 380, background: C.paper, borderRadius: 16, padding: "36px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.primary, letterSpacing: "0.02em" }}>VIEWMATICS</div>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, letterSpacing: "0.06em", marginTop: 2 }}>RESET PASSWORD</div>
      </div>

      {step === 1 && (
        <div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginBottom: 18, textAlign: "center" }}>Enter your Employee Code to begin resetting your password.</div>
          <div style={{ marginBottom: 6, fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>Employee Code</div>
          <input
            value={employeeCode} onChange={e => setEmployeeCode(e.target.value)} placeholder="e.g. EMP-2200"
            onKeyDown={e => e.key === "Enter" && step1Submit()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12 }}>{error}</div>}
          <button type="button" onClick={step1Submit} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Send OTP</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginBottom: 4, textAlign: "center" }}>Enter the 4-digit OTP sent to</div>
          <div style={{ fontFamily: bodyFont, fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 18, textAlign: "center" }}>{mobile}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
            {otp.map((d, i) => (
              <input
                key={i} ref={otpRefs[i]} value={d} maxLength={1}
                onChange={e => otpChange(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) otpRefs[i - 1].current?.focus(); if (e.key === "Enter") step2Submit(); }}
                style={{ width: 44, height: 50, textAlign: "center", fontSize: 20, fontFamily: displayFont, fontWeight: 700, borderRadius: 9, border: `1.5px solid ${C.border}`, outline: "none" }}
              />
            ))}
          </div>
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12, textAlign: "center" }}>{error}</div>}
          <button type="button" onClick={step2Submit} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>Verify OTP</button>
          <button type="button" onClick={() => { setOtp(["", "", "", ""]); setError(""); }} style={{ width: "100%", background: "none", border: "none", color: C.primary, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Resend OTP</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.inkSoft, marginBottom: 18, textAlign: "center" }}>Set a new password for your account.</div>
          <div style={{ marginBottom: 6, fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>New Password</div>
          <input
            type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters"
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          <div style={{ marginBottom: 6, fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500 }}>Confirm Password</div>
          <input
            type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password"
            onKeyDown={e => e.key === "Enter" && step3Submit()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12 }}>{error}</div>}
          <button type="button" onClick={step3Submit} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Reset Password</button>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={26} color={C.success} />
          </div>
          <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14.5, color: C.ink, marginBottom: 6 }}>Password reset successful</div>
          <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.inkSoft, marginBottom: 22 }}>You can now sign in with your new password.</div>
          <button type="button" onClick={onBackToLogin} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 9, padding: "12px 0", color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Back to Login</button>
        </div>
      )}

      {step < 4 && (
        <button type="button" onClick={onBackToLogin} style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: C.inkSoft, fontFamily: bodyFont, fontSize: 12.5, cursor: "pointer", marginTop: 16 }}>← Back to Login</button>
      )}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: username.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    onLogin(data.user);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  if (mode === "forgot") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.primaryDeeper, fontFamily: bodyFont }}>
        <ForgotPasswordCard onBackToLogin={() => setMode("login")} />
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
      background: C.primaryDeeper, fontFamily: bodyFont,
    }}>
      <div style={{ width: 380, background: C.paper, borderRadius: 16, padding: "36px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 22, color: C.primary, letterSpacing: "0.02em" }}>VIEWMATICS</div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.inkSoft, letterSpacing: "0.06em", marginTop: 2 }}>MASTER ADMIN DASHBOARD</div>
        </div>
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500, marginBottom: 6 }}>Email</div>
            <input
              value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. arvind.kapoor@company.com"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.inkSoft, fontWeight: 500, marginBottom: 6 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••"
                style={{ width: "100%", padding: "11px 40px 11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontFamily: bodyFont, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4,
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button type="button" onClick={() => setSavePassword(!savePassword)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {savePassword ? <CheckCircle2 size={16} color={C.primary} /> : <div style={{ width: 16, height: 16, border: `1.5px solid ${C.border}`, borderRadius: 4 }} />}
              <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.inkSoft }}>Save Password</span>
            </button>
            <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: bodyFont, fontSize: 12.5, color: C.primary, fontWeight: 600 }}>
              Forgot Password?
            </button>
          </div>
          {error && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.danger, marginBottom: 12 }}>{error}</div>}
          <button
            type="button"
            onClick={submit}
            onMouseDown={(e) => { e.preventDefault(); if (!loading) submit(); }}
            disabled={loading}
            style={{
              width: "100%", marginTop: 4, background: loading ? C.inkSoft : C.primary, border: "none", borderRadius: 9, padding: "12px 0",
              color: "#fff", fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer",
              position: "relative", zIndex: 10, pointerEvents: "auto",
            }}
          >{loading ? "Signing in..." : "Sign In"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // On page load, check if there's already a valid login (e.g. from a
    // previous visit) so people aren't forced to log in every single time.
    supabaseClient.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setCheckingSession(false);
    });
  }, []);

  if (checkingSession) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.primaryDeeper, fontFamily: bodyFont, color: "#fff", fontSize: 14 }}>
        Loading...
      </div>
    );
  }
  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;
  return <DashboardContent onSignOut={async () => { await supabaseClient.auth.signOut(); setLoggedIn(false); }} />;
}

function DashboardContent({ onSignOut }) {
  const [page, setPage] = useState("overview");
  const [rates, setRates] = useState(RATE_CHART_SEED);
  const [selectedSite, setSelectedSite] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  const identity = { name: MASTER.name, sub: MASTER.title };
  const pageTitle = NAV.find(n => n.key === page)?.label || "Overview";

  const content = useMemo(() => {
    if (page === "overview") return <MasterOverview selectedSite={selectedSite} rates={rates} />;
    if (page === "sites") return <SitesOverviewPage selectedSite={selectedSite} />;
    if (page === "supervisorRatings") return <SupervisorRatingsPage selectedSite={selectedSite} />;
    if (page === "directory") return <EmployeeDirectoryPage selectedSite={selectedSite} />;
    if (page === "compliance") return <CompliancePage selectedSite={selectedSite} />;
    if (page === "escalations") return <EscalationsPage selectedSite={selectedSite} />;
    if (page === "advanceApproval") return <AdvanceApprovalPage selectedSite={selectedSite} />;
    if (page === "expenseApproval") return <ExpenseApprovalPage selectedSite={selectedSite} />;
    if (page === "addLocation") return <AddLocationPage />;
    if (page === "rateChart") return <RateChartPage rates={rates} setRates={setRates} selectedSite={selectedSite} />;
    if (page === "billing") return <BillingPage selectedSite={selectedSite} />;
    if (page === "cost") return <CostPage rates={rates} selectedSite={selectedSite} />;
    if (page === "shiftBudget") return <ShiftBudgetPage selectedSite={selectedSite} />;
    if (page === "raiseTicket") return <RaiseTicketPage />;
    if (page === "shortageReport") return <ShortageReport selectedSite={selectedSite} />;
    if (page === "monthlyReport") return <MonthlyReport />;
    if (page === "attritionReport") return <AttritionReportPage selectedSite={selectedSite} />;
    if (page === "budgetReport") return <BudgetReportPage selectedSite={selectedSite} />;
    if (page === "escalationsReport") return <EscalationsReport selectedSite={selectedSite} />;
    if (page === "attendanceReport") return <AttendanceReportPage selectedSite={selectedSite} />;
    if (page === "expenseReport") return <ExpenseReportPage selectedSite={selectedSite} />;
    if (page === "grievanceReport") return <GrievanceReportPage selectedSite={selectedSite} />;
    if (page === "taskHistoryReport") return <TaskHistoryReportPage selectedSite={selectedSite} />;
    return <ComingSoon page={pageTitle} />;
  }, [page, rates, selectedSite]);

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: bodyFont, color: C.ink }}>
      <link rel="stylesheet" href={FONT_LINK} />

      {/* Sidebar — slim rail by default; menu button reveals the full nav as a flyout */}
      <div style={{ width: 72, background: C.primaryDeeper, display: "flex", flexDirection: "column", flexShrink: 0, alignItems: "center", position: "relative" }}>
        <div style={{ padding: "22px 0 14px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color="#fff" />
          </div>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          width: 40, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
          background: menuOpen ? C.accent : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Menu size={18} color="#fff" />
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.08)", width: "100%", display: "flex", justifyContent: "center" }}>
          <button onClick={onSignOut} title="Sign Out" style={{ background: "none", border: "none", color: "#9FB3C6", cursor: "pointer", padding: 6 }}>
            <LogOut size={17} />
          </button>
        </div>

        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
            <div style={{
              position: "absolute", top: 0, left: 72, width: 240, height: "100vh", background: C.primaryDeeper,
              zIndex: 50, boxShadow: "4px 0 20px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "22px 20px 14px" }}>
                <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 17, color: "#fff", letterSpacing: "0.02em" }}>VIEWMATICS</div>
                <div style={{ fontFamily: bodyFont, fontSize: 10, color: "#8FA6BC", letterSpacing: "0.06em" }}>MASTER ADMIN DASHBOARD</div>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 16px 12px" }} />
              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
                {NAV_SECTIONS.map((group, gi) => (
                  <div key={group.section} style={{ marginBottom: 4 }}>
                    {gi > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 4px" }} />}
                    <div style={{
                      fontFamily: bodyFont, fontWeight: 600, fontSize: 10.5, color: "#A9BCCE", letterSpacing: "0.08em",
                      padding: "6px 12px 4px", textTransform: "uppercase",
                    }}>{group.section}</div>
                    {group.items.map(n => {
                      const active = page === n.key;
                      return (
                        <button key={n.key} onClick={() => { setPage(n.key); setMenuOpen(false); }} style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                          padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer", marginBottom: 2,
                          background: active ? C.accent : "transparent", color: active ? "#fff" : "#B8C6D4",
                          fontFamily: bodyFont, fontWeight: active ? 600 : 500, fontSize: 13,
                        }}>
                          <n.icon size={16} />
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{
          height: 66, background: C.paper, borderBottom: `1px solid ${C.border}`, display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.ink }}>{pageTitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.primaryTint, borderRadius: 9, padding: "8px 12px" }}>
              <Building2 size={14} color={C.primary} />
              <select
                value={selectedSite}
                onChange={e => setSelectedSite(e.target.value)}
                style={{ border: "none", background: "none", outline: "none", fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, color: C.primary, cursor: "pointer" }}
              >
                <option value="All">All Sites</option>
                {SITES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, borderRadius: 9, padding: "8px 12px", width: 200 }}>
              <Search size={15} color={C.inkSoft} />
              <input placeholder="Search..." style={{ border: "none", background: "none", outline: "none", fontFamily: bodyFont, fontSize: 13, width: "100%", color: C.ink }} />
            </div>
            <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer" }}>
              <Bell size={19} color={C.inkSoft} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: 99, background: C.danger }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserRound size={17} color={C.primary} />
              </div>
              <div>
                <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, color: C.ink }}>{identity.name}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft }}>{identity.sub}</div>
              </div>
              <ChevronDown size={14} color={C.inkSoft} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {content}
        </div>
      </div>
    </div>
  );
}
