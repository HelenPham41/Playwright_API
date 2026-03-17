import fs from "fs";
import path from "path";

const REPORT_DIR = path.join(process.cwd(), "reports");
const JSON_FILE = path.join(REPORT_DIR, "fullflow-summary.json");
const HTML_FILE = path.join(REPORT_DIR, "fullflow-summary.html");

/**
 * Remove ANSI color codes (Playwright errors)
 */
function removeAnsi(text: string) {
  if (!text) return "";
  return text.replace(/\x1B\[[0-9;]*m/g, "");
}

/**
 * Parse message to extract Status Code and URL
 */
function parseMessage(message: string) {

  let cleanMessage = message || "";
  let code = "-";
  let url = "-";

  cleanMessage = removeAnsi(cleanMessage);

  const statusMatch = cleanMessage.match(/Status:\s*(\d+)/);
  const urlMatch = cleanMessage.match(/URL:\s*(https?:\/\/[^\s]+)/);

  if (statusMatch) {
    code = statusMatch[1];
    cleanMessage = cleanMessage.replace(statusMatch[0], "");
  }

  if (urlMatch) {
    url = urlMatch[1];
    cleanMessage = cleanMessage.replace(urlMatch[0], "");
  }

  cleanMessage = cleanMessage
    .replace(/\|\s*\|/g, "|")
    .replace(/\|\s*$/, "")
    .trim();

  return {
    message: cleanMessage || "-",
    code,
    url
  };
}

/**
 * Save summary JSON
 */
export function writeFullFlowSummary(data: any[]) {

  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  fs.writeFileSync(
    JSON_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  console.log("JSON summary saved:", JSON_FILE);
}

/**
 * Generate HTML report
 */
export function generateHtmlReport() {

  if (!fs.existsSync(JSON_FILE)) {
    console.log("No summary file found.");
    return;
  }

  const results: any[] = JSON.parse(
    fs.readFileSync(JSON_FILE, "utf8")
  );

  const totalRuns = results.length;
  const totalPass = results.filter(r => r.status === "PASS").length;
  const totalFail = results.filter(r => r.status === "FAIL").length;

  const allPass = totalPass === totalRuns;

  let rows = "";

  results.forEach((r, index) => {

    const parsed = parseMessage(r.message || "");

    rows += `
    <tr>
        <td>${index + 1}</td>
        <td>${r.orderId || "-"}</td>
        <td>${r.so || "-"}</td>
        <td>${r.ticketId || "-"}</td>
        ${!allPass ? `<td>${r.step || "-"}</td>` : ``}
        <td style="color:${r.status === "PASS" ? "green" : "red"}">
            ${r.status}
        </td>
        ${!allPass ? `
        <td style="max-width:400px;text-align:left">${parsed.message}</td>
        <td>${parsed.code}</td>
        <td style="text-align:left">
            ${parsed.url !== "-" ? `<a href="${parsed.url}" target="_blank">${parsed.url}</a>` : "-"}
        </td>
        ` : ``}
    </tr>
    `;
  });

  const html = `
<html>
<head>
<title>Full Flow Summary</title>

<style>
body { font-family: Arial; padding:20px }

table {
    border-collapse: collapse;
    width:100%;
}

th,td {
    border:1px solid #ddd;
    padding:8px;
    text-align:center
}

th { background:#f4f4f4 }
</style>

</head>

<body>

<h1>Full Flow Execution Summary</h1>

<p><b>Total Runs:</b> ${totalRuns}</p>
<p style="color:green"><b>Total Pass:</b> ${totalPass}</p>
<p style="color:red"><b>Total Fail:</b> ${totalFail}</p>

<table>

<tr>
<th>Run</th>
<th>OrderId</th>
<th>SO</th>
<th>TicketId</th>
${!allPass ? `<th>Step</th>` : ``}
<th>Status</th>
${!allPass ? `<th>Message</th><th>Code</th><th>URL</th>` : ``}
</tr>

${rows}

</table>

</body>
</html>
`;

  fs.writeFileSync(HTML_FILE, html);

  console.log("HTML report generated:", HTML_FILE);
}