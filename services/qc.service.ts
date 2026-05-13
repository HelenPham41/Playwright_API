import type { APIRequestContext, APIResponse } from '@playwright/test';
import { createClient } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import { QcPayloadBuilder, type SkuQrItem } from '../payloads/qc.payload.js';

export interface QrLoopResult {
  total: number;
  scanned: number;
  skipped: number;
}

export class QcService {

  private readonly cfg:     CountryConfig;
  private readonly payload: QcPayloadBuilder;

  constructor(
    _request: APIRequestContext,
    countryConfig?: CountryConfig,
  ) {
    this.cfg     = countryConfig ?? getCountryConfig();
    this.payload = new QcPayloadBuilder(this.qc);
  }

  private get qc() {
    if (!this.cfg.qc) throw new Error(`QC config not defined for country: ${this.cfg.countryCode}`);
    return this.cfg.qc;
  }

  /**
   * POST /backend/warehouse/core/v1/staff-zone-session/check  (CHECK_IN_ZONE)
   */
  async checkInQcZone(basicToken: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.web, basicToken, 'basic');
    const response = await client.post(this.qc.endpoints.staffZoneSession, {
      data: this.payload.checkInQcBody(this.qc.zoneCode),
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'checkInQcZone');
    return response;
  }

  /**
   * GET /backend/warehouse/picking/v1/pick-ticket
   */
  async pickTicket(basicToken: string, so: string): Promise<{ response: APIResponse; data: any }> {
    const client   = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const response = await client.get(this.qc.endpoints.pickTicket, {
      params: this.payload.pickTicketParams(so),
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'pickTicket');
    return { response, data: await response.json() };
  }

  /**
   * Loop: generate QR → GET /backend/operation/qr/v1/qrcode → PUT scan-ticket-item/scan
   * Receives get_sku_codes from pick flow — does not call PickService.
   */
  async processSkuQrLoop(
    basicToken: string,
    so: string,
    ticketId: string,
    get_sku_codes: any[],
  ): Promise<QrLoopResult> {
    const internalClient = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const webClient      = await createClient(this.cfg.hosts.web, basicToken, 'basic');

    const skuList = get_sku_codes as SkuQrItem[];
    const maxFail = 2;
    let failCount = 0;
    let scanned   = 0;
    let skipped   = 0;

    for (let index = 0; index < skuList.length; index++) {
      const item = skuList[index];

      if (!item) { skipped++; continue; }

      console.log(`processSkuQrLoop | SKU ${index + 1}/${skuList.length}: ${item.sku}`);

      const qr = this.payload.generateQrCode(item);
      console.log('processSkuQrLoop | QR:', qr);

      let qrResponse: APIResponse;
      try {
        qrResponse = await internalClient.get(this.qc.endpoints.getQrCode, {
          params:  this.payload.getQrCodeParams(qr),
          timeout: 5000,
        });
      } catch {
        console.log('processSkuQrLoop | getQrCode failed, skip');
        skipped++;
        continue;
      }

      await assertStatus(qrResponse, [HTTP_STATUS.OK], 'getQrCode');

      const qrData = (await qrResponse.json())?.data?.[0];
      if (!qrData) {
        console.log('processSkuQrLoop | QR data empty, skip');
        skipped++;
        continue;
      }

      try {
        await webClient.put(this.qc.endpoints.scanTicketItem, {
          data: this.payload.scanQrBody(ticketId, so, item, qrData),
        });
        console.log(`processSkuQrLoop | scan OK, SKU ${index + 1}`);
        scanned++;
        failCount = 0;
      } catch {
        failCount++;
        console.log(`processSkuQrLoop | scan failed (${failCount}/${maxFail})`);
        if (failCount >= maxFail) {
          console.log('processSkuQrLoop | max failures, stop');
          break;
        }
        index--; // retry same SKU
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`processSkuQrLoop | done: total=${skuList.length}, scanned=${scanned}, skipped=${skipped}`);
    return { total: skuList.length, scanned, skipped };
  }

  /**
   * PUT /backend/warehouse/picking/v1/pick-ticket/v2/update
   */
  async doneQcMoveToPack(basicToken: string, ticketId: string, so: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const response = await client.put(this.qc.endpoints.doneQcMoveToPack, {
      data:    this.payload.doneQcBody(ticketId, so),
      timeout: 3000,
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'doneQcMoveToPack');
    return response;
  }

  /**
   * POST /backend/warehouse/core/v1/staff-zone-session/check  (CHECK_OUT_ZONE)
   */
  async checkoutQc(basicToken: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const response = await client.post(this.qc.endpoints.staffZoneSession, {
      data:    this.payload.checkoutQcBody(this.qc.zoneCode),
      timeout: 3000,
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'checkoutQc');
    return response;
  }
}
