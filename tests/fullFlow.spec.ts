import { test, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import { OrderFlow } from '../flows/order.flow';
import { PickFlow } from '../flows/pick.flow';
import { QcFlow } from '../flows/qc.flow';
import { PackFlow } from '../flows/pack.flow';

import config from '../configs';

import { writeFullFlowSummary, generateHtmlReport } from '../utils/fullflow-summary';

test.setTimeout(2 * 60 * 1000); // 2 minutes

type FlowResult = {
  run: number;
  orderId: string;
  so: string;
  ticketId: string;
  status: 'PASS' | 'FAIL';
  message?: string;
};

test('Run Full Flow N times', async () => {

  const RUN_TIMES = Number(process.env.RUN_TIMES || 1);
  console.log("RUN_TIMES =", RUN_TIMES);

  /**
   * Use separate folder for custom report
   */
  const reportDir = path.join(process.cwd(), 'fullflow-report');

  try {

    if (fs.existsSync(reportDir)) {
      fs.rmSync(reportDir, { recursive: true, force: true });
    }

  } catch (err) {
    console.log("Cannot delete old report folder. Continue...");
  }

  fs.mkdirSync(reportDir, { recursive: true });

  const context = await request.newContext();
  const basicToken = config.basicToken;

  const summary: FlowResult[] = [];

  try {

    for (let i = 1; i <= RUN_TIMES; i++) {

      console.log("\n====================");
      console.log(`FULL FLOW RUN #${i}`);
      console.log("====================");

      let orderId = '';
      let so = '';
      let ticketId = '';

      try {

        /**
         * ORDER FLOW
         */
        const orderFlow = new OrderFlow(context);
        const orderResult = await orderFlow.run();

        orderId = orderResult.orderId;
        console.log("Order Created:", orderId);

        /**
         * PICK FLOW
         */
        const pickFlow = new PickFlow();
        const pickResult = await pickFlow.run(basicToken, orderId);

        so = pickResult.so;
        ticketId = pickResult.skuInfo.ticketId;

        const flowInput = { so, ticketId, orderId };

        /**
         * QC FLOW
         */
        const qcFlow = new QcFlow();
        await qcFlow.run(basicToken, flowInput);

        /**
         * PACK FLOW
         */
        const packFlow = new PackFlow();
        await packFlow.run(context, basicToken, flowInput);

        summary.push({
          run: i,
          orderId,
          so,
          ticketId,
          status: 'PASS'
        });

        console.log(`FULL FLOW RUN #${i} DONE`);

      } catch (error: any) {

        let message = "Unknown error";

        if (error?.response?.data?.message) {
          message = error.response.data.message;
        } else if (error?.message) {
          message = error.message;
        }

        summary.push({
          run: i,
          orderId,
          so,
          ticketId,
          status: 'FAIL',
          message
        });

        console.error(`FULL FLOW RUN #${i} FAILED`);
        console.error("Message:", message);
      }
    }

  } finally {

    await context.dispose();

    console.log("\n====================");
    console.log("Generating FullFlow Report...");
    console.log("====================");

    writeFullFlowSummary(summary);
    generateHtmlReport();
  }

});