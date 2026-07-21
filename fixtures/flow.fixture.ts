import { test as base } from '@playwright/test';
import { OrderFlow_COD } from '../flows/order_COD.flow.js';
import { OrderFlow_BankTransfer } from '../flows/order_bankTransfer.flow.js';
import { PickFlow } from '../flows/pick.flow.js';
import { QcFlow } from '../flows/qc.flow.js';
import { PackFlow } from '../flows/pack.flow.js';
import { BookShipperFlow } from '../flows/bookshipper.flow.js';
import { DeliveryFlow } from '../flows/delivery.flow.js';
import { ReconcileShipperFlow } from '../flows/reconcileshipper.flow.js';
import { ReconcileAccountingFlow_COD } from '../flows/reconcileaccounting_COD.flow.js';
import { ReconcileAccountingFlow_BankTransfer } from '../flows/reconcileaccounting_bankTransfer.flow.js';
import { getCountryConfig } from '../configs/country.factory.js';

type FlowFixtures = {
  orderFlow_COD: OrderFlow_COD;
  orderFlow_BankTransfer: OrderFlow_BankTransfer;
  pickFlow: PickFlow;
  qcFlow: QcFlow;
  packFlow: PackFlow;
  bookShipperFlow: BookShipperFlow;
  deliveryFlow: DeliveryFlow;
  reconcileShipperFlow: ReconcileShipperFlow;
  reconcileAccountingFlow_COD: ReconcileAccountingFlow_COD;
  reconcileAccountingFlow_BankTransfer: ReconcileAccountingFlow_BankTransfer;
};

/**
 * Resolves COUNTRY from (priority high → low):
 *   1. process.env.COUNTRY
 *   2. testInfo.project.name
 *   3. VN
 */
export const test = base.extend<FlowFixtures>({
  orderFlow_COD: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new OrderFlow_COD(cfg));
  },

  orderFlow_BankTransfer: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new OrderFlow_BankTransfer(cfg));
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

  reconcileAccountingFlow_COD: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new ReconcileAccountingFlow_COD(cfg));
  },

  reconcileAccountingFlow_BankTransfer: async ({ }, use, testInfo) => {
    const country = process.env.COUNTRY || testInfo.project.name || 'VN';
    process.env.COUNTRY = country;

    const cfg = getCountryConfig();

    testInfo.annotations.push(
      { type: 'country', description: country },
      { type: 'baseUrl', description: cfg.hosts.order },
    );

    await use(new ReconcileAccountingFlow_BankTransfer(cfg));
  },
});

export { expect } from '@playwright/test';
