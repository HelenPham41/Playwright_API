import type { APIResponse } from '@playwright/test';
import { createClient, requestLog } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import { PackPayloadBuilder } from '../payloads/pack.payload.js';

export class PackService {

  private readonly cfg:     CountryConfig;
  private readonly payload: PackPayloadBuilder;

  constructor(countryConfig?: CountryConfig) {
    this.cfg     = countryConfig ?? getCountryConfig();
    this.payload = new PackPayloadBuilder(this.pack);
  }

  private get pack() {
    if (!this.cfg.pack) throw new Error(`Pack config not defined for country: ${this.cfg.countryCode}`);
    return this.cfg.pack;
  }

  /**
   * POST /warehouse/core/v1/staff-zone-session/check  (CHECK_IN_ZONE)
   */
  async packCheckin(basicToken: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body     = this.payload.checkInPackBody();
    const response = await client.post(this.pack.endpoints.staffZoneSession, { data: body });
    await assertStatus(response, [HTTP_STATUS.OK], 'packCheckin');
    requestLog.push({ step: 'packCheckin', method: 'POST', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * PUT /warehouse/picking/v1/pick-ticket/v2/update  (status: PACKING)
   */
  async packPacking(basicToken: string, ticketId: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body     = this.payload.packPackingBody(ticketId);
    const response = await client.put(this.pack.endpoints.updateTicket, { data: body });
    await assertStatus(response, [HTTP_STATUS.OK], 'packPacking');
    requestLog.push({ step: 'packPacking', method: 'PUT', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * GET /warehouse/inventory/v1/location  (first available BIN)
   */
  async getBin(basicToken: string): Promise<{ response: APIResponse; bin: string | null }> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const response = await client.get(this.pack.endpoints.getBin, {
      params:  this.payload.getBinParams(),
      timeout: 3000,
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'getBin');

    const body = await response.json();
    const bin: string | null = body?.data?.[0]?.name ?? null;

    if (!bin) console.warn('getBin | no BIN available');
    else console.log('getBin | bin:', bin);

    requestLog.push({ step: 'getBin', method: 'GET', url: response.url(), requestBody: this.payload.getBinParams(), responseStatus: response.status(), responseBody: { bin } });
    return { response, bin };
  }

  /**
   * POST /warehouse/picking/v1/basket/use
   */
  async addBasket(basicToken: string, ticketId: string, bin: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body     = this.payload.addBasketBody(ticketId, bin);
    const response = await client.post(this.pack.endpoints.addBasket, { data: body, timeout: 7000 });
    await assertStatus(response, [HTTP_STATUS.OK], 'addBasket');
    requestLog.push({ step: 'addBasket', method: 'POST', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * PUT /warehouse/picking/v1/pick-ticket/v2/update  (status: WAIT_TO_DELIVERY with SO)
   */
  async updateTicket(basicToken: string, ticketId: string, so: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body     = this.payload.updateTicketBody(ticketId, so);
    const response = await client.put(this.pack.endpoints.updateTicket, { data: body });
    await assertStatus(response, [HTTP_STATUS.OK], 'updateTicket');
    requestLog.push({ step: 'updateTicket', method: 'PUT', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * PUT /warehouse/picking/v1/pick-ticket/v2/update  (status: WAIT_TO_DELIVERY, finalize)
   */
  async packComplete(basicToken: string, ticketId: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body     = this.payload.packCompleteBody(ticketId);
    const response = await client.put(this.pack.endpoints.updateTicket, { data: body });
    await assertStatus(response, [HTTP_STATUS.OK, HTTP_STATUS.FORBIDDEN], 'packComplete');
    requestLog.push({ step: 'packComplete', method: 'PUT', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * POST /warehouse/core/v1/staff-zone-session/check  (CHECK_OUT_ZONE)
   */
  async packCheckout(basicToken: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body     = this.payload.checkOutPackBody();
    const response = await client.post(this.pack.endpoints.staffZoneSession, { data: body, timeout: 3000 });
    await assertStatus(response, [HTTP_STATUS.OK], 'packCheckout');
    requestLog.push({ step: 'packCheckout', method: 'POST', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }
}
