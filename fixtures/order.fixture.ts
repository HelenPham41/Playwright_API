import { test as base } from '@playwright/test';
import { OrderFlow } from '../flows/order.flow.js';
import { getCountryConfig } from '../configs/country.factory.js';

type OrderFixtures = {
  orderFlow: OrderFlow;
};

/**
 * Resolves COUNTRY from (priority high → low):
 *   1. process.env.COUNTRY  — set manually or via CI
 *   2. testInfo.project.name — set via --project=VN / --project=TH
 *   3. 'VN'                  — default fallback
 */
export const test = base.extend<OrderFixtures>({
  orderFlow: async ({ request }, use, testInfo) => {
    const country =
      process.env.COUNTRY ||
      testInfo.project.name ||
      'VN';

    process.env.COUNTRY = country;

    const cfg  = getCountryConfig();
    const flow = new OrderFlow(request, cfg);
    await use(flow);
  },
});

export { expect } from '@playwright/test';
