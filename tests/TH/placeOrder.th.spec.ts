import { test, expect } from '../../fixtures/order.fixture.js';

test('Place Order - TH', async ({ orderFlow }) => {
  const result = await orderFlow.placeOrder_TH();

  expect(result.tokenWeb, 'bearerToken should be returned after login').toBeTruthy();
  expect(result.cartNo !== undefined,  'cartNo should be returned from getCartInfo').toBeTruthy();
});
