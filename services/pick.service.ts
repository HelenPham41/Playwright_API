import type { APIResponse } from '@playwright/test';
import { createClient, requestLog } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError, assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS } from '../constants/status-code.js';
import { PickPayloadBuilder } from '../payloads/pick.payload.js';

export interface SkuItem {
  sku: string;
  quantity: number;
  saleOrderCode: string;
}

export interface OrderSkuResult {
  ticketId: string;
  so: string;
  sku: string | undefined;
  quantity: number | undefined;
  skuList: SkuItem[];
  get_sku_codes: any[];
}

export class PickService {

  private readonly cfg:     CountryConfig;
  private readonly payload: PickPayloadBuilder;

  constructor(countryConfig?: CountryConfig) {
    this.cfg     = countryConfig ?? getCountryConfig();
    this.payload = new PickPayloadBuilder(this.pick);
  }

  private get pick() {
    if (!this.cfg.pick) throw new Error(`Pick config not defined for country: ${this.cfg.countryCode}`);
    return this.cfg.pick;
  }

  /**
   * GET /backend/marketplace/order/v2/order/list
   * Returns undefined values when order not found — does not throw.
   */
  async getOrderInfo(
    basicToken: string,
    orderId: string,
  ): Promise<{ response: APIResponse | null; price: number | undefined; orderCode: string | undefined }> {
    try {
      const client   = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
      const response = await client.get(this.pick.endpoints.orderList, {
        params: this.payload.getOrderInfoParams(orderId),
      });
      await assertStatus(response, [HTTP_STATUS.OK], 'getOrderInfo');

      const body = await response.json();

      if (!body?.data?.length) {
        console.warn('No order data for orderId:', orderId);
        return { response, price: undefined, orderCode: undefined };
      }

      const price     = body.data[0]?.totalPrice;
      const orderCode = body.data[0]?.orderCode;
      console.log('getOrderInfo | OrderCode:', orderCode, 'Price:', price);
      requestLog.push({ step: 'getOrderInfo', method: 'GET', url: response.url(), requestBody: null, responseStatus: response.status(), responseBody: { orderCode, price } });
      return { response, price, orderCode };

    } catch (error) {
      console.error('getOrderInfo failed:', error);
      return { response: null, price: undefined, orderCode: undefined };
    }
  }

  /**
   * GET /backend/marketplace/order/v2/order/list
   * Polls until saleOrderCode appears (max 10 attempts × 3s).
   */
  async getSO(basicToken: string, orderId: string): Promise<string> {
    const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');

    for (let i = 1; i <= 10; i++) {
      const response = await client.get(this.pick.endpoints.orderList, {
        params: this.payload.getSOParams(orderId),
      });

      console.log(`getSO attempt ${i} | status:`, response.status());

      const json = await response.json();
      const so: string | undefined = json?.data?.[0]?.saleOrderCode;

      if (so) {
        console.log('getSO | SO ready:', so);
        requestLog.push({ step: 'getSO', method: 'GET', url: response.url(), requestBody: null, responseStatus: response.status(), responseBody: { saleOrderCode: so } });
        return so;
      }

      console.log('getSO | not ready, wait 3s');
      await new Promise(r => setTimeout(r, 3000));
    }

    throw new Error('SO not found after retry for orderId: ' + orderId);
  }

  /**
   * GET /warehouse/core/v1/sale-orders
   * Polls until pick ticket and order lines are ready (max 6 attempts × 3s).
   */
  async getOrderSku(basicToken: string, so: string): Promise<OrderSkuResult> {
    const client = await createClient(this.cfg.hosts.order, basicToken, 'basic');

    let jsonData: any;
    let firstOrder: any;
    let get_sku_codes: any[] = [];

    for (let i = 1; i <= 6; i++) {
      const response = await client.get(this.pick.endpoints.saleOrders, {
        params: this.payload.getSaleOrdersParams(so),
      });

      const status = response.status();
      const text   = await response.text();

      if (status !== HTTP_STATUS.OK) {
        console.log('getOrderSku | error status:', status, text);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      if (!text.startsWith('{')) {
        throw new Error('getOrderSku returned HTML instead of JSON');
      }

      jsonData      = JSON.parse(text);
      get_sku_codes = extractSkuCodes(jsonData);
      firstOrder    = jsonData?.data?.[0];

      const ready =
        firstOrder?.pickTicketInfos?.length > 0 &&
        firstOrder?.orderLines?.length > 0 &&
        firstOrder?.orderLines?.some((line: any) => line.pickItems?.length > 0);

      if (ready) {
        requestLog.push({ step: 'getOrderSku', method: 'GET', url: response.url(), requestBody: null, responseStatus: response.status(), responseBody: { so: firstOrder?.orderLines?.[0]?.saleOrderCode, ticketId: firstOrder?.pickTicketInfos?.[0]?.pickTicketId } });
        break;
      }

      console.log(`getOrderSku | not ready, wait 3s (attempt ${i})`);
      await new Promise(r => setTimeout(r, 3000));
    }

    if (!firstOrder?.pickTicketInfos?.length) {
      throw new Error('Pick ticket not ready');
    }

    const skuList: SkuItem[] = [];
    for (const line of firstOrder.orderLines ?? []) {
      for (const item of line.pickItems ?? []) {
        skuList.push({ sku: item.sku, quantity: item.quantity, saleOrderCode: line.saleOrderCode });
      }
    }

    return {
      ticketId:     firstOrder.pickTicketInfos[0].pickTicketId,
      so:           firstOrder.orderLines[0].saleOrderCode,
      sku:          skuList[0]?.sku,
      quantity:     skuList[0]?.quantity,
      skuList,
      get_sku_codes,
    };
  }

  /**
   * PUT /backend/marketplace/order/v2/order/status
   */
  async confirmOrder(orderId: string, orderCode: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.internal, this.cfg.auth.basicToken, 'basic');
    const body     = this.payload.confirmOrderBody(orderId, orderCode);
    const response = await client.put(this.pick.endpoints.confirmOrder, { data: body });
    await assertStatus(response, [HTTP_STATUS.OK], 'confirmOrder');
    requestLog.push({ step: 'confirmOrder', method: 'PUT', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * POST /backend/warehouse/picking/v1/pick-ticket/active/check
   */
  async checkPickTicket(basicToken: string, ticketId: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const body     = this.payload.checkPickTicketBody(ticketId);
    const response = await client.post(this.pick.endpoints.checkPickTicket, { data: body });
    await assertStatus(response, [HTTP_STATUS.OK], 'checkPickTicket');
    requestLog.push({ step: 'checkPickTicket', method: 'POST', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * PUT /warehouse/picking/v1/pick-ticket/active
   */
  async activePickTicket(
    basicToken: string,
    ticketId: string,
  ): Promise<{ response: APIResponse; message: string; url: string }> {
    console.log('activePickTicket | waiting 10s...');
    await new Promise(r => setTimeout(r, 10000));

    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const response = await client.put(this.pick.endpoints.activePickTicket, {
      data: this.payload.activePickTicketBody(ticketId),
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'activePickTicket');

    const json = await response.json();
    console.log('activePickTicket | message:', json.message);
    requestLog.push({ step: 'activePickTicket', method: 'PUT', url: response.url(), requestBody: this.payload.activePickTicketBody(''), responseStatus: response.status(), responseBody: { message: json.message } });
    return { response, message: json.message, url: response.url() };
  }

  /**
   * GET /backend/warehouse/picking/v1/pick-ticket-item
   * Polls until locationDetails appear (max 5 attempts × 3s).
   */
  async getZoneAndLocation(
    basicToken: string,
    so: string,
  ): Promise<{ response: APIResponse; zone: string; locationCode: string }> {
    const client  = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const params  = this.payload.getZoneLocationParams(so);
    const headers = this.payload.getZoneLocationHeaders(basicToken, this.cfg.hosts.internal);

    let response!: APIResponse;

    for (let i = 1; i <= 5; i++) {
      console.log(`getZoneAndLocation | attempt ${i}`);
      response = await client.get(this.pick.endpoints.pickTicketItem, { params, headers });

      const json            = await response.json();
      const locationDetails = json?.data?.[0]?.locationDetails;
      console.log('getZoneAndLocation | reserveStatus:', json?.data?.[0]?.reserveStatus);

      if (locationDetails?.length) {
        const zone         = locationDetails[0]?.zone;
        const locationCode = locationDetails[0]?.locationCode;
        console.log('getZoneAndLocation | zone:', zone, 'locationCode:', locationCode);
        requestLog.push({ step: 'getZoneAndLocation', method: 'GET', url: response.url(), requestBody: null, responseStatus: response.status(), responseBody: { zone, locationCode } });
        return { response, zone, locationCode };
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    throw new Error(`Timeout: locationDetails not generated for SO ${so}`);
  }

  /**
   * POST /warehouse/core/v1/staff-zone-session/check  (CHECK_IN_ZONE)
   * Handles PACK session conflict — see CLAUDE.md "API Business Logic" for message handling.
   */
  async checkInPick(basicToken: string, zone: string): Promise<APIResponse> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body     = this.payload.checkInPickBody(zone);
    const response = await client.post(this.pick.endpoints.staffZoneSession, { data: body });
    console.log('checkInPick | status:', response.status());
    requestLog.push({ step: 'checkInPick', method: 'POST', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
    return response;
  }

  /**
   * PUT /warehouse/picking/v1/pick-ticket/assign-manual  (max 3 retries)
   */
  async assignPickStaff(basicToken: string, ticketId: string, so: string): Promise<string> {
    const client = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body   = this.payload.assignPickStaffBody(ticketId, so);

    console.log('assignPickStaff | start');

    for (let retry = 1; retry <= 3; retry++) {
      console.log(`assignPickStaff | attempt ${retry}`);
      const response   = await client.put(this.pick.endpoints.assignPickStaff, { data: body });
      const statusCode = response.status();
      console.log('assignPickStaff | status:', statusCode);

      if (statusCode === HTTP_STATUS.OK) {
        const json        = await response.json();
        const subTicketId = json?.data?.[0]?.ticketId;
        if (!subTicketId) throw new Error('subTicketId not found in response');
        console.log('assignPickStaff | OK, subTicketId:', subTicketId);
        requestLog.push({ step: 'assignPickStaff', method: 'PUT', url: response.url(), requestBody: body, responseStatus: statusCode, responseBody: json });
        return subTicketId;
      }

      if (retry === 3) {
        throw new Error(`assignPickStaff failed after 3 attempts. Last status: ${statusCode}`);
      }

      await new Promise(res => setTimeout(res, 2000));
    }

    throw new Error('Unexpected error in assignPickStaff');
  }

  /**
   * GET /warehouse/inventory/v1/location  (first available OTL)
   */
  async getOTL(basicToken: string): Promise<{ firstOTL: string; response: APIResponse }> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const response = await client.get(this.pick.endpoints.location, {
      params: this.payload.getOTLParams(),
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'getOTL');

    const body     = await response.json();
    const firstOTL = body?.data?.[0]?.code;
    if (!firstOTL) throw new ApiError('getOTL', response.status(), response.url(), 'OTL list is EMPTY');

    console.log('getOTL | firstOTL:', firstOTL);
    requestLog.push({ step: 'getOTL', method: 'GET', url: response.url(), requestBody: null, responseStatus: response.status(), responseBody: { firstOTL } });
    return { firstOTL, response };
  }

  /**
   * POST /warehouse/picking/v1/sub-pick-ticket/basket/use
   */
  async useBasket(
    basicToken: string,
    subTicketId: number,
    otlCode: string,
  ): Promise<{ response: APIResponse; message: string; url: string }> {
    const client   = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const response = await client.post(this.pick.endpoints.useBasket, {
      data: this.payload.useBasketBody(subTicketId, otlCode),
    });
    await assertStatus(response, [HTTP_STATUS.OK], 'useBasket');
    const msg = await response.text();
    requestLog.push({ step: 'useBasket', method: 'POST', url: response.url(), requestBody: this.payload.useBasketBody(subTicketId, otlCode), responseStatus: response.status(), responseBody: msg });
    return { response, message: msg, url: response.url() };
  }

  /**
   * POST /warehouse/picking/v1/sub-pick-ticket-item/pick
   * Loops through SKU list; each item retries up to 3 times.
   */
  async checkPickItems(
    basicToken: string,
    subTicketId: string,
    locationCode: string,
    so: string,
  ): Promise<{ response: APIResponse | null }> {
    console.log('checkPickItems | start');

    const client      = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const { skuList } = await this.getOrderSku(basicToken, so);
    let lastResponse: APIResponse | null = null;

    for (const item of skuList) {
      const payload = this.payload.pickItemBody(subTicketId, item.sku, item.quantity ?? 0, locationCode);

      let response: APIResponse | null = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`checkPickItems | sku=${item.sku} attempt ${attempt}`);
        response = await client.post(this.pick.endpoints.pickItem, { data: payload });
        console.log('checkPickItems | status:', response.status());

        if (response.status() === HTTP_STATUS.OK) {
          console.log('checkPickItems | item OK');
          break;
        }

        if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
      }

      if (!response) throw new Error('No response returned from API');

      lastResponse = response;

      if (response.status() !== HTTP_STATUS.OK) {
        console.log('checkPickItems | item failed, stopping loop');
        return { response };
      }
    }

    console.log('checkPickItems | done');
    requestLog.push({ step: 'checkPickItems', method: 'LOOP', url: this.pick.endpoints.pickItem, requestBody: { skuCount: skuList.length }, responseStatus: lastResponse?.status() ?? 0, responseBody: { done: true } });
    return { response: lastResponse };
  }

  /**
   * PUT /warehouse/picking/v1/sub-pick-ticket/complete  (max 3 retries)
   */
  async completePick(basicToken: string, subTicketId: number): Promise<APIResponse> {
    const client = await createClient(this.cfg.hosts.order, basicToken, 'basic');

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await client.put(this.pick.endpoints.completePick, {
          data: this.payload.completePickBody(subTicketId),
        });
        console.log(`completePick | attempt ${attempt} status:`, response.status());
        await assertStatus(response, [HTTP_STATUS.OK], 'completePick');
        requestLog.push({ step: 'completePick', method: 'PUT', url: response.url(), requestBody: null, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
        return response;
      } catch (error) {
        console.log(`completePick | attempt ${attempt} failed`);
        if (attempt === 3) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    throw new Error('completePick failed after 3 attempts');
  }

  /**
   * PUT /warehouse/picking/v1/pick-ticket/pick-quantity  (max 3 retries)
   */
  async completePickForSO(basicToken: string, so: string): Promise<APIResponse> {
    const client    = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const orderInfo = await this.getOrderSku(basicToken, so);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await client.put(this.pick.endpoints.completePickSO, {
          data: this.payload.completePickSOBody(so, orderInfo.ticketId),
        });
        console.log(`completePickForSO | attempt ${attempt} status:`, response.status());
        await assertStatus(response, [HTTP_STATUS.OK], 'completePickForSO');
        requestLog.push({ step: 'completePickForSO', method: 'PUT', url: response.url(), requestBody: null, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
        return response;
      } catch (error) {
        console.log(`completePickForSO | attempt ${attempt} failed`);
        if (attempt === 3) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    throw new Error('completePickForSO failed after 3 attempts');
  }

  /**
   * POST /warehouse/core/v1/staff-zone-session/check  (CHECK_OUT_ZONE, max 3 retries)
   */
  async checkoutPick(basicToken: string, zone: string): Promise<APIResponse> {
    const client = await createClient(this.cfg.hosts.order, basicToken, 'basic');
    const body   = this.payload.checkoutPickBody(zone);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await client.post(this.pick.endpoints.staffZoneSession, { data: body });
        console.log(`checkoutPick | attempt ${attempt} status:`, response.status());
        await assertStatus(response, [HTTP_STATUS.OK], 'checkoutPick');
        requestLog.push({ step: 'checkoutPick', method: 'POST', url: response.url(), requestBody: body, responseStatus: response.status(), responseBody: await response.json().catch(() => null) });
        return response;
      } catch (error) {
        console.log(`checkoutPick | attempt ${attempt} failed`);
        if (attempt === 3) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    throw new Error('checkoutPick failed after retries');
  }
}

function extractSkuCodes(jsonData: any): any[] {
  const result: any[] = [];
  if (!jsonData?.data?.length) return result;
  for (const order of jsonData.data) {
    for (const line of order?.orderLines ?? []) {
      const items = line.subItems?.length ? line.subItems : [line];
      for (const item of items) {
        result.push({
          sku:              item.sku,
          seller:           item.sellerCode,
          product_id:       item.adminProductId,
          reservedQuantity: item.quantity,
          sellerCodeLength: item.sellerCode?.length ?? 0,
        });
      }
    }
  }
  return result;
}