import type { CountryConfig } from '../configs/types.js';

type ReconcileCfg = NonNullable<CountryConfig['reconcileShipper']>;

export class ReconcileShipperPayloadBuilder {

  constructor(private readonly reconcile: ReconcileCfg) {}

  /**
   * 1. Get Payment Session
   * GET /accounting/core/v1/reconcile-session/my
   */
  getPaymentSessionParams() {
    return {
      q: JSON.stringify({
        isDraft: false,
        hubCode: this.reconcile.hubCode,
        reconcileType: 'RIDER_HUB',
        statuses: ['WAIT_TO_PAYMENT'],
      }),
      offset: 0,
      limit: 1,
    };
  }

  /**
   * 2. Get Payment Line
   * GET /accounting/core/v1/reconcile-session/order
   */
  getPaymentLineParams(
    paymentCode: string,
    orderId: number | string,
  ) {
    return {
      q: JSON.stringify({
        reconcileCode: paymentCode,
        statuses: ['INIT'],
        orderID: orderId,
      }),
      offset: 0,
      limit: 5,
    };
  }

  /**
   * 3. Check Order into Reconcile Session
   * PUT /accounting/core/v1/reconcile-session/orders
   */
  checkReconcileOrderBody(
    lineID: number,
    trackingCode: string,
    so: string,
  ) {
    return [
      {
        lineID,
        hubCode: this.reconcile.hubCode,
        referenceCode: this.reconcile.minimalFlow ? so : `${so}-F`,
        trackingCode,
        reconcileType: 'RIDER_HUB',
        carrierCodAmount: 0,
        status: 'CHECKING',
      },
    ];
  }

  /**
   * 4. Driver Confirm Payment
   * PUT /accounting/core/v1/reconcile-session
   */
  confirmPaymentBody(
    reconcileCode: string,
  ) {
    return {
      code: reconcileCode,
      status: 'WAIT_TO_APPROVE',
      reconcileType: 'RIDER_HUB',
    };
  }

  /**
   * 5. Get Reconcile Activity
   * GET /backend/core/activity/v1/activity/list
   */
  getReconcileActivityParams(
    paymentCode: string,
  ) {
    return {
      q: JSON.stringify({
        target: 'reconcile-management',
        primaryKey: paymentCode,
        path: '',
      }),
      offset: 0,
      limit: 50,
      getTotal: true,
    };
  }

  /**
   * 6. Approve Reconcile
   * PUT /backend/accounting/core/v1/reconcile-session
   */
  approveReconcileBody(
    paymentCode: string,
  ) {
    return {
      reconcileType: 'RIDER_HUB',
      code: paymentCode,
      status: 'DONE',
    };
  }
}