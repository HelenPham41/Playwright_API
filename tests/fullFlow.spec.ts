import { test, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import { OrderFlow } from '../flows/order.flow.js';
import { PickFlow } from '../flows/pick.flow.js';
import { QcFlow } from '../flows/qc.flow.js';
import { PackFlow } from '../flows/pack.flow.js';

import { getCountryConfig } from '../configs/country.factory.js';

import { writeFullFlowSummary, generateHtmlReport } from '../utils/fullflow-summary.js';

test.setTimeout(150 * 60 * 1000); // 150 minutes

type FlowResult = {
  run: number;
  orderId: string;
  so: string;
  ticketId: string;
  status: 'PASS' | 'FAIL';
  message?: string;
  location?: string;
  zoneCode?: string;
  url?: string;
  code?: number;
};

test('Run Full Flow N times', async () => {

  const RUN_TIMES = Number(process.env.RUN_TIMES || 1);
  console.log("RUN_TIMES =", RUN_TIMES);

  const reportDir = path.join(process.cwd(), 'fullflow-report');

  try {
    if (fs.existsSync(reportDir)) {
      fs.rmSync(reportDir, { recursive: true, force: true });
    }
  } catch {
    console.log("Cannot delete old report folder. Continue...");
  }

  fs.mkdirSync(reportDir, { recursive: true });

  const countryConfig = getCountryConfig();
  const context = await request.newContext();
  const basicToken = countryConfig.auth.basicToken;

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
        const orderFlow = new OrderFlow(context, countryConfig);
        const orderResult = await orderFlow.placeOrder();

        orderId = orderResult.orderId;
        console.log("Order Created:", orderId);

        /**
         * PICK FLOW
         */
        let pickResult;

        try {

          const pickFlow = new PickFlow(context);
          pickResult = await pickFlow.run(basicToken, orderId);

          so = pickResult.so;
          ticketId = pickResult.skuInfo.ticketId;

        } catch (error: any) {

          summary.push({
            run: i,
            orderId,
            so,
            ticketId,
            status: 'FAIL',
            message: error?.body,
            code: error?.status,
            url: error?.url
          });

          console.error(`PICK FLOW FAILED`, {
            orderId,
            message: error?.message,
            code: error?.status,
            url: error?.url
          });

          continue; // skip this run
        }

        const flowInput = { so, ticketId, orderId };

        /**
        * QC FLOW
        */
        try {
          const qcFlow = new QcFlow(context);

          await qcFlow.run(basicToken, flowInput);
        } catch (error: any) {
          throw error;
        }

        /**
         * PACK FLOW
         */
        try {

          const packFlow = new PackFlow();
          await packFlow.run(context, basicToken, flowInput);

        } catch (error: any) {

          throw error;
        }

        /**
         * SUCCESS
         */
        summary.push({
          run: i,
          orderId,
          so,
          ticketId,
          status: 'PASS'
        });

        console.log(`FULL FLOW RUN #${i} DONE`);

      } catch (error: any) {

        summary.push({
          run: i,
          orderId,
          so,
          ticketId,
          status: 'FAIL',
          message: error?.body || error?.message || "Unknown error",
          url: error?.url ?? "N/A",
          code: error?.status ?? 0
        });

        console.error(`FULL FLOW RUN #${i} FAILED`, {
          message: error?.message,
          code: error?.status,
          url: error?.url
        });
      }
    }

  } finally {

    await context.dispose();

    console.log("\n====================");
    console.log("Generating FullFlow Report...");
    console.log("====================");

    console.table(summary); // Log summary in table format

    writeFullFlowSummary(summary);
    generateHtmlReport();
  }

});