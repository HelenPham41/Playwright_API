import { ReconcileShipperService } from '../services/reconcileshipper.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';

export interface ReconcileShipperInput {
  orderId: number | string;
  so: string;
  trackingCode: string;
  riderToken: string;
}

export interface ReconcileShipperResult {
  paymentCode: string;
  lineID: number;
  trackingCode: string;
  so: string;
  confirmPaymentStatus: string;
  confirmPaymentMessage: string;
  activityPrimaryKey: string;
  activityStatus: string;
  approveStatus: string;
  reconcileStatus: string;
  approveCode: string;
}

export class ReconcileShipperFlow {

  private readonly reconcileService: ReconcileShipperService;
  private readonly cfg: CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
    this.reconcileService = new ReconcileShipperService(this.cfg);
  }

  async reconcileShipper(
    input: ReconcileShipperInput,
  ): Promise<ReconcileShipperResult> {

    const basicToken = this.cfg.auth.basicToken;
    const riderToken = input.riderToken;
    const country = process.env.COUNTRY ?? 'UNKNOWN';

    console.log(`===== RECONCILE SHIPPER FLOW ${country} START =====`);

    try {

      console.log('Wait 5s before Get Payment Session...');
      await new Promise(r => setTimeout(r, 5000));

      //--------------------------------------------------
      // Step 1 - Get Payment Session
      //--------------------------------------------------
      const paymentSession =
        await this.reconcileService.getPaymentSession(
          riderToken,
        );

      const paymentCode = paymentSession.data?.[0]?.code;

      console.log('Step 1 | Get Payment Session      : OK');

      //--------------------------------------------------
      // Step 2 - Get Payment Line
      //--------------------------------------------------
      const paymentLine =
        await this.reconcileService.getPaymentLine(
          riderToken,
          paymentCode,
          input.orderId,
        );

      if (paymentLine?.status === 'NOT_FOUND') {
        throw new ApiError(
          'getPaymentLine',
          HTTP_STATUS.OK,
          this.cfg.reconcileShipper?.endpoints.getPaymentLine ?? '',
          `No reconcile_session_order found for orderId: ${input.orderId}`,
        );
      }

      const paymentLineData = paymentLine.data?.[0];

      if (paymentLineData?.orderID?.toString() !== input.orderId.toString()) {
        throw new ApiError(
          'getPaymentLine',
          HTTP_STATUS.OK,
          this.cfg.reconcileShipper?.endpoints.getPaymentLine ?? '',
          `OrderID mismatch — expected ${input.orderId}, got ${paymentLineData?.orderID}`,
        );
      }

      const lineID = paymentLineData?.lineID;

      console.log('Step 2 | Get Payment Line         : OK');

      //--------------------------------------------------
      // Step 3 - Check Reconcile Order
      //--------------------------------------------------
      await this.reconcileService.checkReconcileOrder(
        riderToken,
        lineID,
        input.trackingCode,
        input.so,
      );

      console.log('Step 3 | Check Reconcile Order    : OK');

      //--------------------------------------------------
      // Step 4 - Confirm Payment
      //--------------------------------------------------
      const confirmPaymentResult =
        await this.reconcileService.confirmPayment(
          riderToken,
          paymentCode,
        );

      const confirmPaymentStatus = confirmPaymentResult?.status;
      const confirmPaymentMessage = confirmPaymentResult?.message ?? '';

      console.log('Step 4 | Confirm Payment          : OK');

      //--------------------------------------------------
      // Step 5 - Get Reconcile Activity
      //--------------------------------------------------
      const reconcileActivity =
        await this.reconcileService.getReconcileActivity(
          basicToken,
          paymentCode,
        );

      const activityData = reconcileActivity?.data?.[0];
      const activityPrimaryKey = activityData?.primaryKey;
      const activityStatus = activityData?.data?.status ?? '';

      console.log('Step 5 | Get Reconcile Activity   : OK');

      //--------------------------------------------------
      // Step 6 - Approve Reconcile
      //--------------------------------------------------
      const approveReconcileResult =
        await this.reconcileService.approveReconcile(
          basicToken,
          paymentCode,
        );

      const approveStatus = approveReconcileResult?.status;
      const reconcileStatus = approveReconcileResult?.data?.[0]?.status;
      const approveCode = approveReconcileResult?.data?.[0]?.code;

      console.log('Step 6 | Approve Reconcile        : OK');

      console.log(`===== RECONCILE SHIPPER FLOW ${country} END =====`);

      return {
        paymentCode,
        lineID,
        trackingCode: input.trackingCode,
        so: input.so,
        confirmPaymentStatus,
        confirmPaymentMessage,
        activityPrimaryKey,
        activityStatus,
        approveStatus,
        reconcileStatus,
        approveCode,
      };

    } catch (error) {

      if (error instanceof ApiError) {
        console.error(
          `ReconcileShipper flow failed at: ${error.message}`,
        );
      }

      throw error;
    }
  }
}