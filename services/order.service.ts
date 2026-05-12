import type { APIRequestContext } from '@playwright/test';
import { createClient } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError, assertStatus } from '../errors/api.error.js';
import { HTTP_STATUS, ERROR_MSG } from '../constants/status-code.js';
import { OrderPayloadBuilder } from '../payloads/order.payload.js';
import { getOrderData } from '../test-data/order.data.factory.js';

export interface CartInfo       { cartNo: string | null; skuCodes: string[] }
export interface AddCartResult  { cartNo: string }
export interface CheckoutResult { orderId: string }

export class OrderService {

  private readonly cfg:     CountryConfig;
  private readonly payload: OrderPayloadBuilder;

  constructor(
    _request: APIRequestContext,
    countryConfig?: CountryConfig,
    payloadBuilder?: OrderPayloadBuilder,
  ) {
    this.cfg     = countryConfig  ?? getCountryConfig();
    this.payload = payloadBuilder ?? new OrderPayloadBuilder(getOrderData());
  }

  async checkCart(token: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.put(this.cfg.endpoints.checkCart, {
      data: { isSelected: true, isAppliedAll: true },
    });
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND], 'checkCart');
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

    return { cartNo, skuCodes };
  }

  async removeCart(token: string, cartNo: string, skus: string[]): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.put(this.cfg.endpoints.removeCart, {
      data: { cartNo, skus, source: getOrderData().source },
    });
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.NO_CONTENT], 'removeCart');
  }

  async addCart(token: string, cartNo: string | null): Promise<AddCartResult> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.post(this.cfg.endpoints.addCart, {
      data: this.payload.addCartBody(cartNo),
    });
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.CREATED], 'addCart');

    const newCartNo: string | undefined = (await res.json())?.data?.[0]?.cartNo;
    if (!newCartNo) throw new ApiError('addCart', res.status(), res.url(), ERROR_MSG.CART_NO_MISSING);

    return { cartNo: newCartNo };
  }

  async updateCart(token: string, cartNo: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.put(this.cfg.endpoints.updateCart, {
      data: this.payload.updateCartBody(cartNo),
    });
    await assertStatus(res, [HTTP_STATUS.OK], 'updateCart');
  }

  async checkout(token: string): Promise<CheckoutResult> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.put(this.cfg.endpoints.checkout, {
      data: this.payload.checkoutBody(),
    });
    await assertStatus(res, [HTTP_STATUS.OK, HTTP_STATUS.CREATED], 'checkout');

    const orderId: string | undefined = (await res.json())?.data?.[0]?.orderId;
    if (!orderId) throw new ApiError('checkout', res.status(), res.url(), ERROR_MSG.ORDER_ID_MISSING);

    return { orderId };
  }

  async cancelOrder(basicToken: string, orderId: string, orderCode: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const res = await client.put(this.cfg.endpoints.cancelOrder, {
      data: { orderCode, orderId: Number(orderId), status: 'CANCEL', note: 'Cancel order for testing purpose' },
    });
    await assertStatus(res, [HTTP_STATUS.OK], 'cancelOrder');
  }
}
