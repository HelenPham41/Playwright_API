import { QcService } from '../services/qc.service.js';
import { OrderService } from '../services/order.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError } from '../errors/api.error.js';

export interface QcInput {
  so: string;
  ticketId: string;
  get_sku_codes: any[];
  orderId: string;
  orderCode: string | undefined;
}

export interface QcResult {
  so: string;
  scanned: number;
  skipped: number;
}

export class QcFlow {

  private readonly qcService:    QcService;
  private readonly orderService: OrderService;
  private readonly cfg:          CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg          = countryConfig ?? getCountryConfig();
    this.qcService    = new QcService(this.cfg);
    this.orderService = new OrderService(this.cfg);
  }

  async qcOrder(input: QcInput): Promise<QcResult> {
    const basicToken = this.cfg.auth.basicToken;
    const country    = process.env.COUNTRY ?? 'UNKNOWN';
    console.log(`===== QC FLOW ${country} START =====`);

    const { so, ticketId, get_sku_codes, orderId, orderCode } = input;
    let checkedIn = false;

    try {
      // Step 1 — Check In QC Zone
      await this.qcService.checkInQcZone(basicToken);
      checkedIn = true;
      console.log('Step 1 | Check In QC Zone  : OK');

      // Step 2 — Pick Ticket
      await this.qcService.pickTicket(basicToken, so);
      console.log(`Step 2 | Pick Ticket       : OK, so=${so}`);

      // Step 3 — Scan QR Loop
      const qrResult = await this.qcService.processSkuQrLoop(basicToken, so, ticketId, get_sku_codes);
      console.log(`Step 3 | Scan QR Loop      : total=${qrResult.total}, scanned=${qrResult.scanned}, skipped=${qrResult.skipped}`);

      // Step 4 — Done QC → Move to Pack
      await this.qcService.doneQcMoveToPack(basicToken, ticketId, so);
      console.log('Step 4 | Done QC -> Pack   : OK');

      // Step 5 — Checkout QC
      await this.qcService.checkoutQc(basicToken);
      console.log('Step 5 | Checkout QC       : OK');

      console.log(`===== QC FLOW ${country} END =====`);
      return { so, scanned: qrResult.scanned, skipped: qrResult.skipped };

    } catch (error) {
      if (error instanceof ApiError) console.error(`QC flow failed at: ${error.message}`);

      // Auto-cleanup: giải phóng zone và cancel order để lần chạy sau không bị block
      if (checkedIn) {
        try { await this.qcService.checkoutQc(basicToken); } catch {}
      }
      if (orderCode) {
        try {
          await this.orderService.cancelOrder(basicToken, orderId, orderCode);
          console.log(`QC flow cleanup: cancelled order ${orderId} (${orderCode})`);
        } catch {}
      }

      throw error;
    }
  }
}
