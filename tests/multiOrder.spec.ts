import { test, request } from '@playwright/test';
import { OrderFlow } from '../flows/order.flow';

test('Run Order Flow N times', async () => {

  const RUN_TIMES =
    Number(process.env.RUN_TIMES || 1);

  console.log("RUN_TIMES = "+ RUN_TIMES);

  const context =
    await request.newContext();

  for (let i = 1; i <= RUN_TIMES; i++) {

    console.log("\n====================");
    console.log(`ORDER RUN #${i}`);
    console.log("====================");

    const flow =
      new OrderFlow(context);

    await flow.run();

  }

  await context.dispose();

});