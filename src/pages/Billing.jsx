import { useState } from "react";
import { FileText } from "lucide-react";
import { C, displayFont, bodyFont, BILLING_PERIODS, billingPeriodLabel, billingSeed, Stamp, Card, SectionLabel, Kpi, Table, selectStyle, Field2, Modal, exportToExcelColored, ReportHeader } from "../common";

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
      <div style={{ textAlign: "right", marginBottom: 12, marginTop: -12, fontFamily: bodyFont, fontSize: 10.5, color: C.inkSoft, fontStyle: "italic" }}>
        Demo data — no invoicing table in Supabase yet
      </div>

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


export default BillingPage;
