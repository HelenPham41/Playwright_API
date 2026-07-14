import { test as base } from '@playwright/test';
import { OrderFlow } from '../flows/order.flow.js';
import { PickFlow } from '../flows/pick.flow.js';
import { QcFlow } from '../flows/qc.flow.js';
import { PackFlow } from '../flows/pack.flow.js';
import { getCountryConfig } from '../configs/country.factory.js';

type FlowFixtures = {
  orderFlow: OrderFlow;
  pickFlow:  PickFlow;
  qcFlow:    QcFlow;
  packFlow:  PackFlow;
};

/**
 * Resolves COUNTRY from (priority high → low):
 *   1. process.env.COUNTRY  — set manually or via CI
 *   2. testInfo.project.name — set via --project=VN / --project=TH
 *   3. 'VN'                  — default fallback
 */
export const test = base.extend<FlowFixtures>({
  orderFlow: async ({}, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;
    const cfg = getCountryConfig();
    testInfo.annotations.push({ type: 'country', description: country }, { type: 'baseUrl', description: cfg.hosts.order });
    await use(new OrderFlow(cfg));
  },

  pickFlow: async ({}, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;
    const cfg = getCountryConfig();
    testInfo.annotations.push({ type: 'country', description: country }, { type: 'baseUrl', description: cfg.hosts.order });
    await use(new PickFlow(cfg));
  },

  qcFlow: async ({}, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;
    const cfg = getCountryConfig();
    testInfo.annotations.push({ type: 'country', description: country }, { type: 'baseUrl', description: cfg.hosts.order });
    await use(new QcFlow(cfg));
  },

  packFlow: async ({}, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;
    const cfg = getCountryConfig();
    testInfo.annotations.push({ type: 'country', description: country }, { type: 'baseUrl', description: cfg.hosts.order });
    await use(new PackFlow(cfg));
  },
});

export { expect } from '@playwright/test';
