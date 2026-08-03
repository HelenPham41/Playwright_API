import { ReconcileAccountingService } from '../services/reconcileaccounting.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';

// wait durations
const WAIT_3S = 3000;
const WAIT_8S = 8000;
const WAIT_2S = 2000;

// accounting sync between Reconcile Shipper and Reconcile Accounting can lag briefly
const MAX_ORDER_LOOKUP_ATTEMPTS = 5;

export interface ReconcileAccountingInput {
  orderId: number;
  so: string;
  trackingCode: string;
  riderToken: string;
}

export interface ReconcileAccountingResult {
  reconcileCode: string;
  reconcileShortCode: string;
  reconcileStatus: string;
  totalAmount: number;
  confirmStatus: number;
  approveStatus: number;
  completedSaleOrderCode: string;
  completedStatus: string;
  completedSaleOrderStatus: string;
}

export class ReconcileAccountingFlow_COD {

  private readonly reconcileAccountingService: ReconcileAccountingService;
  private readonly cfg: CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
    this.reconcileAccountingService = new ReconcileAccountingService(this.cfg);
  }

  async reconcileAccounting(
    input: ReconcileAccountingInput,
  ): Promise<ReconcileAccountingResult> {

    const basicToken = this.cfg.auth.basicToken;
    const country = process.env.COUNTRY ?? 'UNKNOWN';
    const riderToken = input.riderToken;

    console.log(`===== RECONCILE ACCOUNTING FLOW ${country} START =====`);

    try {

      //----------------------------------------------------------------------
      // Step 1 - Get Reconcile Session
      //----------------------------------------------------------------------
      const session =
        await this.reconcileAccountingService.getReconcileSessionAccounting(
          riderToken,
        );

      console.log('Step 1 | Get Reconcile Session      : OK');

      const reconcile = session?.data?.[0];

      const reconcileAccountingCode = reconcile?.code ?? '';
      const totalOrder = reconcile?.totalOrder ?? 0;

      //----------------------------------------------------------------------
      // Step 2 - Get Reconcile Orders (poll — accounting sync after Reconcile
      // Shipper can lag a few seconds before the order shows up here)
      //----------------------------------------------------------------------
      const expectedReferenceCode = this.cfg.reconcileAccounting?.minimalFlow
        ? input.so
        : `${input.so}-F`;

      let matchedItem: any;
      for (let attempt = 1; attempt <= MAX_ORDER_LOOKUP_ATTEMPTS; attempt++) {
        const order =
          await this.reconcileAccountingService.getReconcileOrdersAccounting(
            riderToken,
            reconcileAccountingCode,
            totalOrder,
          );

        matchedItem = order?.data?.find(
          (item: any) => item.referenceCode === expectedReferenceCode,
        );

        if (matchedItem) break;

        console.log(`Step 2 | Get Reconcile Orders       : "${expectedReferenceCode}" not found yet (attempt ${attempt}/${MAX_ORDER_LOOKUP_ATTEMPTS})`);
        if (attempt < MAX_ORDER_LOOKUP_ATTEMPTS) {
          await new Promise(r => setTimeout(r, WAIT_2S));
        }
      }

      if (!matchedItem) {
        throw new Error(
          `Reconcile Accounting: order with referenceCode "${expectedReferenceCode}" not found in reconcile session "${reconcileAccountingCode}" after ${MAX_ORDER_LOOKUP_ATTEMPTS} attempts`,
        );
      }

      console.log('Step 2 | Get Reconcile Orders       : OK');

      const reconcileDoiSoatKeToanCode = matchedItem.reconcileCode ?? '';
      const lineAccountingID = matchedItem.lineID ?? '';

      //----------------------------------------------------------------------
      // Step 3 - Select Reconcile Orders
      //----------------------------------------------------------------------
      await this.reconcileAccountingService.selectReconcileOrdersAccounting(
        riderToken,
        lineAccountingID,
        input.so,
        input.trackingCode,
      );

      console.log('Step 3 | Select Reconcile Order     : OK');

      //----------------------------------------------------------------------
      // Step 4 - Confirm Reconcile
      //----------------------------------------------------------------------
      const confirm =
        await this.reconcileAccountingService.confirmReconcileAccounting(
          riderToken,
          reconcileDoiSoatKeToanCode,
        );

      const confirmData = confirm?.data?.[0];
      const reconcileAccountingShortCode = confirmData?.shortCode ?? '';
      const totalAmount = Number(confirmData?.totalAmount ?? 0);

      console.log('Step 4 | Confirm Reconcile          : OK');

      //----------------------------------------------------------------------
      // Step 5 - Approve Reconcile
      //----------------------------------------------------------------------
      console.log('Wait 8s before approve reconcile accounting...');
      await new Promise(r => setTimeout(r, WAIT_8S));
      const approve =
        await this.reconcileAccountingService.approveReconcileAccounting(
          basicToken,
          reconcileAccountingShortCode,
          totalAmount,
        );

      console.log('Step 5 | Approve Reconcile          : OK');

      //----------------------------------------------------------------------
      // Step 6 - Get Completed Order (verify sau khi approve)
      //----------------------------------------------------------------------
      console.log('Wait 3s before get completed order...');
      await new Promise(r => setTimeout(r, WAIT_3S));
      const completedOrder =
        await this.reconcileAccountingService.getCompletedOrderAccounting(
          basicToken,
          input.orderId,
        );

      const completed = completedOrder?.data?.[0];
      const completedSaleOrderCode = completed?.saleOrderCode ?? '';
      const completedStatus = completed?.status ?? '';
      const completedSaleOrderStatus = completed?.saleOrderStatus ?? '';

      console.log('Step 6 | Get Completed Order        : OK');

      console.log(`===== RECONCILE ACCOUNTING FLOW ${country} END =====`);

      return {
        reconcileCode: reconcileDoiSoatKeToanCode,
        reconcileShortCode: reconcileAccountingShortCode,
        reconcileStatus: 'DONE',
        totalAmount,
        confirmStatus: HTTP_STATUS.OK,
        approveStatus: approve.status(),
        completedSaleOrderCode,
        completedStatus,
        completedSaleOrderStatus,
      };

    } catch (error) {

      if (error instanceof ApiError) {
        console.error(
          `ReconcileAccounting flow failed: ${error.message}`,
        );
      }

      throw error;
    }
  }
}