import { Home, TrendingUp, Wallet, HandCoins, MessageSquareWarning, Clock, ShieldCheck, UserRound, Users, Building2, MapPin, AlertTriangle, FileText } from "lucide-react";

export const NAV_SECTIONS = [
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
export const NAV = NAV_SECTIONS.flatMap(s => s.items);

/* ============================================================
   OVERVIEW PAGE
   ============================================================ */
/* ============================================================
   LIVE ATTENDANCE — real data from Supabase, with real-time
   updates. This is deliberately separate from the mock-data
   Live Report below it, so real employees show up here
   immediately without needing every other mock dataset (site
   budgets, shift splits, etc.) to be migrated first.
   ============================================================ */

