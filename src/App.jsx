import { useState, useEffect, useMemo } from "react";
import { UserRound, Building2, Search, Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { C, displayFont, bodyFont, FONT_LINK, MASTER, SITES, RATE_CHART_SEED, NAV_SECTIONS, NAV, ComingSoon, supabaseClient } from "./common";
import LoginPage from "./pages/auth/LoginPage";
import MasterOverview from "./pages/Overview";
import SitesOverviewPage from "./pages/SitesOverview";
import SupervisorRatingsPage from "./pages/SupervisorRatings";
import EmployeeDirectoryPage from "./pages/EmployeeDirectory";
import CompliancePage from "./pages/Compliance";
import EscalationsPage from "./pages/Escalations";
import AdvanceApprovalPage from "./pages/AdvanceApproval";
import ExpenseApprovalPage from "./pages/ExpenseApproval";
import AddLocationPage from "./pages/AddLocation";
import RateChartPage from "./pages/RateChart";
import BillingPage from "./pages/Billing";
import CostPage from "./pages/Cost";
import ShiftBudgetPage from "./pages/ShiftBudget";
import RaiseTicketPage from "./pages/RaiseTicket";
import ShortageReport from "./pages/reports/ShortageReport";
import MonthlyReport from "./pages/reports/MonthlyReport";
import BudgetReportPage from "./pages/reports/BudgetReport";
import AttritionReportPage from "./pages/reports/AttritionReport";
import EscalationsReport from "./pages/reports/EscalationsReport";
import AttendanceReportPage from "./pages/reports/AttendanceReport";
import ExpenseReportPage from "./pages/reports/ExpenseReport";
import GrievanceReportPage from "./pages/reports/GrievanceReport";
import TaskHistoryReportPage from "./pages/reports/TaskHistoryReport";

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
  // Real sites from Supabase for the topbar picker — this used to list the 4
  // mock SITES, which is why it never matched your actual site count.
  const [realSites, setRealSites] = useState([]);
  useEffect(() => {
    supabaseClient.from("sites").select("id, name").order("name").then(({ data, error }) => {
      if (!error) setRealSites(data || []);
    });
  }, []);

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
                {realSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
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