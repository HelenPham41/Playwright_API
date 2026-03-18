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

    const message = removeAnsi(r.message || "-");
    const code = r.code ?? "-";
    const url = r.url ?? "-";

    const codeColor =
      code >= 500 ? "red" :
      code >= 400 ? "orange" :
      "black";

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
        <td style="max-width:400px;text-align:left;word-break:break-word">
            ${message}
        </td>
        <td style="color:${codeColor}">
            ${code}
        </td>
        <td style="text-align:left;max-width:400px;word-break:break-all">
            ${
              url !== "-"
                ? `<a href="${url}" target="_blank">${url}</a>`
                : "-"
            }
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