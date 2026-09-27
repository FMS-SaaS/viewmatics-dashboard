import { MOD_COLORS } from "../theme";

export const MASTER = { name: "Arvind Kapoor", title: "Operations Head — Client" };

export const SITES = [
  { id: 1, name: "DLF Cyber Hub — Tower B", budget: 30, present: 23, absent: 2, onLeave: 3, weekOff: 2, taskCompletion: 82, openGrievances: 2, cost: 742000 },
  { id: 2, name: "DLF Cyber Hub — Tower A", budget: 22, present: 19, absent: 1, onLeave: 1, weekOff: 1, taskCompletion: 91, openGrievances: 0, cost: 566000 },
  { id: 3, name: "One Horizon Center", budget: 18, present: 15, absent: 1, onLeave: 1, weekOff: 1, taskCompletion: 75, openGrievances: 3, cost: 441000 },
  { id: 4, name: "Cyber City — Block C", budget: 14, present: 12, absent: 0, onLeave: 1, weekOff: 1, taskCompletion: 88, openGrievances: 1, cost: 320000 },
];

// Per-employee punch-in status for today — used by the Live Report to show who's
// actually on site right now, by designation, per site.
export const LIVE_PUNCH_SEED = [
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
export function getLivePunch(code) {
  return LIVE_PUNCH_SEED.find(p => p.code === code) || { punchedIn: false, time: null, shift: null };
}

// Real per-designation present count for today, per site — used for Budget vs Actual
// manpower and the day-to-day cost calculation, instead of a ratio-based estimate.
export const PRESENT_TODAY_SEED = [
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
export function getPresentByShift(site, designation) {
  const row = PRESENT_TODAY_SEED.find(p => p.site === site && p.designation === designation);
  return row ? { G: row.shiftG, A: row.shiftA, C: row.shiftC } : { G: 0, A: 0, C: 0 };
}
export function getPresentToday(site, designation) {
  const { G, A, C } = getPresentByShift(site, designation);
  return G + A + C;
}
// Deterministic pseudo-random variation, seeded by date + site + designation, so the
// Budget vs Actual date filter shows different (but reproducible) attendance per day.
export function seededVariation(dateISO, site, designation, base, spread) {
  let hash = 0;
  const str = dateISO + site + designation;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 997;
  const delta = (hash % (spread * 2 + 1)) - spread;
  return Math.max(base + delta, 0);
}
export function getPresentByShiftForDate(dateISO, site, designation, budgeted) {
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

export const DESIGNATIONS = [
  "Housekeeping Supervisor", "Technical Supervisor", "Technician", "Housekeeping",
  "Pantry", "Carpenter", "Painter", "Security Supervisor", "Security", "Cafe Boy", "Gardener",
];
export const SUPERVISOR_DESIGNATIONS = ["Housekeeping Supervisor", "Technical Supervisor", "Security Supervisor"];
export const DESIGNATION_ROLE = {
  "Housekeeping Supervisor": "supervisor", "Technical Supervisor": "supervisor", "Security Supervisor": "supervisor",
  "Technician": "user", "Housekeeping": "user", "Pantry": "user", "Carpenter": "user",
  "Painter": "user", "Security": "user", "Cafe Boy": "user", "Gardener": "user",
};

export const ORG_DIRECTORY = [
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

export function calcTenure(dojISO, todayISO = null) {
  // Defaults to the real current date now, not a frozen mock date — matters
  // once real employees with real join dates exist in production.
  const doj = new Date(dojISO), today = todayISO ? new Date(todayISO) : new Date();
  let years = today.getFullYear() - doj.getFullYear();
  let months = today.getMonth() - doj.getMonth();
  if (today.getDate() < doj.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return `${years}y ${months}m`;
}

export const SUPERVISOR_SCORECARD = [
  { name: "Priya Nair", designation: "Housekeeping Supervisor", sites: 2, headcount: 44, attendancePct: 82, taskCompletionPct: 85, avgResolutionDays: 1.5, rating: 4.3 },
  { name: "Ravi Shastri", designation: "Technical Supervisor", sites: 1, headcount: 22, attendancePct: 86, taskCompletionPct: 91, avgResolutionDays: 0.8, rating: 4.6 },
  { name: "Rajendra Singh", designation: "Security Supervisor", sites: 1, headcount: 18, attendancePct: 83, taskCompletionPct: 75, avgResolutionDays: 3.2, rating: 3.7 },
];
export const RATING_DURATIONS = ["W1", "W2", "W3", "W4", "Monthly"];

export const COMPLIANCE_SUMMARY = { bgvVerified: 62, bgvTotal: 67, docsComplete: 60, docsTotal: 67, pfEsiCompliant: 65, pfEsiTotal: 67 };
export const COMPLIANCE_PENDING_ITEMS = [
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

export function advanceOverallStatus(req) {
  if (req.l1Status === "rejected" || req.l2Status === "rejected") return "Rejected";
  if (req.l1Status === "approved" && req.l2Status === "approved") return "Approved";
  return "Pending — Master Admin";
}
export const advanceRequestsSeed = [
  { id: "AD-041", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", days: 6, amount: "₹5,690", date: "20 Jul 2026", l1Status: "approved", l2Status: "pending" },
  { id: "AD-038", code: "EMP-2308", name: "Anil Yadav", designation: "Technician", days: 4, amount: "₹3,200", date: "12 Jul 2026", l1Status: "approved", l2Status: "approved" },
  { id: "AD-035", code: "EMP-2305", name: "Sita Devi", designation: "Housekeeping", days: 5, amount: "₹2,900", date: "05 Jul 2026", l1Status: "approved", l2Status: "rejected" },
];

export const EXPENSE_TYPES = ["Travel & Transportation", "Food & Meals", "Recharges", "Accommodation", "Office & Stationery", "Tools & Equipment", "Material Purchase", "Others"];
export const expensesSeed = [
  { id: "EXP-198", code: "EMP-2200", name: "Priya Nair", designation: "Housekeeping Supervisor", site: "DLF Cyber Hub — Tower B", dateISO: "2026-07-10", date: "10 Jul 2026", type: "Food & Meals", amount: 420, invoice: "invoice_food_198.jpg", remark: "Team lunch during audit visit", status: "Approved" },
  { id: "EXP-201", code: "EMP-2200", name: "Priya Nair", designation: "Housekeeping Supervisor", site: "DLF Cyber Hub — Tower B", dateISO: "2026-07-19", date: "19 Jul 2026", type: "Travel & Transportation", amount: 850, invoice: "invoice_travel_201.jpg", remark: "Cab fare — inter-site visit", status: "Pending" },
  { id: "EXP-204", code: "EMP-2201", name: "Ravi Shastri", designation: "Technical Supervisor", site: "DLF Cyber Hub — Tower A", dateISO: "2026-07-21", date: "21 Jul 2026", type: "Tools & Equipment", amount: 2100, invoice: "invoice_tools_204.jpg", remark: "Replacement multimeter", status: "Pending" },
  { id: "EXP-207", code: "EMP-2202", name: "Rajendra Singh", designation: "Security Supervisor", site: "One Horizon Center", dateISO: "2026-07-15", date: "15 Jul 2026", type: "Recharges", amount: 300, invoice: "invoice_recharge_207.jpg", remark: "Walkie-talkie top-up", status: "Approved" },
  { id: "EXP-209", code: "EMP-2200", name: "Priya Nair", designation: "Housekeeping Supervisor", site: "DLF Cyber Hub — Tower B", dateISO: "2026-07-05", date: "05 Jul 2026", type: "Material Purchase", amount: 1200, invoice: "invoice_material_209.jpg", remark: "Cleaning chemicals restock", status: "Rejected" },
  { id: "EXP-211", code: "EMP-2201", name: "Ravi Shastri", designation: "Technical Supervisor", site: "DLF Cyber Hub — Tower A", dateISO: "2026-06-28", date: "28 Jun 2026", type: "Accommodation", amount: 1800, invoice: "invoice_hotel_211.jpg", remark: "Overnight stay — night shift audit", status: "Approved" },
];

// --- Grievance dataset (dashboard-side, for the Grievance Report) ---
export const GRIEVANCE_CATEGORIES = ["Attendance", "Leave", "Salary & Benefits", "Duty & Shift", "Supervisor Related", "Uniform & PPE", "Tools & Equipment", "Health & Safety", "IT & Mobile App"];
export const grievanceReportSeed = [
  { id: "GRV-109", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", site: "DLF Cyber Hub — Tower B", category: "Salary & Benefits", subcategory: "Overtime Payment Pending", dateISO: "2026-07-02", date: "02 Jul 2026", priority: "P2", status: "Closed" },
  { id: "GRV-114", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", site: "DLF Cyber Hub — Tower B", category: "Tools & Equipment", subcategory: "Tool Damaged", dateISO: "2026-07-15", date: "15 Jul 2026", priority: "P2", status: "In Progress" },
  { id: "GRV-115", code: "EMP-2308", name: "Anil Yadav", designation: "Technician", site: "DLF Cyber Hub — Tower B", category: "Duty & Shift", subcategory: "Shift Change Request", dateISO: "2026-07-20", date: "20 Jul 2026", priority: "P3", status: "Pending" },
  { id: "GRV-118", code: "EMP-2355", name: "Vikram Rathi", designation: "Technician", site: "One Horizon Center", category: "Uniform & PPE", subcategory: "Safety Shoes Required", dateISO: "2026-07-11", date: "11 Jul 2026", priority: "P3", status: "Closed" },
  { id: "GRV-121", code: "EMP-2360", name: "Neha Joshi", designation: "Housekeeping", site: "DLF Cyber Hub — Tower A", category: "Health & Safety", subcategory: "Slip / Trip Hazard", dateISO: "2026-07-18", date: "18 Jul 2026", priority: "P1", status: "In Progress" },
  { id: "GRV-124", code: "EMP-2340", name: "Suresh Pillai", designation: "Housekeeping", site: "Cyber City — Block C", category: "IT & Mobile App", subcategory: "Attendance Not Syncing", dateISO: "2026-06-25", date: "25 Jun 2026", priority: "P3", status: "Closed" },
];

// --- Task dataset (for Task History / Open Task Details) ---
export const taskSeed = [
  { id: "TSK-501", code: "EMP-2291", name: "Ramesh Kumar", designation: "Technician", site: "DLF Cyber Hub — Tower B", task: "Inspect Fire Extinguishers – East Wing", priority: "P1", assignedDateISO: "2026-07-22", assignedDate: "22 Jul 2026", status: "Open" },
  { id: "TSK-502", code: "EMP-2308", name: "Anil Yadav", designation: "Technician", site: "DLF Cyber Hub — Tower B", task: "Check HVAC Systems – Room 304", priority: "P2", assignedDateISO: "2026-07-22", assignedDate: "22 Jul 2026", status: "Open" },
  { id: "TSK-497", code: "EMP-2305", name: "Sita Devi", designation: "Housekeeping", site: "DLF Cyber Hub — Tower B", task: "Lobby Deep Clean", priority: "P2", assignedDateISO: "2026-07-21", assignedDate: "21 Jul 2026", completedDateISO: "2026-07-21", completedDate: "21 Jul 2026", status: "Completed" },
  { id: "TSK-489", code: "EMP-2355", name: "Vikram Rathi", designation: "Technician", site: "One Horizon Center", task: "Elevator Log Check", priority: "P3", assignedDateISO: "2026-07-19", assignedDate: "19 Jul 2026", completedDateISO: "2026-07-20", completedDate: "20 Jul 2026", status: "Completed" },
  { id: "TSK-503", code: "EMP-2340", name: "Suresh Pillai", designation: "Housekeeping", site: "Cyber City — Block C", task: "Pantry Restocking", priority: "P3", assignedDateISO: "2026-07-22", assignedDate: "22 Jul 2026", status: "Open" },
  { id: "TSK-475", code: "EMP-2272", name: "Ajay Mehta", designation: "Painter", site: "One Horizon Center", task: "Wall Touch-up – Reception", priority: "P3", assignedDateISO: "2026-07-14", assignedDate: "14 Jul 2026", completedDateISO: "2026-07-16", completedDate: "16 Jul 2026", status: "Completed" },
];

// --- Attendance history (per employee, ~30 days) for the Attendance Report ---
export function generateAttendanceReport(days = 30) {
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
export const attendanceReportSeed = generateAttendanceReport(30);

// Single source of truth for a site's Budget/Present/Absent on a given date — real
// ORG_DIRECTORY headcount + real per-employee attendance status, not the old static
// SITES.present/.budget/.absent fields (which had drifted completely disconnected
// from real data). Absent = the full gap (Budget - Present), i.e. includes anyone on
// leave or week off, not split into separate categories.
export function getSiteAttendanceSummary(siteName, dateISO) {
  const budget = ORG_DIRECTORY.filter(e => e.site === siteName).length;
  const dayRecords = attendanceReportSeed.filter(r => r.site === siteName && r.dateISO === dateISO);
  const present = dayRecords.filter(r => r.status === "P").length;
  const absent = budget - present;
  return { budget, present, absent, pct: budget ? Math.round((present / budget) * 100) : 0 };
}

// OT (Overtime) records — logged on a subset of Present days across the same range
// Parses "09:03 AM" / "07:10 PM" style strings into decimal hours (e.g. 9.05, 19.17)
export function parseTimeToHours(str) {
  const m = String(str).match(/(\d+):(\d+)\s?(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + min / 60;
}
export function computeDutyHours(punchIn, punchOut) {
  const inH = parseTimeToHours(punchIn);
  const outH = parseTimeToHours(punchOut);
  if (inH === null || outH === null) return 0;
  let diff = outH - inH;
  if (diff < 0) diff += 24;
  return diff;
}
// Converts decimal hours (e.g. 2.3) into an "H:MM" duration string (e.g. "2:18")
export function hoursToHHMM(decimalHours) {
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

// Combines a date (dateISO) with a time string ("09:03 AM") into "dd/mm/yy hh:mm:ss"
export function formatPunchDateTime(dateISO, timeStr, seedSeconds) {
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

export function generateOTReport() {
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
export const otReportSeed = generateOTReport();

export const BASE_RATES = {
  "Housekeeping Supervisor": 32000, "Technical Supervisor": 34000, "Technician": 24000,
  "Housekeeping": 16000, "Pantry": 15000, "Carpenter": 20000, "Painter": 19000,
  "Security Supervisor": 30000, "Security": 18000, "Cafe Boy": 15500, "Gardener": 14000,
};
export const SITE_RATE_MULTIPLIER = {
  "DLF Cyber Hub — Tower B": 1.0, "DLF Cyber Hub — Tower A": 0.97,
  "One Horizon Center": 1.03, "Cyber City — Block C": 0.95,
};
export const RATE_CHART_SEED = SITES.flatMap(s =>
  DESIGNATIONS.map(d => ({
    site: s.name, designation: d,
    monthlyRate: Math.round((BASE_RATES[d] * (SITE_RATE_MULTIPLIER[s.name] || 1)) / 100) * 100,
  }))
);
export function computeSiteCost(siteName, rates) {
  return ORG_DIRECTORY.filter(e => e.site === siteName).reduce((sum, e) => {
    const r = rates.find(x => x.site === siteName && x.designation === e.designation);
    return sum + (r ? r.monthlyRate : 0);
  }, 0);
}

export const SHIFTS = ["Morning", "Evening", "Night"];
export const shiftBudgetSeed = [
  { site: "DLF Cyber Hub — Tower B", designation: "Housekeeping", morning: 6, evening: 4, night: 2 },
  { site: "DLF Cyber Hub — Tower B", designation: "Security", morning: 2, evening: 2, night: 2 },
  { site: "One Horizon Center", designation: "Security", morning: 3, evening: 2, night: 2 },
];
// Splits a designation's budgeted headcount across G/A/C shifts. Security-type roles need
// round-the-clock coverage; everything else is weighted toward the day (G) shift.
export function splitBudgetByShift(designation, budgeted) {
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
export const otCostSeed = [
  { site: "DLF Cyber Hub — Tower B", otHours: 48, otCost: 21600 },
  { site: "DLF Cyber Hub — Tower A", otHours: 22, otCost: 9900 },
  { site: "One Horizon Center", otHours: 36, otCost: 16200 },
  { site: "Cyber City — Block C", otHours: 14, otCost: 6300 },
];

export const escalationsSeed = [
  { id: "ESC-01", type: "Grievance", ref: "GRV-115", site: "One Horizon Center", supervisor: "Rajendra Singh", details: "Shift Change Request pending 5+ days", daysOpen: 6, priority: "P2" },
  { id: "ESC-02", type: "Advance Salary", ref: "AD-041", site: "DLF Cyber Hub — Tower B", supervisor: "Priya Nair", details: "Advance salary request pending approval 4+ days", daysOpen: 4, priority: "P3" },
];
export const costPie = SITES.map((s, i) => ({ name: s.name, value: s.cost, color: MOD_COLORS[i % MOD_COLORS.length].fg }));

/* ============================================================
   REPORTS DATA
   ============================================================ */
export const shortageDataSeed = [
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
export function generateShortageData() {
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
export const shortageData = generateShortageData();

// Daily shortage trend per site, so the chart can respond to a From/To date filter
export function generateShortageTrend(days = 30) {
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
export const shortageTrendSeed = generateShortageTrend(30);

export const monthlyReportData = [
  { month: "Apr 2026", avgAttendance: 85, totalCost: 1912000, taskCompletion: 81, escalationsResolved: 5 },
  { month: "May 2026", avgAttendance: 87, totalCost: 1980000, taskCompletion: 84, escalationsResolved: 6 },
  { month: "Jun 2026", avgAttendance: 89, totalCost: 2010000, taskCompletion: 86, escalationsResolved: 4 },
  { month: "Jul 2026", avgAttendance: 91, totalCost: 2069000, taskCompletion: 84, escalationsResolved: 5 },
];

// Attrition — employees who have exited, across the last few months
export const attritionRaw = [
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
export function monthsBetween(d1ISO, d2ISO) {
  const d1 = new Date(d1ISO + "T00:00:00"), d2 = new Date(d2ISO + "T00:00:00");
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}
// Billing — vendor raises a recurring Month-on-Month bill per site, line-itemed by
// designation (headcount x monthly rate). Covers the last 3 billing periods so there's
// real history to browse, not just the current month.
export const BILLING_PERIODS = ["2026-05", "2026-06", "2026-07"];
export function billingPeriodLabel(period) {
  const [y, m] = period.split("-");
  return new Date(`${y}-${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
export function shortPeriodLabel(period) {
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
export const BUDGET_PERIODS = (() => {
  const periods = [];
  let d = new Date("2026-07-01T00:00:00");
  for (let i = 0; i < 12; i++) {
    periods.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return periods;
})();
export function generateBudgetHistory() {
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
export const budgetHistorySeed = generateBudgetHistory();
export const RATE_PER_USER = 249; // ₹ per user, per month — the SaaS subscription price
export function generateBillingSeed() {
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
export const billingSeed = generateBillingSeed();

export const attritionSeed = attritionRaw.map(r => ({
  ...r,
  dojDisplay: new Date(r.doj).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  dolDisplay: new Date(r.dol).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  tenureMonths: monthsBetween(r.doj, r.dol),
  // "Attrition" = a real, individual exit (resigned, performance, relocation, retired,
  // contract ended). "Structural" = the role itself was eliminated (budget reduction) —
  // not counted toward the attrition rate, since it isn't a retention signal.
  reasonCategory: r.reason === "Structural Change" ? "Structural" : "Attrition",
}));

export const escalationsReportData = [
  { ref: "GRV-108", site: "DLF Cyber Hub — Tower B", type: "Grievance", raisedOn: "2026-06-10", resolvedOn: "2026-06-14", daysToResolve: 4, status: "Resolved" },
  { ref: "AD-039", site: "One Horizon Center", type: "Advance Salary", raisedOn: "2026-06-20", resolvedOn: "2026-06-25", daysToResolve: 5, status: "Resolved" },
  { ref: "GRV-111", site: "Cyber City — Block C", type: "Grievance", raisedOn: "2026-07-01", resolvedOn: "2026-07-05", daysToResolve: 4, status: "Resolved" },
  { ref: "GRV-115", site: "One Horizon Center", type: "Grievance", raisedOn: "2026-07-15", resolvedOn: null, daysToResolve: 6, status: "Open" },
  { ref: "AD-041", site: "DLF Cyber Hub — Tower B", type: "Advance Salary", raisedOn: "2026-07-18", resolvedOn: null, daysToResolve: 4, status: "Open" },
];

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */

