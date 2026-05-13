import { test as base } from '@playwright/test';
import { OrderFlow } from '../flows/order.flow.js';
import { PickFlow } from '../flows/pick.flow.js';
import { QcFlow } from '../flows/qc.flow.js';
import { getCountryConfig } from '../configs/country.factory.js';

type FlowFixtures = {
  orderFlow: OrderFlow;
  pickFlow:  PickFlow;
  qcFlow:    QcFlow;
};

/**
 * Resolves COUNTRY from (priority high → low):
 *   1. process.env.COUNTRY  — set manually or via CI
 *   2. testInfo.project.name — set via --project=VN / --project=TH
 *   3. 'VN'                  — default fallback
 */
export const test = base.extend<FlowFixtures>({
  orderFlow: async ({ request }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;
    await use(new OrderFlow(request, getCountryConfig()));
  },

  pickFlow: async ({ request }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;
    await use(new PickFlow(request, getCountryConfig()));
  },

  qcFlow: async ({ request }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;
    await use(new QcFlow(request, getCountryConfig()));
  },
});

export { expect } from '@playwright/test';
