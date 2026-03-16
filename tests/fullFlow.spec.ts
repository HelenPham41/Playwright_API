import { test, expect, request } from '@playwright/test';
import fs from 'fs';

import { OrderFlow } from '../flows/order.flow';
import { PickFlow } from '../flows/pick.flow';
import config from '../configs';
import { QcFlow } from '../flows/qc.flow';
import { PackFlow } from '../flows/pack.flow';

type FlowResult = {
  run: number;
  orderId: string;
  so: string;
  ticketId: string;
  status: 'PASS' | 'FAIL';
};

test('Run Full Flow N times', async () => {

  const RUN_TIMES = Number(process.env.RUN_TIMES || 1);
  console.log("RUN_TIMES = " + RUN_TIMES);

  const context = await request.newContext();
  const basicToken = config.basicToken;

  const summary: FlowResult[] = [];

  for (let i = 1; i <= RUN_TIMES; i++) {

    console.log("\n====================");
    console.log(`FULL FLOW RUN #${i}`);
    console.log("====================");

    let orderId = '';
    let so = '';
    let ticketId = '';

    try {

      // ORDER FLOW
      const orderFlow = new OrderFlow(context);
      const orderResult = await orderFlow.run();

      orderId = orderResult.orderId;
      console.log("Order Created: " + orderId);

      // PICK FLOW
      const pickFlow = new PickFlow();
      const pickResult = await pickFlow.run(basicToken, orderId);

      so = pickResult.so;
      ticketId = pickResult.skuInfo.ticketId;

      const qcInput = { so, ticketId };

      // QC FLOW
      const qcFlow = new QcFlow();
      await qcFlow.run(basicToken, qcInput);

      // PACK FLOW
      const packFlow = new PackFlow();
      await packFlow.run(basicToken, qcInput);

      summary.push({
        run: i,
        orderId,
        so,
        ticketId,
        status: 'PASS'
      });

      console.log(`FULL FLOW RUN #${i} DONE`);

    } catch (error) {

      summary.push({
        run: i,
        orderId,
        so,
        ticketId,
        status: 'FAIL'
      });

      console.error(`FULL FLOW RUN #${i} FAILED`);
      console.error(error);

    }

  }

  await context.dispose();

  // SUMMARY
  const totalPass = summary.filter(r => r.status === 'PASS').length;
  const totalFail = summary.filter(r => r.status === 'FAIL').length;

  const report = {
    totalRuns: RUN_TIMES,
    totalPass,
    totalFail,
    results: summary
  };

  // Write JSON
  fs.writeFileSync(
    'fullflow-summary.json',
    JSON.stringify(report, null, 2)
  );

  // Generate HTML
  const rows = summary.map(r => `
      <tr>
        <td>${r.run}</td>
        <td>${r.orderId}</td>
        <td>${r.so}</td>
        <td>${r.ticketId}</td>
        <td style="color:${r.status === 'PASS' ? 'green' : 'red'}">${r.status}</td>
      </tr>
  `).join('');

  const html = `
  <html>
  <head>
      <title>Full Flow Summary</title>
      <style>
          body { font-family: Arial; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background: #f4f4f4; }
          h1 { color: #333; }
      </style>
  </head>
  <body>

      <h1>Full Flow Execution Summary</h1>

      <p><b>Total Runs:</b> ${RUN_TIMES}</p>
      <p style="color:green"><b>Total Pass:</b> ${totalPass}</p>
      <p style="color:red"><b>Total Fail:</b> ${totalFail}</p>

      <table>
          <tr>
              <th>Run</th>
              <th>OrderId</th>
              <th>SO</th>
              <th>TicketId</th>
              <th>Status</th>
          </tr>
          ${rows}
      </table>

  </body>
  </html>
  `;

  fs.writeFileSync('fullflow-summary.html', html);

  console.log("Summary reports generated:");
  console.log("fullflow-summary.json");
  console.log("fullflow-summary.html");

});


// import { test, request } from '@playwright/test';

// import { OrderFlow } from '../flows/order.flow';
// import { PickFlow } from '../flows/pick.flow';
// import config from '../configs';
// import { QcFlow } from '../flows/qc.flow';
// import { PackFlow } from '../flows/pack.flow';

// test('Run Full Flow N times', async () => {

//   const RUN_TIMES =
//     Number(process.env.RUN_TIMES || 1);

//   console.log("RUN_TIMES = " + RUN_TIMES);

//   const context =
//     await request.newContext();


//   // Basic token from config
//   const basicToken =
//     config.basicToken;

//   console.log("Basic Token Loaded");


//   for (let i = 1; i <= RUN_TIMES; i++) {

//     console.log("\n====================");
//     console.log(`FULL FLOW RUN #${i}`);
//     console.log("====================");


//     // 1️⃣ ORDER FLOW (Bearer handled inside)
//     const orderFlow =
//       new OrderFlow(context);

//     const orderResult =
//       await orderFlow.run();


//     const orderId =
//       orderResult.orderId;

//     console.log("Order Created:"+ orderId);


//     /// 2️⃣ PICK FLOW
//     const pickFlow = new PickFlow();

//     const pickResult = await pickFlow.run(
//       basicToken,
//       orderId
//     );
//     // Map PickFlow result to QCFlow format
//     const qcInput = {
//       so: pickResult.so,
//       ticketId: pickResult.skuInfo.ticketId,
//     };

//     // 3️⃣ QC FLOW
//     const qcFlow = new QcFlow();

//     await qcFlow.run(
//       basicToken,
//       qcInput
//     );


//     // 4️⃣ PACK FLOW
//     const packFlow =
//       new PackFlow();

//     await packFlow.run(
//       basicToken,
//       qcInput
//     );


//     console.log(`FULL FLOW RUN #${i} DONE`);

//   }

//   await context.dispose();

// });

