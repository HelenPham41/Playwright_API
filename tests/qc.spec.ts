import { test, expect } from '../fixtures/flow.fixture.js';

test('QC Order', async ({ orderFlow, pickFlow, qcFlow }) => {
  const { orderId }  = await orderFlow.placeOrder();
  const pickResult   = await pickFlow.pickOrder(orderId);
  const result       = await qcFlow.qcOrder({
    so:            pickResult.so,
    ticketId:      pickResult.ticketId,
    get_sku_codes: pickResult.get_sku_codes,
    orderId,
    orderCode:     pickResult.orderCode,
  });

  expect(result.so,      'SO should be returned').toBeTruthy();
  expect(result.scanned, 'at least 1 SKU should be scanned').toBeGreaterThan(0);
});
