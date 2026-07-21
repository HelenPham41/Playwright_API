import type { CountryConfig } from '../configs/types.js';

type ReconcileAccountingCfg =
  NonNullable<CountryConfig['reconcileAccounting']>;

export class ReconcileAccountingPayloadBuilder {

  constructor(
    private readonly reconcile: ReconcileAccountingCfg,
  ) { }

  /**
   * 1. Get Reconcile Session
   * GET /accounting/core/v1/reconcile-session
   */
  getReconcileSessionParams() {
    return {
      getTotal: true,
      q: JSON.stringify({
        hubCode: this.reconcile.hubCode,
        reconcileType: this.reconcile.reconcileAccountingType,
        statuses: ['WAIT_TO_PAYMENT'],
      }),
      offset: 0,
      limit: 10,
    };
  }

  /**
   * 2. Get Reconcile Orders
   * GET /accounting/core/v1/reconcile-session/order
   */
  getReconcileOrdersParams(
    reconcileAccountingCode: string,
    totalOrder = 0,
  ) {
    return {
      q: JSON.stringify({
        reconcileCode: reconcileAccountingCode,
        statuses: ['INIT'],
      }),
      offset: 0,
      limit: totalOrder,
    };
  }

  /**
   * 3. Select Orders into Reconcile Session
   * PUT /accounting/core/v1/reconcile-session/orders
   */
  selectReconcileOrdersBody(
    lineAccountingID: number,
    so: string,
    trackingCode: string,
  ) {
    return [
      {
        lineID: lineAccountingID,
        hubCode: this.reconcile.hubCode,
        referenceCode: `${so}-F`,
        trackingCode,
        reconcileType: this.reconcile.reconcileAccountingType,
        carrierCodAmount: 0,
        status: 'CHECKING',
      },
    ];
  }

  /**
   * 4. Driver Confirm Reconcile
   * PUT /accounting/core/v1/reconcile-session
   */
  confirmReconcileBody(
    reconcileDoisoatKetoanCode: string,
  ) {
    return {
      autoDoneReconcile: true,
      code: reconcileDoisoatKetoanCode,
      status: 'WAIT_TO_APPROVE',
      reconcileType: this.reconcile.reconcileAccountingType,
    };
  }

  /**
   * 5. Accounting Approve Reconcile
   * PUT /backend/accounting/core/v1/reconcile-session/approve
   */
  approveReconcileBody(
    reconcileShortCode: string,
    bankAmount: number,
  ) {
    return {
      reconcileShortCode,
      bankAmount,
      transactionCode: '',
      bankProofLink: [],
    };
  }

  /**
   * 6. Get Completed Order
   * GET /backend/marketplace/order/v2/order/list
   */
  getCompletedOrderParams(
    orderId: number | string,
  ) {
    return {
      q: JSON.stringify({
        orderId,
      }),
    };
  }

  /**
   * 7. Get Bill Info
   */
  getBillInfoParams(
    orderId: number | string,
  ) {
    return {
      q: JSON.stringify({
        orderId,
      }),
    };
  };

  /**
   * 8. Update Bill To Complete Order
   */
  updateBillToCompleteOrderBody(
    billCode: string,) {
    return {
      billCode,
      status: 'DONE'
    };
  }
}