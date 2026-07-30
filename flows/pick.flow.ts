import type { APIResponse } from '@playwright/test';
import { PickService } from '../services/pick.service.js';
import { QcService } from '../services/qc.service.js';
import { PackService } from '../services/pack.service.js';
import { OrderService } from '../services/order.service.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { getScenarioData } from '../test-data/scenario.data.factory.js';
import { ApiError, assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';

export interface PickResult {
  so: string;
  orderCode: string | undefined;
  zone: string;
  subTicketId: string;
  productName: string,
  otlCode: string;
  ticketId: string;
  get_sku_codes: any[];
}

export class PickFlow {

  private readonly pickService:  PickService;
  private readonly qcService:    QcService;
  private readonly packService:  PackService;
  private readonly orderService: OrderService;
  private readonly cfg:          CountryConfig;

  constructor(countryConfig?: CountryConfig) {
    this.cfg          = countryConfig ?? getCountryConfig();
    this.pickService  = new PickService(this.cfg);
    this.qcService    = new QcService(this.cfg);
    this.packService  = new PackService(this.cfg);
    this.orderService = new OrderService(this.cfg);
  }

  /**
   * checkout bị block bởi phiếu (SOBD) dang dở của lượt chạy trước — auto-cancel đơn đó rồi retry checkout.
   */
  private async checkoutZoneWithRetry(
    basicToken: string,
    label: string,
    checkout: (basicToken: string) => Promise<APIResponse>,
  ): Promise<void> {
    try {
      await checkout(basicToken);
    } catch (checkoutError) {
      const errMsg = checkoutError instanceof ApiError ? checkoutError.message : String(checkoutError);
      const match  = errMsg.match(/SOBD\d+/);
      if (!match) throw checkoutError;

      const sobdCode   = match[0];
      const orderIdOld = sobdCode.replace('SOBD', '');
      console.log(`Step 9  | ${label} blocked by ${sobdCode}, cancelling stuck order...`);

      const info = await this.pickService.getOrderInfo(basicToken, orderIdOld);
      if (info.orderCode) {
        await this.orderService.cancelOrder(basicToken, orderIdOld, info.orderCode);
        console.log(`Step 9  | Cancelled ${sobdCode} OK, retry ${label}...`);
      }
      await checkout(basicToken);
    }
  }

  async pickOrder(orderId: string): Promise<PickResult> {
    const basicToken = this.cfg.auth.basicToken;
    const country    = process.env.COUNTRY ?? 'UNKNOWN';
    console.log(`===== PICK FLOW ${country} START =====`);

    try {
      // Step 1 — Get Order Info
      const orderInfo = await this.pickService.getOrderInfo(basicToken, orderId);
      if (orderInfo.price === undefined) throw new Error('price not found in order info');
      if (!orderInfo.orderCode) throw new Error('orderCode not found in order info');
      console.log(`Step 1  | Get Order Info   : OK, price=${orderInfo.price}, orderCode=${orderInfo.orderCode}`);

      // Step 2 — Confirm Order
      await this.pickService.confirmOrder(orderId, orderInfo.orderCode);
      console.log('Step 2  | Confirm Order    : OK');

      // Step 3 — Wait before Get SO
      console.log('Step 3  | Wait 5s for SO...');
      await new Promise(r => setTimeout(r, 5000));

      // Step 4 — Get SO
      const so = await this.pickService.getSO(basicToken, orderId);
      console.log(`Step 4  | Get SO           : SO=${so}`);

      // Step 5 — Get Order SKU
      const skuInfo = await this.pickService.getOrderSku(basicToken, so);
      console.log(`Step 5  | Get Order SKU    : ticketId=${skuInfo.ticketId}, skus=${skuInfo.skuList.length}`);

      // Step 6 — Check Pick Ticket
      await this.pickService.checkPickTicket(basicToken, skuInfo.ticketId, so);
      console.log('Step 6  | Check Pick Ticket: OK');

      // Step 7 — Active Pick Ticket
      const activeResult = await this.pickService.activePickTicket(basicToken, skuInfo.ticketId, so);
      console.log(`Step 7  | Active Ticket    : message=${activeResult.message}`);

      // Step 8 — Get Zone and Location
      const { zone, locationCode } = await this.pickService.getZoneAndLocation(basicToken, so);
      console.log(`Step 8  | Zone & Location  : zone=${zone}, location=${locationCode}`);

      // Step 9 — Check In Pick (handles QC/PACK session conflict automatically)
      let checkInResponse = await this.pickService.checkInPick(basicToken, zone);

      if (checkInResponse.status() === HTTP_STATUS.BAD_REQUEST) {
        const message = await checkInResponse.json().then((j: any) => j?.message ?? '').catch(() => '');
        console.log('Step 9  | Check In Pick    : 400, message:', message);

        if (message.includes('công việc QC')) {
          console.log('Step 9  | QC session detected, checking out QC first...');
          await this.checkoutZoneWithRetry(basicToken, 'checkoutQc', bt => this.qcService.checkoutQc(bt));
          checkInResponse = await this.pickService.checkInPick(basicToken, zone);
        } else if (message.includes('công việc PACK')) {
          console.log('Step 9  | PACK session detected, checking out PACK first...');
          await this.checkoutZoneWithRetry(basicToken, 'packCheckout', bt => this.packService.packCheckout(bt));
          checkInResponse = await this.pickService.checkInPick(basicToken, zone);
        }
      }

      await new Promise(r => setTimeout(r, 3000));
      await assertStatus(checkInResponse, [HTTP_STATUS.OK], 'checkInPick');
      console.log('Step 9  | Check In Pick    : OK');

      // Step 10 — Assign Pick Staff
      const subTicketId = await this.pickService.assignPickStaff(basicToken, skuInfo.ticketId, so);
      console.log(`Step 10 | Assign Staff     : subTicketId=${subTicketId}`);

      // Step 11 — Get OTL
      const { firstOTL: otlCode } = await this.pickService.getOTL(basicToken);
      console.log(`Step 11 | Get OTL          : otlCode=${otlCode}`);

      // Step 12 — Get Current Ticket (TH only)
      if (this.cfg.pick?.endpoints.getCurrentTicket) {
        await this.pickService.getCurrentTicket(basicToken, so);
        console.log('Step 12 | Get Current Ticket : OK');
      } else {
        console.log('Step 12 | Get Current Ticket : SKIPPED (not TH)');
      }

      // Step 13 — Use Basket
      await this.pickService.useBasket(basicToken, Number(subTicketId), otlCode);
      console.log('Step 13 | Use Basket       : OK');

      // Step 14 — Check Pick Items
      const { productName } = getScenarioData();
      const { response: pickItemsRes } = await this.pickService.checkPickItems(basicToken, subTicketId, productName, locationCode, so);
      if (!pickItemsRes) throw new Error('checkPickItems returned null response');
      await assertStatus(pickItemsRes, [HTTP_STATUS.OK], 'checkPickItems');
      console.log('Step 14 | Check Pick Items : OK');

      // Step 15 — Complete Pick
      await this.pickService.completePick(basicToken, Number(subTicketId));
      console.log('Step 15 | Complete Pick    : OK');

      // Step 16 — Complete Pick for SO (TH: pick-quantity endpoint not used)
      if (this.cfg.pick?.minimalFlow) {
        console.log('Step 16 | Complete Pick SO : SKIPPED (minimalFlow)');
      } else {
        await this.pickService.completePickForSO(basicToken, so);
        console.log('Step 16 | Complete Pick SO : OK');
      }

      // Step 17 — Checkout Pick
      await this.pickService.checkoutPick(basicToken, zone);
      console.log('Step 17 | Checkout Pick    : OK');

      console.log(`===== PICK FLOW ${country} END =====`);
      return { so, orderCode: orderInfo.orderCode, zone, subTicketId, productName, otlCode, ticketId: skuInfo.ticketId, get_sku_codes: skuInfo.get_sku_codes };

    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Pick flow failed at: ${error.message}`);
      }
      throw error;
    }
  }
}