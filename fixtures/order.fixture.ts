import { test as base } from '@playwright/test';
import { OrderFlow } from '../flows/order.flow.js';
import { getCountryConfig } from '../configs/country.factory.js';

type OrderFixtures = {
  orderFlow: OrderFlow;
};

/**
 * Extends Playwright's base test with an `orderFlow` fixture.
 * Automatically resolves CountryConfig and disposes the HTTP context after each test.
 *
 * Usage in test:
 *   import { test, expect } from '../fixtures/order.fixture.js';
 *   test('Place Order', async ({ orderFlow }) => { ... });
 */
export const test = base.extend<OrderFixtures>({
  orderFlow: async ({ request }, use) => {
    const cfg  = getCountryConfig();
    const flow = new OrderFlow(request, cfg);
    await use(flow);
  },
});

export { expect } from '@playwright/test';
