import { test, expect } from '../fixtures/flow.fixture.js';

test('Place Order', async ({ orderFlow }) => {
  const result = await orderFlow.placeOrder();

  expect(result.tokenWeb, 'tokenWeb should be returned after login').toBeTruthy();
  expect(result.cartNo,   'cartNo should be returned after addCart').toBeTruthy();
  expect(result.orderId,  'orderId should be returned after checkout').toBeTruthy();
});