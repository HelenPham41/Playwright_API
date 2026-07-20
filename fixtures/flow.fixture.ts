import { test as base } from '@playwright/test';
import { OrderFlow } from '../flows/order_COD.flow.js';
import { PickFlow } from '../flows/pick.flow.js';
import { QcFlow } from '../flows/qc.flow.js';
import { PackFlow } from '../flows/pack.flow.js';
import { BookShipperFlow } from '../flows/bookshipper.flow.js';
import { DeliveryFlow } from '../flows/delivery.flow.js';
import { ReconcileShipperFlow } from '../flows/reconcileshipper.flow.js';
import { ReconcileAccountingFlow } from '../flows/reconcileaccounting_COD.flow.js';
import { getCountryConfig } from '../configs/country.factory.js';

type FlowFixtures = {
  orderFlow: OrderFlow;
  pickFlow: PickFlow;
  qcFlow: QcFlow;
  packFlow: PackFlow;
  bookShipperFlow: BookShipperFlow;
  deliveryFlow: DeliveryFlow;
  reconcileShipperFlow: ReconcileShipperFlow;
  reconcileAccountingFlow: ReconcileAccountingFlow;
};

/**
 * Resolves COUNTRY from (priority high → low):
 *   1. process.env.COUNTRY
 *   2. testInfo.project.name
 *   3. VN
 */
export const test = base.extend<FlowFixtures>({
  orderFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new OrderFlow(cfg));
  },

  pickFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new PickFlow(cfg));
  },

  qcFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new QcFlow(cfg));
  },

  packFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new PackFlow(cfg));
  },

  bookShipperFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new BookShipperFlow(cfg));
  },

  deliveryFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new DeliveryFlow(cfg));
  },

  reconcileShipperFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new ReconcileShipperFlow(cfg));
  },

  reconcileAccountingFlow: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new ReconcileAccountingFlow(cfg));
  },
});

export { expect } from '@playwright/test';