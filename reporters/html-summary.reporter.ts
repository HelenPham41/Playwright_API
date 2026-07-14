import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const MAX_REPORTS = parseInt(process.env.MAX_REPORTS ?? '10');
const REPORT_DIR  = 'reports';

interface StepRecord {
  title:    string;
  status:   'PASSED' | 'FAILED';
  duration: number;   // seconds
  error:    string;
}

interface RunRecord {
  index:        number;
  testName:     string;
  country:      string;
  baseUrl:      string;
  status:       'PASS' | 'FAIL';
  orderId:      string;
  so:           string;
  bin:          string;
  sku:          string;
  errorStep:    string;
  errorCode:    string;
  errorUrl:     string;
  errorMessage: string;
  duration:     number;   // seconds
  steps:        StepRecord[];
  httpLog:      any[];
}

export default class HtmlSummaryReporter implements Reporter {
  private records:   RunRecord[] = [];
  private runIndex   = 0;
  private startTime  = new Date();

  onBegin() {
    this.startTime = new Date();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.runIndex++;
    const ann    = (type: string) => test.annotations.find(a => a.type === type)?.description ?? '-';
    const status = result.status === 'passed' ? 'PASS' : 'FAIL';

    // Parse ApiError format: "[step] HTTP status — url\nBody: body"
    const errMsg    = result.errors[0]?.message ?? '';
    const clean     = (s: string) => s.replace(/\x1B\[[0-9;]*m/g, '');
    const stepMatch = errMsg.match(/\[(.+?)\]/);
    const codeMatch = errMsg.match(/HTTP (\d+)/);
    const urlMatch  = errMsg.match(/— (.+?)\n/);
    const bodyMatch = errMsg.match(/Body: ([\s\S]+)/);

    // Capture test.step() hierarchy từ Playwright
    const steps: StepRecord[] = result.steps
      .filter(s => s.category === 'test.step')
      .map(s => ({
        title:    s.title,
        status:   s.error ? 'FAILED' : 'PASSED',
        duration: Math.round(s.duration / 1000),
        error:    s.error ? clean(s.error.message ?? '').slice(0, 200) : '',
      }));

    let httpLog: any[] = [];
    try { httpLog = JSON.parse(ann('httpLog')); } catch {}

    this.records.push({
      index:        this.runIndex,
      testName:     test.title,
      country:      ann('country'),
      baseUrl:      ann('baseUrl'),
      status,
      orderId:      ann('orderId'),
      so:           ann('so'),
      bin:          ann('bin'),
      sku:          ann('sku'),
      errorStep:    stepMatch?.[1]  ?? '-',
      errorCode:    codeMatch?.[1]  ?? '-',
      errorUrl:     urlMatch?.[1]?.trim() ?? '-',
      errorMessage: bodyMatch?.[1]  ?? (status === 'FAIL' ? clean(errMsg).slice(0, 300) : '-'),
      duration:     Math.round(result.duration / 1000),
      steps,
      httpLog,
    });
  }

  async onEnd(result: FullResult) {
    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

    const country      = this.records[0]?.country ?? process.env.COUNTRY ?? 'VN';
    const baseUrl      = this.records[0]?.baseUrl || 'N/A';
    const iso          = new Date().toISOString().slice(0, 19);
    const fileStamp    = iso.replace(/[-T:]/g, '');
    const display      = iso.replace('T', ' ');
    const totalSeconds = Math.round(result.duration / 1000);
    const filepath     = path.join(REPORT_DIR, `${fileStamp}-${country}.html`);

    fs.writeFileSync(filepath, this.buildHtml(display, country, baseUrl, totalSeconds), 'utf8');
    console.log(`\nReport saved: ${filepath}`);

    this.rotateOldReports();

    if (process.env.OPEN_REPORT !== 'false') {
      const abs = path.resolve(filepath);
      if (process.platform === 'win32') {
        spawnSync('cmd.exe', ['/c', 'start', '', abs], { stdio: 'ignore' });
      } else {
        spawnSync('open', [abs], { stdio: 'ignore' });
      }
    }
  }

  private rotateOldReports() {
    const files = fs.readdirSync(REPORT_DIR).filter(f => f.endsWith('.html')).sort();
    while (files.length > MAX_REPORTS) {
      const oldest = files.shift()!;
      fs.unlinkSync(path.join(REPORT_DIR, oldest));
      console.log(`Report rotated (max=${MAX_REPORTS}): ${oldest}`);
    }
  }

  private escape(str: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private fmtDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  private buildHtml(datetime: string, country: string, baseUrl: string, totalSeconds: number): string {
    const total    = this.records.length;
    const pass     = this.records.filter(r => r.status === 'PASS').length;
    const fail     = total - pass;
    const passRate = total > 0 ? Math.round(pass / total * 100) : 0;
    const startStr = this.startTime.toISOString().slice(0, 19).replace('T', ' ');

    // ── Section 1: Test Execution Summary ──────────────────────────────────
    const summarySection = `
    <section class="card">
      <h2 class="card-title">&#x1F4CB; Test Execution Summary</h2>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-val">${total}</div><div class="stat-lbl">Total</div></div>
        <div class="stat-box pass-box"><div class="stat-val pass">${pass}</div><div class="stat-lbl">Passed</div></div>
        <div class="stat-box fail-box"><div class="stat-val fail">${fail}</div><div class="stat-lbl">Failed</div></div>
        <div class="stat-box"><div class="stat-val">${passRate}%</div><div class="stat-lbl">Pass Rate</div></div>
        <div class="stat-box"><div class="stat-val">${this.fmtDuration(totalSeconds)}</div><div class="stat-lbl">Duration</div></div>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${passRate}%"></div>
        </div>
        <span class="progress-lbl">${passRate}%</span>
      </div>
      <div class="meta">Started: ${startStr} &nbsp;|&nbsp; Ended: ${datetime}</div>
    </section>`;

    // ── Section 2: Execution Environment ───────────────────────────────────
    const osName   = process.platform === 'win32' ? `Windows ${os.release()}` :
                     process.platform === 'darwin' ? `macOS ${os.release()}` : `Linux ${os.release()}`;
    const runTimes = process.env.RUN_TIMES ?? '1';

    const envSection = `
    <section class="card">
      <h2 class="card-title">&#x1F310; Execution Environment</h2>
      <table class="env-table">
        <tr>
          <td class="env-key">Country</td><td class="env-val"><b>${this.escape(country)}</b></td>
          <td class="env-key">Run Times</td><td class="env-val">${runTimes}</td>
          <td class="env-key">OS</td><td class="env-val">${this.escape(osName)}</td>
        </tr>
        <tr>
          <td class="env-key">Base URL</td>
          <td class="env-val" colspan="5"><a href="${this.escape(baseUrl)}" target="_blank">${this.escape(baseUrl)}</a></td>
        </tr>
      </table>
    </section>`;

    // ── Section 3: Test Results ─────────────────────────────────────────────
    const resultRows = this.records.map(r => {
      const isFail   = r.status === 'FAIL';
      const expanded = isFail;

      // Test Steps sub-section
      const stepRows = r.steps.map((s, i) => `
        <tr class="${s.status === 'FAILED' ? 'step-fail' : ''}">
          <td style="text-align:center">${i + 1}</td>
          <td>${this.escape(s.title)}</td>
          <td><span class="badge ${s.status === 'PASSED' ? 'badge-pass' : 'badge-fail'}">${s.status}</span></td>
          <td style="text-align:center">${s.duration}s</td>
          <td style="max-width:300px;word-break:break-word;color:#dc2626">${this.escape(s.error)}</td>
        </tr>`).join('');

      const stepsSection = r.steps.length ? `
        <details open>
          <summary class="sub-header">&#x1F9EA; Test Steps (${r.steps.length})</summary>
          <table class="sub-table">
            <tr><th>#</th><th>Step</th><th>Status</th><th>Duration</th><th>Error</th></tr>
            ${stepRows}
          </table>
        </details>` : '';

      // API Calls sub-section
      const apiRows = r.httpLog.map((e, i) => `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td><b>${this.escape(e.step)}</b></td>
          <td style="text-align:center">${this.escape(e.method)}</td>
          <td style="word-break:break-all;overflow-wrap:anywhere">${this.escape(e.url)}</td>
          <td><pre>${this.escape(JSON.stringify(e.requestBody, null, 2))}</pre></td>
          <td style="text-align:center;color:${e.responseStatus >= 400 ? '#dc2626' : '#16a34a'};font-weight:bold">${e.responseStatus}</td>
          <td><pre>${this.escape(JSON.stringify(e.responseBody, null, 2))}</pre></td>
        </tr>`).join('');

      const apiSection = r.httpLog.length ? `
        <details ${isFail ? 'open' : ''}>
          <summary class="sub-header">&#x1F4E1; API Calls — DEV (${r.httpLog.length})</summary>
          <table class="sub-table" style="table-layout:fixed;width:100%">
            <colgroup>
              <col style="width:36px">
              <col style="width:140px">
              <col style="width:56px">
              <col style="width:28%">
              <col style="width:28%">
              <col style="width:56px">
              <col style="width:20%">
            </colgroup>
            <tr><th>#</th><th>Step</th><th>Method</th><th>URL</th><th>Request Body</th><th>Status</th><th>Response</th></tr>
            ${apiRows}
          </table>
        </details>` : '';

      const badge = `<span class="badge ${isFail ? 'badge-fail' : 'badge-pass'}">${r.status}</span>`;

      return `
      <tr class="summary-row${isFail ? ' fail-row' : ''}" onclick="toggleDetail(${r.index})">
        <td style="text-align:center">
          <span class="icon" id="icon-${r.index}">${expanded ? '▼' : '▶'}</span> ${r.index}
        </td>
        <td><b>${this.escape(r.testName)}</b></td>
        <td>${badge}</td>
        <td style="text-align:center">${this.fmtDuration(r.duration)}</td>
        <td>${this.escape(r.orderId)}</td>
        <td>${this.escape(r.so)}</td>
        <td>${this.escape(r.bin)}</td>
        <td style="max-width:160px;word-break:break-all;font-size:0.78rem">${this.escape(r.sku)}</td>
        ${isFail ? `<td style="max-width:200px;word-break:break-word;color:#dc2626;font-size:0.78rem">${this.escape(r.errorStep)} ${r.errorCode !== '-' ? '[' + r.errorCode + ']' : ''}</td>` : '<td>-</td>'}
      </tr>
      <tr id="detail-${r.index}" class="detail-row${isFail ? ' fail-detail' : ''}" style="display:${expanded ? 'table-row' : 'none'}">
        <td colspan="9" style="padding:0;border-top:none">
          <div class="detail-wrap">
            ${stepsSection}
            ${apiSection}
          </div>
        </td>
      </tr>`;
    }).join('');

    const resultsSection = `
    <section class="card">
      <h2 class="card-title">&#x1F9FE; Test Results <small style="font-size:0.8rem;color:#6b7280;font-weight:normal">— click một dòng để expand</small></h2>
      <table>
        <thead>
          <tr>
            <th style="width:60px">#</th>
            <th>Test Name</th>
            <th style="width:80px">Status</th>
            <th style="width:80px">Duration</th>
            <th>OrderId</th>
            <th>SO</th>
            <th>BIN</th>
            <th>SKU</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>${resultRows}</tbody>
      </table>
    </section>`;

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>E2E Report — ${this.escape(country)} ${datetime}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body   { font-family: -apple-system, Arial, sans-serif; margin: 0; padding: 24px 32px;
           background: #f1f5f9; color: #1e293b; font-size: 14px; }
  h1     { font-size: 1.25rem; margin: 0 0 20px; color: #0f172a; }

  /* Card */
  .card  { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.08);
           padding: 20px 24px; margin-bottom: 20px; }
  .card-title { font-size: 1rem; font-weight: 700; margin: 0 0 14px; color: #334155; }

  /* Summary stats */
  .stat-row  { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .stat-box  { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
               padding: 12px 20px; text-align: center; min-width: 90px; }
  .pass-box  { border-color: #86efac; background: #f0fdf4; }
  .fail-box  { border-color: #fca5a5; background: #fef2f2; }
  .stat-val  { font-size: 1.5rem; font-weight: 700; line-height: 1; }
  .stat-lbl  { font-size: 0.72rem; color: #64748b; margin-top: 4px; }
  .pass      { color: #16a34a; }
  .fail      { color: #dc2626; }

  /* Progress bar */
  .progress-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .progress-bar  { flex: 1; height: 10px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg,#22c55e,#16a34a); border-radius: 99px; transition: width .4s; }
  .progress-lbl  { font-weight: 700; color: #16a34a; min-width: 40px; }
  .meta          { font-size: 0.8rem; color: #64748b; }

  /* Env table */
  .env-table     { border-collapse: collapse; width: 100%; }
  .env-key       { font-weight: 600; color: #475569; padding: 5px 12px 5px 0; width: 120px; font-size: 0.82rem; }
  .env-val       { padding: 5px 20px 5px 0; color: #1e293b; font-size: 0.82rem; }

  /* Results table */
  table          { border-collapse: collapse; width: 100%; font-size: 0.82rem; }
  th, td         { border: 1px solid #e2e8f0; padding: 7px 10px; vertical-align: middle; }
  thead th       { background: #f8fafc; font-weight: 600; color: #475569; white-space: nowrap; position: sticky; top: 0; }
  .summary-row   { cursor: pointer; transition: background .12s; }
  .summary-row:hover { background: #f0f9ff !important; }
  .fail-row      { background: #fef2f2; }
  .icon          { font-size: 0.65rem; color: #94a3b8; }

  /* Detail row */
  .detail-row td   { padding: 0 !important; border-top: none; }
  .fail-detail td  { border-left: 3px solid #dc2626; }
  .detail-wrap     { padding: 12px 16px 16px 28px; background: #f8fafc; }

  /* Badge */
  .badge      { display: inline-block; padding: 2px 8px; border-radius: 4px;
                font-size: 0.72rem; font-weight: 700; }
  .badge-pass { background: #dcfce7; color: #15803d; }
  .badge-fail { background: #fee2e2; color: #b91c1c; }

  /* Sub-sections (steps + api) */
  details        { margin-bottom: 10px; }
  details[open] summary { margin-bottom: 6px; }
  .sub-header    { cursor: pointer; font-size: 0.83rem; font-weight: 600; color: #334155;
                   padding: 6px 8px; background: #e2e8f0; border-radius: 4px;
                   user-select: none; list-style: none; }
  .sub-header::-webkit-details-marker { display: none; }
  .sub-table     { border-collapse: collapse; width: 100%; font-size: 0.78rem; margin-top: 2px; }
  .sub-table th, .sub-table td { border: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top; }
  .sub-table th  { background: #e2e8f0; white-space: nowrap; }
  .step-fail td  { background: #fef2f2; }

  pre { margin: 0; white-space: pre-wrap; font-size: 0.72rem; max-height: 160px;
        overflow: auto; background: #fff; padding: 4px 6px; border-radius: 3px;
        border: 1px solid #e2e8f0; }
</style>
</head>
<body>
<h1>E2E Report &mdash; ${this.escape(country)} &nbsp;|&nbsp; ${datetime}</h1>
${summarySection}
${envSection}
${resultsSection}
<script>
  function toggleDetail(idx) {
    const row  = document.getElementById('detail-' + idx);
    const icon = document.getElementById('icon-'   + idx);
    const show = row.style.display === 'none';
    row.style.display = show ? 'table-row' : 'none';
    icon.textContent  = show ? '▼' : '▶';
  }
</script>
</body>
</html>`;
  }
}
