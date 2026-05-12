import type { APIRequestContext } from '@playwright/test';
import { createClient } from '../clients/apiClient.js';
import type { CountryConfig } from '../configs/types.js';
import { getCountryConfig } from '../configs/country.factory.js';
import { ApiError, assertStatus } from '../errors/api.error.js';

export interface CartInfo {
  cartNo: string | null;
  skuCodes: string[];
}

export interface AddCartResult {
  cartNo: string;
}

export interface CheckoutResult {
  orderId: string;
}

export class OrderService {

  private readonly cfg: CountryConfig;

  constructor(_request: APIRequestContext, countryConfig?: CountryConfig) {
    this.cfg = countryConfig ?? getCountryConfig();
  }

  async checkCart(token: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.put(this.cfg.endpoints.checkCart, {
      data: { isSelected: true, isAppliedAll: true },
    });
    await assertStatus(res, [200, 404], 'checkCart');
  }

  async getCartInfo(token: string): Promise<CartInfo> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const res = await client.get(this.cfg.endpoints.getCartInfo, {
      params: this.cfg.endpoints.getCartInfoParams,
    });
    await assertStatus(res, [200, 404], 'getCartInfo');

    if (res.status() === 404) return { cartNo: null, skuCodes: [] };

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
      data: { cartNo, skus, source: this.cfg.orderData.source },
    });
    await assertStatus(res, [200, 204], 'removeCart');
  }

  async addCart(token: string, cartNo: string | null): Promise<AddCartResult> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const d = this.cfg.orderData;

    const res = await client.post(this.cfg.endpoints.addCart, {
      data: {
        sku:          d.sku,
        type:         d.type,
        isDeal:       d.isDeal,
        name:         d.productName,
        price:        d.price,
        quantity:     d.quantity,
        cartNo:       cartNo ?? null,
        page:         d.page,
        sellerID:     d.sellerID,
        sellerCode:   d.sellerCode,
        productId:    d.productId,
        eventSource:  d.eventSource,
        eventScreen:  d.eventScreen,
        host:         d.host,
        recommendSKUs: d.recommendSKUs,
        metadata:     { price_display: String(d.price) },
        source:       d.source,
      },
    });

    await assertStatus(res, [200, 201], 'addCart');

    const json = await res.json();
    const newCartNo: string | undefined = json?.data?.[0]?.cartNo;

    if (!newCartNo) {
      throw new ApiError('addCart', res.status(), res.url(), 'cartNo missing in response');
    }

    return { cartNo: newCartNo };
  }

  async updateCart(token: string, cartNo: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const d = this.cfg.orderData;

    const res = await client.put(this.cfg.endpoints.updateCart, {
      data: {
        customerName:            d.customerName,
        customerPhone:           d.customerPhone,
        customerEmail:           d.customerEmail,
        customerShippingAddress: d.customerShippingAddress,
        customerDistrictCode:    d.customerDistrictCode,
        customerProvinceCode:    d.customerProvinceCode,
        customerWardCode:        d.customerWardCode,
        customerAddressCode:     d.customerAddressCode,
        customerRegionCode:      d.customerRegionCode,
        customerWardName:        d.customerWardName,
        customerDistrictName:    d.customerDistrictName,
        customerProvinceName:    d.customerProvinceName,
        paymentMethod:           d.paymentMethod,
        deliveryMethod:          d.deliveryMethod,
        cartNo,
        ordersCount:             d.ordersCount,
        invoice: {
          code:                 d.invoiceCode,
          invoiceRequest:       true,
          companyName:          d.invoiceCompanyName,
          companyAddress:       d.invoiceCompanyAddress,
          taxCode:              d.invoiceTaxCode,
          isSaveInvoiceInfo:    false,
          isUseCustom:          false,
          email:                d.invoiceEmail,
          isValidated:          true,
          customerTaxGOVStatus: 'DIFF_INFO',
          isDefault:            true,
        },
        isRefuseSplitOrder:    false,
        acceptAdvancePolicies: false,
        source:                d.source,
      },
    });

    await assertStatus(res, [200], 'updateCart');
  }

  async checkout(token: string): Promise<CheckoutResult> {
    const client = await createClient(this.cfg.hosts.web, token, 'bearer');
    const d = this.cfg.orderData;

    const res = await client.put(this.cfg.endpoints.checkout, {
      data: {
        customerName:            d.customerName,
        customerPhone:           d.customerPhone,
        customerEmail:           d.customerEmail,
        customerShippingAddress: d.customerShippingAddress,
        customerDistrictCode:    d.customerDistrictCode,
        customerProvinceCode:    d.customerProvinceCode,
        customerWardCode:        d.customerWardCode,
        customerAddressCode:     d.customerAddressCode,
        customerRegionCode:      d.customerRegionCode,
        customerWardName:        d.customerWardName,
        customerDistrictName:    d.customerDistrictName,
        customerProvinceName:    d.customerProvinceName,
        paymentMethods: [{
          cardList:     d.checkoutPaymentCardList,
          code:         d.checkoutPaymentCode,
          customerTags: d.checkoutPaymentCustomerTags,
          description:  '<p></p>',
        }],
      },
    });

    await assertStatus(res, [200, 201], 'checkout');

    const json = await res.json();
    const orderId: string | undefined = json?.data?.[0]?.orderId;

    if (!orderId) {
      throw new ApiError('checkout', res.status(), res.url(), 'orderId missing in response');
    }

    return { orderId };
  }

  async cancelOrder(basicToken: string, orderId: string, orderCode: string): Promise<void> {
    const client = await createClient(this.cfg.hosts.internal, basicToken, 'basic');
    const res = await client.put(this.cfg.endpoints.cancelOrder, {
      data: {
        orderCode,
        orderId:  Number(orderId),
        status:   'CANCEL',
        note:     'Cancel order for testing purpose',
      },
    });
    await assertStatus(res, [200], 'cancelOrder');
  }
}