import { test, request } from '@playwright/test';
import { OrderFlow } from '../flows/order.flow';

test('Order Flow Test', async () => {

  const apiContext = await request.newContext();

  const orderFlow = new OrderFlow(apiContext);

  await orderFlow.run();

});