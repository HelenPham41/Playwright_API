import { test, expect } from '../fixtures/flow.fixture.js';

test('Pick Order', async ({ orderFlow, pickFlow }) => {
  const { orderId } = await orderFlow.placeOrder();
  const result      = await pickFlow.pickOrder(orderId);

  expect(result.so,          'SO should be returned after getSO').toBeTruthy();
  expect(result.orderCode,   'orderCode should be returned from order info').toBeTruthy();
  expect(result.subTicketId, 'subTicketId should be returned after assignPickStaff').toBeTruthy();
  expect(result.otlCode,     'otlCode should be returned after getOTL').toBeTruthy();
});
