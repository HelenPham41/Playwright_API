import { createClient, requestLog } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError, assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS, ERROR_MSG } from '../constants/status-code.js';
import { OrderPayloadBuilder } from '../payloads/order.payload.js';
import { getScenarioData } from '../test-data/scenario.data.factory.js';

export interface CartInfo { cartNo: string | null; skuCodes: string[] }
export interface AddCartResult { cartNo: string }
export interface CheckoutResult { orderId: string }

export class OrderService {

  private readonly cfg: CountryConfig;
  private readonly payload: OrderPayloadBuilder;

  constructor(
    countryConfig?: CountryConfig,
    payloadBuilder?: OrderPayloadBuilder,
  ) {
    this.cfg = countryConfig ?? getCountryConfig();
    this.payload = payloadBuilder ?? new OrderPayloadBuilder(getScenarioData());
  }

  async checkCart(token: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const body = this.payload.checkCartBody();
    const res = await client.put(this.cfg.endpoints.checkCart, { data: body });
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND], 'checkCart');
    requestLog.push({ step: 'checkCart', method: 'PUT', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: await res.json().catch(() => null) });
  }

  async getCartInfo(token: string): Promise<CartInfo> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.get(
      this.cfg.endpoints.getCartInfo,
      this.cfg.endpoints.getCartInfoParams
        ? { params: this.cfg.endpoints.getCartInfoParams }
        : undefined
    );
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND], 'getCartInfo');

    if (res.status() === HTTP_STATUS.NOT_FOUND) return { cartNo: null, skuCodes: [] };

    const json = await res.json();
    const carts: any[] = json?.data ?? [];
    const cartNo: string | null = carts?.[0]?.cartNo ?? null;
    const skuCodes: string[] = [];

    carts.forEach(cart => {
      cart?.cartItemGroups?.forEach((group: any) => {
        if (group?.sellerGroup !== 'GIFT') {
          group?.items?.forEach((item: any) => {
            if (item?.skuCode) skuCodes.push(item.skuCode);
          });
        }
      });
    });

    requestLog.push({ step: 'getCartInfo', method: 'GET', url: res.url(), requestBody: null, responseStatus: res.status(), responseBody: { cartNo, skuCodes } });
    return { cartNo, skuCodes };
  }

  async removeCart(token: string, cartNo: string, skus: string[]): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const body = this.payload.removeCartBody(cartNo, skus);
    const res = await client.put(this.cfg.endpoints.removeCart, { data: body });
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.NO_CONTENT], 'removeCart');
    requestLog.push({ step: 'removeCart', method: 'PUT', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: await res.json().catch(() => null) });
  }

  async addCart(token: string, cartNo: string | null): Promise<AddCartResult> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const body = this.payload.addCartBody(cartNo);
    const res = await client.post(this.cfg.endpoints.addCart, { data: body });
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.CREATED], 'addCart');

    const json = await res.json();
    requestLog.push({ step: 'addCart', method: 'POST', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: json });
    const newCartNo: string | undefined = json?.data?.[0]?.cartNo;
    if (!newCartNo) throw new ApiError('addCart', res.status(), res.url(), ERROR_MSG.CART_NO_MISSING);

    return { cartNo: newCartNo };
  }

  async updateCart(token: string, cartNo: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const body = this.payload.updateCartBody(cartNo);
    const res = await client.put(this.cfg.endpoints.updateCart, { data: body });
    await assertStatus(res, [HTTP_STATUS.OK], 'updateCart');
    requestLog.push({ step: 'updateCart', method: 'PUT', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: await res.json().catch(() => null) });
  }

  async updatePaymentToCOD(token: string, cartNo: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const body = this.payload.updatePaymentToCODBody(cartNo);
    const res = await client.put(this.cfg.endpoints.updatePaymentToCOD ?? '', { data: body });
    await assertStatus(res, [HTTP_STATUS.OK], 'updatePaymentToCOD');
    requestLog.push({ step: 'updatePaymentToCOD', method: 'PUT', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: await res.json().catch(() => null) });
  }
  async updatePaymentToBankTransfer(token: string, cartNo: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const body = this.payload.updatePaymentToBankTransferBody(cartNo);
    const res = await client.put(this.cfg.endpoints.updatePaymentToCOD ?? '', { data: body });
    await assertStatus(res, [HTTP_STATUS.OK], 'updatePaymentToCOD');
    requestLog.push({ step: 'updatePaymentToCOD', method: 'PUT', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: await res.json().catch(() => null) });
  }
  async checkout(token: string, cartNo: string): Promise<CheckoutResult> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const body = this.payload.checkoutBody(cartNo);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await client.put(this.cfg.endpoints.checkout, { data: body });
        const json = await res.json().catch(() => null);
        const orderId: string | undefined = json?.data?.[0]?.orderId;
        requestLog.push({ step: 'checkout', method: 'PUT', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: json, orderId });
        await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.CREATED], 'checkout');

        if (!orderId) throw new ApiError('checkout', res.status(), res.url(), ERROR_MSG.ORDER_ID_MISSING);

        return { orderId };
      } catch (error) {
        console.log(`checkout | attempt ${attempt} failed`);
        if (attempt === 3) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    throw new Error('checkout failed after 3 attempts');
  }

  async cancelOrder(basicToken: string, orderId: string, orderCode: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const body = this.payload.cancelOrderBody(orderId, orderCode);
    const res = await client.put(this.cfg.endpoints.cancelOrder, { data: body });
    await assertStatus(res, [HTTP_STATUS.OK], 'cancelOrder');
    requestLog.push({ step: 'cancelOrder', method: 'PUT', url: res.url(), requestBody: body, responseStatus: res.status(), responseBody: await res.json().catch(() => null) });
  }
}
