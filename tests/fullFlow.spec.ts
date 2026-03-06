import { test, request } from '@playwright/test';

import { OrderFlow } from '../flows/order.flow';
import { PickFlow } from '../flows/pick.flow';
// import { QCFlow } from '../flows/qc.flow';
// import { PackFlow } from '../flows/pack.flow';

import config from '../configs';
import { QcFlow } from '../flows/qc.flow';

test('Run Full Flow N times', async () => {

  const RUN_TIMES =
    Number(process.env.RUN_TIMES || 1);

  console.log("RUN_TIMES = " + RUN_TIMES);

  const context =
    await request.newContext();


  // Basic token from config
  const basicToken =
    config.basicToken;

  console.log("Basic Token Loaded");


  for (let i = 1; i <= RUN_TIMES; i++) {

    console.log("\n====================");
    console.log(`FULL FLOW RUN #${i}`);
    console.log("====================");


    // 1️⃣ ORDER FLOW (Bearer handled inside)
    const orderFlow =
      new OrderFlow(context);

    const orderResult =
      await orderFlow.run();


    const orderId =
      orderResult.orderId;

    console.log("Order Created:", orderId);


    /// 2️⃣ PICK FLOW
    const pickFlow = new PickFlow();

    const pickResult = await pickFlow.run(
      basicToken,
      orderId
    );
    // Map PickFlow result to QCFlow format
    const qcInput = {
      so: pickResult.so,
      ticketId: pickResult.skuInfo.ticketId,
      skuList: pickResult.skuInfo.skuList
    };

    // 3️⃣ QC FLOW
    const qcFlow = new QcFlow();

    await qcFlow.run(
      basicToken,
      qcInput
    );


    // // 4️⃣ PACK FLOW
    // const packFlow =
    //   new PackFlow();

    // await packFlow.run(
    //   basicToken,
    //   orderId
    // );


    console.log(`FULL FLOW RUN #${i} DONE`);

  }

  await context.dispose();

});