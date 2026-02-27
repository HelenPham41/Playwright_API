import { APIRequestContext } from '@playwright/test';
import { createClient } from '../clients/apiClient';
import config from '../configs';

export class OrderService {

  constructor(private request: APIRequestContext) { }

  /**
   * Check Cart
   * PASS if 200 or 404
   */
  async checkCart(token: string) {

    const client = await createClient(
      config.hostWeb,
      token,
      'bearer'
    );

    const response = await client.put(
      "/backend/marketplace/order/v2/cart/select",
      {
        data: {
          isSelected: true,
          isAppliedAll: true
        }
      }
    );

    return response;
  }


  /**
   * Get Cart Info
   */
  async getCartInfo(token: string) {

    const client = await createClient(
      config.hostWeb,
      token,
      'bearer'
    );

    const response = await client.get(
      "/backend/marketplace/frontend-apis/v2/screen/cart/info",
      {
        params: {
          queryOption:
            "price,consumedMaxQuantity,sellerInfo,isGetSKUReplace,cartPage",
          getVoucherAuto: "true",
          redeemCodeRemovedStr: "",
          onSort: "false"
        }
      }
    );

    let cartNo: string | null = null;
    let skuCodes: string[] = [];

    if (response.status() === 200) {

      const json = await response.json();

      const carts = json?.data ?? [];

      // Extract cartNo safely
      cartNo = carts?.[0]?.cartNo ?? null;

      // Extract skuCodes safely
      carts.forEach((cart: any) => {

        cart?.cartItemGroups?.forEach((group: any) => {

          if (group?.sellerGroup !== "GIFT") {

            group?.items?.forEach((item: any) => {

              if (item?.skuCode) {
                skuCodes.push(item.skuCode);
              }

            });

          }

        });

      });

    }

    const selectedSkuCodes = skuCodes;

    console.log("\n===== EXTRACTED DATA =====");

    console.log("CartNo = " + cartNo);

    console.log("skuCodes = " + skuCodes);

    console.log("selectedSkuCodes = " + selectedSkuCodes);

    console.log("Cart is empty = "+ (skuCodes.length === 0));

    return {
      response,
      cartNo,
      skuCodes,
      selectedSkuCodes
    };

  }


  /**
   * Remove Cart
   */
  async removeCart(
    token: string,
    cartNo?: string | null,
    skus?: string[]
  ) {

    // Skip if empty
    if (!cartNo || !skus || skus.length === 0) {

      console.log("\n===== REMOVE CART =====");

      console.log("Skip RemoveCart → Cart Empty");

      return {
        status: () => 204
      } as any;

    }

    const client = await createClient(
      config.hostWeb,
      token,
      'bearer'
    );

    const payload = {
      cartNo: cartNo,
      skus: skus,
      source: "thuocsi-web"
    };

    const response = await client.put(
      "/backend/marketplace/order/v2/cart/remove",
      {
        data: payload
      }
    );


    console.log("\n===== REMOVE CART RESPONSE =====");

    console.log("Status: " + response.status());

    return response;

  }
  /**
 * Add Cart
 * Equivalent to JMeter Add Cart
 */
  async addCart(
    token: string,
    cartNo: string | null
  ) {

    const client = await createClient(
      config.hostWeb,
      token,
      'bearer'
    );

    const payload = {

      sku: "MEDX.8G6Q72AX",

      type: "NORMAL",

      isDeal: null,

      name: "Bông tẩy trang tròn mịn calla Bông Bạch Tuyết (g/120mll)",

      price: 2198700,

      quantity: 2,

      cartNo: cartNo ?? null,   // same as ${CartNo_1}

      page: "product/[slug]",

      sellerID: 1,

      sellerCode: "MEDX",

      productId: 2431139,

      eventSource: "product-detail",

      eventScreen: "product-detail",

      host: "web.v2-stg.thuocsi.vn",

      recommendSKUs: "",

      metadata: {
        price_display: "2198700"
      },

      source: "thuocsi-web"

    };
    const response = await client.post(
      "/backend/marketplace/order/v2/cart/add",
      {
        data: payload
      }
    );


    console.log("===== ADD CART RESPONSE =====");

    console.log("Status: " + response.status());

    const text = await response.text();

    let cartNoNew: string | null = null;

    try {

      const json = JSON.parse(text);

      cartNoNew =
        json?.data?.[0]?.cartNo ?? null;

    } catch (e) {

      console.log("Cannot parse AddCart JSON");

    }
    console.log("New CartNo = " + cartNoNew);
    return {
      response,
      cartNo: cartNoNew
    };

  }
  async updateCart(
    token: string,
    cartNo: string
  ) {
    const client = await createClient(
      config.hostWeb,
      token,
      'bearer'
    );

    const response = await client.put(
      '/backend/marketplace/order/v2/cart',
      {
        data: {

          customerName: "[Tech] Hanh Pham",
          customerPhone: "0559948786",
          customerEmail: "hanh.pham@buymed.com",
          customerShippingAddress: "72 Le Thanh Ton",

          customerDistrictCode: "765",
          customerProvinceCode: "79",
          customerWardCode: "26947",

          customerAddressCode: "YFFPHGG3",
          customerRegionCode: "107TQTAR1Y7G",

          customerWardName: "Phường 03",
          customerDistrictName: "Quận Bình Thạnh",
          customerProvinceName: "Thành phố Hồ Chí Minh",

          paymentMethod: "PAYMENT_METHOD_BANK",

          deliveryMethod: "DELIVERY_PLATFORM_NORMAL",

          cartNo: cartNo,

          ordersCount: 151,

          invoice: {
            code: "RHGARL8C",
            invoiceRequest: true,
            companyName: "Công Ty TNHH CIRCA PHARMACY",
            companyAddress:
              "207 Lê Đại Hành, Phường 13, Q11, TP. HCM",
            taxCode: "0317045088",
            isSaveInvoiceInfo: false,
            isUseCustom: false,
            email: "lam.nguyen@buymed.com",
            isValidated: true,
            customerTaxGOVStatus: "DIFF_INFO",
            isDefault: true
          },

          isRefuseSplitOrder: false,
          acceptAdvancePolicies: false,

          source: "thuocsi-web"

        }
      }
    );
    return response;
  }

  /**
  * Checkout Cart
  */
  async checkout(token: string) {

    const client = await createClient(
      config.hostWeb,
      token,
      'bearer'
    );

    const response = await client.put(
      '/backend/marketplace/order/v2/cart/checkout',
      {
        data: {
          customerName: "[Tech] Hanh Pham",
          customerPhone: "0559948786",
          customerEmail: "hanh.pham@buymed.com",

          customerShippingAddress: "72 Le Thanh Ton",
          customerDistrictCode: "765",
          customerProvinceCode: "79",
          customerWardCode: "26947",

          customerAddressCode: "YFFPHGG3",
          customerRegionCode: "107TQTAR1Y7G",

          customerWardName: "Phường 03",
          customerDistrictName: "Quận Bình Thạnh",
          customerProvinceName: "Thành phố Hồ Chí Minh",

          paymentMethods: [
            {
              cardList: "MOMO",
              code: "MOMO",
              customerTags: [
                "13384",
                "TESTCREDIT"
              ],
              description: "<p></p>"
            }
          ]
        }
      }
    );

    const body = await response.json();

    const orderId =
      body?.data?.[0]?.orderId ?? null;

    return {
      response,
      orderId
    };
  }
}