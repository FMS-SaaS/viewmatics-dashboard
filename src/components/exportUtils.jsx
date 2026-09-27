import { Calendar, FileText } from "lucide-react";
import { C, bodyFont } from "../theme";
import { Stamp } from "./ui";

export function exportToExcel(filename, columns, rows) {
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
export const EXCEL_TONE_COLORS = {
  success: { bg: "#E1EFE5", color: "#3E8A5B" },
  danger: { bg: "#F7E3E1", color: "#C1473E" },
  accent: { bg: "#FBEBD4", color: "#B5721A" },
  primary: { bg: "#DCE6EE", color: "#24476B" },
  neutral: { bg: "#EEECE5", color: "#5B6670" },
};
export function escapeHtmlForExcel(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// rows: each cell is either a plain value, or { text, tone } to get a colored background
// matching the on-screen Stamp colors (tone: "success" | "danger" | "accent" | "primary" | "neutral").
export function exportToExcelColored(filename, columns, rows) {
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
export const ATTENDANCE_LETTER_TONE = { P: "success", A: "danger", L: "accent", WO: "neutral" };
export function exportAttendanceCalendar(filename, companyName, employees, dateCols, attendanceMap) {
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

export function ReportHeader({ title, sub, onDownload }) {
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


