import { test, expect } from '../fixtures/order.fixture.js';

test('Place Order', async ({ orderFlow }) => {
  const result = await orderFlow.placeOrder();

  expect(result.orderId, 'orderId should be returned after checkout').toBeTruthy();
  expect(result.cartNo,  'cartNo should exist after addCart').toBeTruthy();
});
